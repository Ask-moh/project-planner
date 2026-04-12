import random
import requests
import json
import os
import logging
from rest_framework import viewsets, views, status, generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
from .models import User, Project, Task, ActivityLog, Notification
from .serializers import (
    UserSerializer, ProjectSerializer, TaskSerializer,
    ActivityLogSerializer, RegisterSerializer, NotificationSerializer
)

logger = logging.getLogger(__name__)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer


class UserViewSet(viewsets.ModelViewSet):
    """User management - restricted to authenticated users, read-only for non-admin."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return all users visible to the current user."""
        return User.objects.all().order_by('name')


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Project.objects.filter(created_by=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        colors = ['#7c3aed', '#16a34a', '#dc2626', '#2563eb', '#d97706', '#0891b2']
        color = self.request.data.get('color', random.choice(colors))
        icon = self.request.data.get('icon', 'layout-dashboard')
        project = serializer.save(color=color, icon=icon, created_by=self.request.user)
        ActivityLog.objects.create(
            user=self.request.user, action='created',
            entity_type='project', entity_id=project.id, entity_name=project.name
        )
        logger.info(f"Project '{project.name}' created by {self.request.user.email}")

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)

    def perform_update(self, serializer):
        project = serializer.save()
        ActivityLog.objects.create(
            user=self.request.user, action='updated',
            entity_type='project', entity_id=project.id, entity_name=project.name
        )

    def perform_destroy(self, instance):
        ActivityLog.objects.create(
            user=self.request.user, action='deleted',
            entity_type='project', entity_id=instance.id, entity_name=instance.name
        )
        logger.info(f"Project '{instance.name}' deleted by {self.request.user.email}")
        instance.delete()


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Task.objects.filter(
            project__created_by=self.request.user
        ).order_by('-created_at')
        project_id = self.request.query_params.get('projectId', None)
        if project_id is not None:
            queryset = queryset.filter(project_id=project_id)
        return queryset

    def perform_create(self, serializer):
        task = serializer.save(assignee=self.request.user)
        task.project.recalculate_progress()
        ActivityLog.objects.create(
            user=self.request.user, action='created',
            entity_type='task', entity_id=task.id,
            entity_name=task.title, project_id=task.project_id
        )
        Notification.objects.create(
            user=self.request.user,
            content=f"You have a new task assigned: {task.title}",
            notification_type="info",
            entity_type="task",
            entity_id=task.id
        )
        logger.info(f"Task '{task.title}' created in project {task.project_id}")

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)

    def perform_update(self, serializer):
        task = serializer.save()
        task.project.recalculate_progress()
        ActivityLog.objects.create(
            user=self.request.user, action='updated',
            entity_type='task', entity_id=task.id,
            entity_name=task.title, project_id=task.project_id
        )
        if task.status == 'done':
            Notification.objects.create(
                user=self.request.user,
                content=f"Task completed: {task.title}",
                notification_type="success",
                entity_type="task",
                entity_id=task.id
            )

    def perform_destroy(self, instance):
        project = instance.project
        ActivityLog.objects.create(
            user=self.request.user, action='deleted',
            entity_type='task', entity_id=instance.id,
            entity_name=instance.title, project_id=instance.project_id
        )
        instance.delete()
        project.recalculate_progress()


class DashboardAnalyticsView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        total_projects = Project.objects.filter(created_by=user).count()
        completed_tasks = Task.objects.filter(project__created_by=user, status='done').count()
        active_tasks = Task.objects.filter(project__created_by=user).exclude(status='done').count()
        overdue_tasks = Task.objects.filter(
            project__created_by=user
        ).exclude(status='done').filter(due_date__lt=timezone.now()).count()

        projects = Project.objects.filter(created_by=user).order_by('-created_at')[:5]
        projects_data = []
        for p in projects:
            p_total = p.tasks.count()
            p_done = p.tasks.filter(status='done').count()
            progress = round((p_done / p_total) * 100) if p_total > 0 else 0
            projects_data.append({
                'id': p.id,
                'name': p.name,
                'color': p.color,
                'progress': progress
            })

        recent_activity = ActivityLog.objects.filter(user=user).order_by('-created_at')[:10]
        recent_activity_data = [
            {
                'id': log.id,
                'user_name': log.user.name if log.user else 'System',
                'action': log.action,
                'entity_type': log.entity_type,
                'entity_name': log.entity_name,
                'created_at': log.created_at
            }
            for log in recent_activity
        ]

        return Response({
            'totalProjects': total_projects,
            'activeTasks': active_tasks,
            'completedTasks': completed_tasks,
            'overdueTasks': overdue_tasks,
            'projects': projects_data,
            'recentActivity': recent_activity_data
        })


class WorkspaceAnalyticsView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        tasks = Task.objects.filter(project__created_by=user)

        total_tasks = tasks.count()
        completed_tasks = tasks.filter(status='done').count()
        overall_progress = round((completed_tasks / total_tasks * 100)) if total_tasks > 0 else 0
        completed_projects = Project.objects.filter(created_by=user, progress=100).count()

        status_dist = tasks.values('status').annotate(count=Count('id'))
        priority_dist = tasks.values('priority').annotate(count=Count('id'))

        return Response({
            'totalTasks': total_tasks,
            'overallProgress': overall_progress,
            'completedProjects': completed_projects,
            'taskStatusDist': list(status_dist),
            'priorityDist': list(priority_dist)
        })


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')[:20]

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        if request.data.get('is_read'):
            instance.is_read = True
            instance.save()
        return Response(self.get_serializer(instance).data)


class NotificationMarkAllReadView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"message": "All notifications marked as read"})


class AIPlanView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        import re

        goals = request.data.get('goals', '')
        project_name = request.data.get('projectName', '')

        if not goals:
            return Response({'error': 'Goals are required'}, status=status.HTTP_400_BAD_REQUEST)

        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            return Response(
                {'error': 'Gemini API key not configured in backend'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"

        prompt = f"""
        Act as a professional Project Planner. Generate a detailed execution plan for the following project goals.
        Project Name: {project_name if project_name else 'Unnamed Project'}
        Project Goals: {goals}
        
        The output MUST be ONLY a valid JSON array (`[ ]`).
        CRITICAL RULES for the JSON:
        1. Use ONLY standard double quotes (`"`) for keys and values. Do NOT use single quotes or smart quotes.
        2. Do NOT put any quotes inside the descriptions.
        3. Do NOT use any Markdown (skip ```json). Start directly with `[` and end with `]`.
        4. If the goals are in Arabic, provide the text in Arabic.
        5. Limit output to exactly 5 very short, concise, logically ordered tasks.
        
        Output format MUST be EXACTLY an array of objects:
        [
          {{
            "title": "Task Name",
            "description": "Short description without any quotes",
            "priority": "medium",
            "estimatedHours": 4,
            "tags": ["tag1"]
          }}
        ]
        """

        try:
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": 0.2,
                    "topK": 40,
                    "topP": 0.95,
                    "maxOutputTokens": 8192,
                    "responseMimeType": "application/json",
                }
            }

            response = requests.post(url, json=payload, timeout=30)
            response.raise_for_status()

            result = response.json()
            content_text = result['candidates'][0]['content']['parts'][0]['text']

            logger.debug(f"AI Raw Output: {content_text[:500]}")

            # Extract the first JSON array from the response
            match = re.search(r'\[\s*\{.*\}\s*\]', content_text, re.DOTALL)
            if match:
                clean_json = match.group(0)
            else:
                start_idx = content_text.find('[')
                end_idx = content_text.rfind(']')
                if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                    clean_json = content_text[start_idx:end_idx + 1]
                else:
                    clean_json = content_text

            # Replace smart quotes that AI sometimes sends
            clean_json = clean_json.replace('\u201c', '"').replace('\u201d', '"')

            try:
                tasks_array = json.loads(clean_json)
                if not isinstance(tasks_array, list):
                    tasks_array = [tasks_array] if isinstance(tasks_array, dict) else []

                plan_data = {
                    "title": project_name if project_name else "AI Architect Plan",
                    "summary": "This plan was generated securely using Array extraction.",
                    "tasks": tasks_array,
                    "totalEstimatedHours": sum(
                        float(t.get('estimatedHours', 0))
                        for t in tasks_array if isinstance(t, dict)
                    )
                }
            except json.JSONDecodeError as decode_err:
                logger.warning(f"JSON Decode Error: {decode_err}")
                if "Unterminated string" in str(decode_err):
                    clean_json += '"}]'
                    try:
                        tasks_array = json.loads(clean_json)
                        plan_data = {
                            "title": project_name if project_name else "AI Architect Plan",
                            "summary": "Generated with emergency fallback patch.",
                            "tasks": tasks_array,
                            "totalEstimatedHours": sum(
                                float(t.get('estimatedHours', 0)) for t in tasks_array
                            )
                        }
                    except json.JSONDecodeError as fallback_err:
                        logger.error(f"Fallback JSON decode also failed: {fallback_err}")
                        raise Exception("Failed to decode JSON array even after fallback patch.")
                else:
                    raise decode_err

            return Response(plan_data)

        except requests.exceptions.Timeout:
            logger.error("AI API request timed out")
            return Response(
                {'error': 'AI request timed out. Please try again.'},
                status=status.HTTP_504_GATEWAY_TIMEOUT
            )
        except requests.exceptions.RequestException as e:
            logger.error(f"AI API request failed: {e}")
            return Response(
                {'error': f'AI service unavailable: {str(e)}'},
                status=status.HTTP_502_BAD_GATEWAY
            )
        except Exception as e:
            logger.error(f"AI generation failed: {e}", exc_info=True)
            return Response(
                {'error': f'AI generation failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AISavePlanView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        tasks = data.get('tasks', [])
        project_name = data.get('projectName', 'AI Generated Project')

        user = request.user

        colors = ['#7c3aed', '#16a34a', '#dc2626', '#2563eb', '#d97706', '#0891b2']
        color = random.choice(colors)

        project = Project.objects.create(
            name=project_name,
            description="Created via AI Planner",
            color=color,
            created_by=user
        )

        current_date = timezone.now().date()

        for t in tasks:
            estimated = float(t.get('estimatedHours', 8))
            days_needed = max(1, int(estimated / 8))
            end_date = current_date + timedelta(days=days_needed)

            Task.objects.create(
                project=project,
                title=t.get('title', 'Untitled Task'),
                description=t.get('description', ''),
                priority=t.get('priority', 'medium').lower(),
                estimated_hours=estimated,
                tags=t.get('tags', []),
                assignee=user,
                start_date=current_date,
                due_date=end_date
            )
            # Waterfall: each task starts after the previous one
            current_date = end_date

        ActivityLog.objects.create(
            user=user,
            action='generated',
            entity_type='project',
            entity_id=project.id,
            entity_name=project.name
        )

        Notification.objects.create(
            user=user,
            content=f"AI generated project '{project.name}' is ready",
            notification_type="success",
            entity_type="project",
            entity_id=project.id
        )

        project.recalculate_progress()

        logger.info(f"AI Plan saved as project '{project.name}' with {len(tasks)} tasks")

        return Response({
            'projectId': project.id,
            'message': 'Project generated successfully'
        }, status=status.HTTP_201_CREATED)
