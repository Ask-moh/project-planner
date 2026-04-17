from rest_framework_simplejwt.authentication import JWTAuthentication
from django.conf import settings

class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        # 1. Try to get the token from the header (default behavior)
        header = self.get_header(request)
        if header is not None:
            raw_token = self.get_raw_token(header)
            if raw_token is not None:
                return self.get_user(self.get_validated_token(raw_token)), self.get_validated_token(raw_token)

        # 2. If not in header, try getting it from cookies
        # Check if the simple jwt auth cookie setting is defined, default to 'access'
        cookie_name = getattr(settings, 'SIMPLE_JWT', {}).get('AUTH_COOKIE', 'access')
        raw_token = request.COOKIES.get(cookie_name)
        
        if raw_token is not None:
            validated_token = self.get_validated_token(raw_token)
            return self.get_user(validated_token), validated_token
            
        return None
