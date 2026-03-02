from django.contrib.auth import login
from rest_framework.authtoken.models import Token
from django.utils.deprecation import MiddlewareMixin

class TokenAuthMiddleware(MiddlewareMixin):
    def process_request(self, request):
        if not request.user.is_authenticated:
            auth_header = request.META.get('HTTP_AUTHORIZATION', '')
            if auth_header.startswith('Token '):
                token_key = auth_header.split(' ')[1]
                try:
                    token = Token.objects.get(key=token_key)
                    request.user = token.user
                except Token.DoesNotExist:
                    pass
            elif 'auth_token' in request.COOKIES:
                token_key = request.COOKIES['auth_token']
                try:
                    token = Token.objects.get(key=token_key)
                    request.user = token.user
                    
                    # CRITICAL FIX: Tell Django which backend to use before logging in
                    token.user.backend = 'django.contrib.auth.backends.ModelBackend'
                    
                    # Now it is safe to create the session
                    login(request, token.user) 
                    
                except Token.DoesNotExist:
                    pass