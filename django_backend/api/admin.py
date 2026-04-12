from django.contrib import admin
from .models import User, Project, Task, ActivityLog, Notification


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['email', 'name', 'role', 'is_active', 'date_joined']
    list_filter = ['role', 'is_active']
    search_fields = ['name', 'email']
    ordering = ['-date_joined']


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'status', 'progress', 'created_by', 'created_at']
    list_filter = ['status']
    search_fields = ['name', 'description']
    ordering = ['-created_at']


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'project', 'status', 'priority', 'assignee', 'due_date']
    list_filter = ['status', 'priority']
    search_fields = ['title', 'description']
    ordering = ['-created_at']


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'action', 'entity_type', 'entity_name', 'created_at']
    list_filter = ['action', 'entity_type']
    ordering = ['-created_at']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'content', 'notification_type', 'is_read', 'created_at']
    list_filter = ['notification_type', 'is_read']
    ordering = ['-created_at']
