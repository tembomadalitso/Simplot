# main/settings.py

import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

ROOT_URLCONF      = 'main.urls'
WSGI_APPLICATION  = 'main.wsgi.application'

# ─── SECURITY ─────────────────────────────────────────────────────
# IMPORTANT: Move SECRET_KEY to an environment variable before going to production.
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY')

DEBUG = os.environ.get('DEBUG', 'True') == 'True'

ALLOWED_HOSTS = ['mysit3.pythonanywhere.com', 'localhost', '127.0.0.1']

# Used in password-reset emails — update to your real domain
SITE_URL = os.environ.get('SITE_URL', 'http://localhost:8000')

# ─────────────────────────────────────────────────────────────────
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'djoser',
    'core',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'core.middleware.TokenAuthMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# ─── STATIC / MEDIA ───────────────────────────────────────────────
STATIC_URL       = '/static/'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATIC_ROOT      = BASE_DIR / 'staticfiles'
MEDIA_URL        = '/media/'
MEDIA_ROOT       = os.path.join(BASE_DIR, 'media')

# ─── AUTH ─────────────────────────────────────────────────────────
AUTH_USER_MODEL = 'core.User'
LOGIN_URL       = '/auth/login/'

# ─── STRICT PASSWORD VALIDATION ───────────────────────────────────
# These cover Django admin / djoser flows.
# Our custom endpoints also run validate_password_strength() in the serializer.
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 8}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ─── REST FRAMEWORK ───────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework.authentication.TokenAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
}

# ─── DJOSER ───────────────────────────────────────────────────────
DJOSER = {
    'SERIALIZERS': {
        'user':         'core.serializers.UserSerializer',
        'current_user': 'core.serializers.UserSerializer',
        'user_create':  'core.serializers.DjoserUserCreateSerializer',
    },
}

# ─── EMAIL ────────────────────────────────────────────────────────
# PythonAnywhere: set EMAIL_* via environment variables or directly here.
# For development you can use the console backend to print emails to stdout.
# Or use Mailtrap: https://mailtrap.io/ for testing email delivery.

# Always use real Gmail SMTP — no console backend.
# Set EMAIL_HOST_USER and EMAIL_HOST_PASSWORD in your .env file.
EMAIL_BACKEND       = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST          = 'smtp.gmail.com'
EMAIL_PORT          = 587
EMAIL_USE_TLS       = True
EMAIL_USE_SSL       = False   # Must be False when USE_TLS is True
EMAIL_HOST_USER     = os.environ.get('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL  = os.environ.get('DEFAULT_FROM_EMAIL', os.environ.get('EMAIL_HOST_USER', ''))
EMAIL_TIMEOUT       = 10  # seconds — fail fast instead of hanging"