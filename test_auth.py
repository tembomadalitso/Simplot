import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main.settings')
django.setup()

from django.test import Client, override_settings
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token

User = get_user_model()
user, created = User.objects.get_or_create(username='testlandlord', user_type='LANDLORD')
if created:
    user.set_password('password')
    user.save()

token, _ = Token.objects.get_or_create(user=user)

with override_settings(ALLOWED_HOSTS=['*']):
    client = Client()
    # Try accessing dashboard without cookie
    resp1 = client.get('/dashboard/')
    print("Without cookie status:", resp1.status_code)
    if resp1.status_code == 302:
        print("Redirects to:", resp1.url)
