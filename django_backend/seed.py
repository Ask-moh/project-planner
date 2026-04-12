import os
import django
import random
from datetime import timedelta
from django.utils import timezone

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import User, Project, Task, ActivityLog, Notification

def run_seed():
    print("Starting Database Seeding Process...")

    # Clear existing test data if necessary, or just keep adding.
    # We will just clear existing seed data to prevent massive inflation if run multiple times.
    print("Cleaning old data...")
    Task.objects.all().delete()
    Project.objects.all().delete()
    ActivityLog.objects.all().delete()
    Notification.objects.all().delete()
    # Let's keep the admin user, but delete specifically seeded users
    User.objects.filter(email__contains='seed.com').delete()

    print("Creating Users...")
    users = []
    for i in range(1, 4):
        user = User.objects.create_user(
            username=f'user{i}@seed.com',
            email=f'user{i}@seed.com',
            password='admin123',
            name=f'Demo User {i}'
        )
        users.append(user)
    
    main_user = users[0]
    print(f"Created main demo user: {main_user.email} (password: admin123)")

    colors = ['#7c3aed', '#16a34a', '#dc2626', '#2563eb', '#d97706', '#0891b2']
    icons = ['layout-dashboard', 'briefcase', 'code', 'rocket']

    print("Creating Projects and Tasks...")
    projects_data = [
        {"name": "Website Redesign", "desc": "Revamp the main corporate website.", "num_tasks": 12},
        {"name": "Mobile App Launch", "desc": "Release v1.0 of the iOS app.", "num_tasks": 8},
        {"name": "Backend Migration", "desc": "Move to Django & PostgreSQL.", "num_tasks": 15},
        {"name": "Marketing Campaign", "desc": "Q3 Social Media Strategy.", "num_tasks": 5},
    ]

    statuses = ['todo', 'in_progress', 'review', 'done']
    priorities = ['low', 'medium', 'high', 'critical']
    
    for pd in projects_data:
        project = Project.objects.create(
            name=pd["name"],
            description=pd["desc"],
            color=random.choice(colors),
            icon=random.choice(icons),
            created_by=main_user
        )
        
        ActivityLog.objects.create(
            user=main_user,
            action='created',
            entity_type='project',
            entity_id=project.id,
            entity_name=project.name
        )
        
        # Create Tasks
        created_tasks = 0
        now = timezone.now()
        for i in range(pd["num_tasks"]):
            status = random.choice(statuses)
            
            # 20% chance of overdue task
            if status != 'done' and random.random() < 0.2:
                due_date = now - timedelta(days=random.randint(1, 10))
            else:
                due_date = now + timedelta(days=random.randint(1, 30))

            task = Task.objects.create(
                project=project,
                title=f'{project.name} - Task {i+1}',
                description=f'Auto generated task for {project.name}',
                status=status,
                priority=random.choice(priorities),
                estimated_hours=random.randint(1, 8),
                assignee=main_user,
                due_date=due_date
            )
            created_tasks += 1
            
            # Log some done tasks as activity
            if status == 'done':
                ActivityLog.objects.create(
                    user=main_user,
                    action='completed',
                    entity_type='task',
                    entity_id=task.id,
                    entity_name=task.title,
                    project_id=project.id
                )

        project.recalculate_progress()
        print(f"  -> Project '{project.name}' created with {created_tasks} tasks (Progress: {project.progress}%)")

    print("Creating Notifications...")
    notifications = [
        ("AI generated project 'Website Redesign' is ready", "success"),
        ("You have an overdue task on 'Mobile App Launch'", "warning"),
        ("Project Planner v1.0 has new features available", "info"),
        ("User 2 commented on your task", "info"),
        ("5 tasks were marked as completed in Backend Migration", "success"),
    ]

    for content, type_ in notifications:
        Notification.objects.create(
            user=main_user,
            content=content,
            notification_type=type_,
            is_read=random.choice([True, False])
        )

    print("\nSeeding Completed Successfully!")
    print("\nLogin with:")
    print("Email: user1@seed.com")
    print("Password: admin123")

if __name__ == '__main__':
    run_seed()
