import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    id = models.CharField(max_length=100, primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=50, default='Member')
    avatar = models.CharField(max_length=255, null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'name']

    def __str__(self):
        return self.name

class Project(models.Model):
    id = models.CharField(max_length=100, primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    status = models.CharField(max_length=50, default='Active')
    color = models.CharField(max_length=20, default='#7c3aed')
    icon = models.CharField(max_length=50, default='layout-dashboard')
    created_by = models.ForeignKey('api.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='created_projects')
    progress = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def recalculate_progress(self):
        total_tasks = self.tasks.count()
        if total_tasks == 0:
            self.progress = 0
        else:
            done_tasks = self.tasks.filter(status='done').count()
            self.progress = int((done_tasks / total_tasks) * 100)
        self.save(update_fields=['progress'])

    def __str__(self):
        return self.name

class Task(models.Model):
    id = models.CharField(max_length=100, primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey('api.Project', on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    status = models.CharField(max_length=50, default='todo')
    priority = models.CharField(max_length=50, default='medium')
    tags = models.JSONField(default=list)
    estimated_hours = models.FloatField(default=0)
    assignee = models.ForeignKey('api.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tasks')
    dependencies = models.ManyToManyField('self', symmetrical=False, blank=True, related_name='dependent_tasks')
    start_date = models.DateTimeField(null=True, blank=True)
    due_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class ActivityLog(models.Model):
    id = models.CharField(max_length=100, primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('api.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='activities')
    action = models.CharField(max_length=255)
    entity_type = models.CharField(max_length=100, null=True, blank=True)
    entity_id = models.CharField(max_length=100, null=True, blank=True)
    entity_name = models.CharField(max_length=255, null=True, blank=True)
    project_id = models.CharField(max_length=100, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} {self.action} {self.entity_name}"

class Notification(models.Model):
    id = models.CharField(max_length=100, primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('api.User', on_delete=models.CASCADE, related_name='notifications')
    content = models.CharField(max_length=500)
    notification_type = models.CharField(max_length=50, default='info')  # info, success, warning
    is_read = models.BooleanField(default=False)
    entity_type = models.CharField(max_length=100, null=True, blank=True)
    entity_id = models.CharField(max_length=100, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.notification_type}] {self.content[:50]}"
