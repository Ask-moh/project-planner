from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, Project, Task, ActivityLog, Notification


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = ['name', 'email', 'password']

    def validate_password(self, value):
        """Validate password strength using Django's built-in validators."""
        validate_password(value)
        return value

    def validate_email(self, value):
        """Ensure email uniqueness with case-insensitive check."""
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=validated_data['password'],
            name=validated_data['name']
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'role', 'avatar']
        read_only_fields = ['id']


class TaskSerializer(serializers.ModelSerializer):
    assignee_details = UserSerializer(source='assignee', read_only=True)
    project_id = serializers.PrimaryKeyRelatedField(
        source='project', queryset=Project.objects.all()
    )

    class Meta:
        model = Task
        fields = [
            'id', 'project_id', 'title', 'description', 'status',
            'priority', 'tags', 'estimated_hours', 'assignee',
            'assignee_details', 'dependencies', 'start_date',
            'due_date', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'assignee': {'required': False, 'allow_null': True},
            'dependencies': {'required': False},
            'title': {'required': False, 'allow_blank': True},
            'description': {'required': False, 'allow_blank': True, 'allow_null': True},
        }

    def to_internal_value(self, data):
        # Intercept and fix empty strings for UUIDs or assignees
        if 'assignee_id' in data:
            data['assignee'] = data.pop('assignee_id')
        if data.get('assignee') == "":
            data['assignee'] = None
        return super().to_internal_value(data)


class ProjectSerializer(serializers.ModelSerializer):
    total_tasks = serializers.SerializerMethodField()
    completed_tasks = serializers.SerializerMethodField()
    progress = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'status', 'color', 'icon',
            'created_by', 'created_at', 'updated_at',
            'total_tasks', 'completed_tasks', 'progress'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def get_total_tasks(self, obj):
        return obj.tasks.count()

    def get_completed_tasks(self, obj):
        return obj.tasks.filter(status='done').count()

    def get_progress(self, obj):
        total = self.get_total_tasks(obj)
        if total > 0:
            return round((self.get_completed_tasks(obj) / total) * 100)
        return 0


class ActivityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityLog
        fields = '__all__'
        read_only_fields = ['id', 'created_at']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'content', 'notification_type', 'is_read', 'entity_type', 'entity_id', 'created_at']
        read_only_fields = ['id', 'created_at']
