from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, ProjectViewSet, TaskViewSet, 
    DashboardAnalyticsView, WorkspaceAnalyticsView, 
    AIPlanView, AISavePlanView, NotificationViewSet, NotificationMarkAllReadView
)

router = DefaultRouter(trailing_slash=False)
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'users', UserViewSet)
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
    path('analytics/dashboard', DashboardAnalyticsView.as_view()),
    path('analytics/workspace', WorkspaceAnalyticsView.as_view()),
    path('ai/plan', AIPlanView.as_view()),
    path('ai/save-plan', AISavePlanView.as_view()),
    path('notifications/mark-read', NotificationMarkAllReadView.as_view()),
]
