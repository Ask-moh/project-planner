from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from api.views import RegisterView, CookieTokenObtainPairView, CookieTokenRefreshView, LogoutView

def api_home(request):
    return JsonResponse({
        "message": "Welcome to Project Planner API",
        "status": "Secure JWT Backend",
        "endpoints": "/api/",
        "admin": "/admin/"
    })

urlpatterns = [
    path('', api_home, name='api_home'),
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    
    path('api/register/', RegisterView.as_view(), name='api_register'),
    path('api/token/', CookieTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),
    path('api/logout/', LogoutView.as_view(), name='api_logout'),
]
