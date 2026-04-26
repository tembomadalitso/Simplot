"""
core/auth_views.py
──────────────────
Custom auth endpoints:
  POST /auth/register/          — Create user account (returns user data, no token yet)
  POST /auth/send-code/         — Email a 6-digit OTP to confirm the address
  POST /auth/verify-email/      — Validate OTP → set is_verified=True
  POST /auth/password-reset/    — Send password-reset link to email
  POST /auth/password-reset/confirm/ — Confirm uid/token + new password
"""

import random
import string
import smtplib
from django.core.mail import send_mail, EmailMessage
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.cache import cache

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from .models import User
from .serializers import UserCreateSerializer


# ─────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────
def _generate_otp(length=6):
    return ''.join(random.choices(string.digits, k=length))


def _send_otp_email(email, code):
    subject = "Zambia Rentals — Email Verification Code"
    message = (
        f"Your verification code is: {code}\n\n"
        f"This code expires in 10 minutes.\n"
        f"If you did not request this, please ignore this email."
    )
    email_msg = EmailMessage(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [email],
        headers={'Reply-To': settings.DEFAULT_FROM_EMAIL},
    )
    try:
        email_msg.send(fail_silently=False)
    except smtplib.SMTPAuthenticationError:
        raise Exception(
            "Gmail authentication failed. Check EMAIL_HOST_USER and EMAIL_HOST_PASSWORD in your .env. "
            "Make sure the app password has no spaces (e.g. 'fgdurdksgcrdfled' not 'fgdu rdks gcrd fled')."
        )
    except smtplib.SMTPException as e:
        raise Exception(f"SMTP error: {e}")


def _send_reset_email(email, uid, token):
    reset_link = f"{settings.SITE_URL}/auth/password-reset/confirm/?uid={uid}&token={token}"
    subject = "Zambia Rentals — Password Reset"
    message = (
        f"Click the link below to reset your password:\n\n"
        f"{reset_link}\n\n"
        f"This link is valid for 1 hour.\n"
        f"If you did not request a password reset, please ignore this email."
    )
    email_msg = EmailMessage(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [email],
        headers={'Reply-To': settings.DEFAULT_FROM_EMAIL},
    )
    email_msg.send(fail_silently=False)


# ─────────────────────────────────────────────────────────────────
# REGISTER
# ─────────────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """
    Validate user data and send verification code.
    User is not created until email is verified.
    """
    serializer = UserCreateSerializer(data=request.data)
    if serializer.is_valid():
        # Store validated data in cache for 10 minutes
        email = serializer.validated_data['email'].lower()
        cache.set(f'registration_{email}', serializer.validated_data, timeout=600)
        
        # Send verification code
        otp = _generate_otp()
        cache.set(f'verify_{email}', otp, timeout=600)
        
        try:
            _send_otp_email(email, otp)
        except Exception as exc:
            return Response(
                {'error': f'Failed to send email: {str(exc)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        
        return Response(
            {'message': 'Verification code sent. Please check your email.'},
            status=status.HTTP_200_OK,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────────────────────────
# SEND VERIFICATION CODE
# ─────────────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def send_verification_code(request):
    """
    Resend verification code for pending registration.
    Body: { "email": "..." }
    """
    email = request.data.get('email', '').strip().lower()
    if not email:
        return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

    # Check if registration data exists
    registration_data = cache.get(f'registration_{email}')
    if not registration_data:
        return Response({'error': 'No pending registration for this email.'}, status=status.HTTP_400_BAD_REQUEST)

    otp = _generate_otp()
    cache.set(f'verify_{email}', otp, timeout=600)

    try:
        _send_otp_email(email, otp)
    except Exception as exc:
        return Response(
            {'error': f'Failed to send email: {str(exc)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response({'message': 'Verification code sent.'})


# ─────────────────────────────────────────────────────────────────
# VERIFY EMAIL
# ─────────────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email(request):
    """
    Confirm the OTP and create the user account.
    """
    email = request.data.get('email', '').strip().lower()
    code  = request.data.get('code', '').strip()

    if not email or not code:
        return Response({'error': 'Email and code are required.'}, status=status.HTTP_400_BAD_REQUEST)

    # Check if registration data exists
    registration_data = cache.get(f'registration_{email}')
    if not registration_data:
        return Response({'error': 'Registration session expired. Please register again.'}, status=status.HTTP_400_BAD_REQUEST)

    # Check verification code
    stored_code = cache.get(f'verify_{email}')
    if stored_code != code:
        return Response({'error': 'Invalid or expired code.'}, status=status.HTTP_400_BAD_REQUEST)

    # Create the user
    serializer = UserCreateSerializer(data=registration_data)
    if serializer.is_valid():
        user = serializer.save()
        user.is_verified = True
        user.save()
        
        # Clean up cache
        cache.delete(f'registration_{email}')
        cache.delete(f'verify_{email}')
        
        return Response({'message': 'Email verified successfully. You can now sign in.'})
    else:
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────────────────────────
# FORGOT PASSWORD  —  Send reset link
# ─────────────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_request(request):
    """
    Body: { "email": "..." }
    Always returns 200 to prevent email enumeration.
    """
    email = request.data.get('email', '').strip().lower()
    try:
        user = User.objects.get(email__iexact=email)
        uid   = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        _send_reset_email(user.email, uid, token)
    except User.DoesNotExist:
        pass   # Silently ignore — don't reveal whether email exists

    return Response({'message': 'If that email exists, a reset link has been sent.'})


# ─────────────────────────────────────────────────────────────────
# FORGOT PASSWORD  —  Confirm new password
# ─────────────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_confirm(request):
    """
    Body: { "uid": "...", "token": "...", "new_password": "..." }
    """
    uid_b64      = request.data.get('uid')
    token        = request.data.get('token')
    new_password = request.data.get('new_password', '')

    if not uid_b64 or not token or not new_password:
        return Response({'error': 'uid, token, and new_password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    # Validate password strength
    from .serializers import validate_password_strength
    from rest_framework import serializers as drf_serializers
    try:
        validate_password_strength(new_password)
    except drf_serializers.ValidationError as e:
        return Response({'error': e.detail}, status=status.HTTP_400_BAD_REQUEST)

    try:
        uid  = force_str(urlsafe_base64_decode(uid_b64))
        user = User.objects.get(pk=uid)
    except (User.DoesNotExist, ValueError, TypeError):
        return Response({'error': 'Invalid reset link.'}, status=status.HTTP_400_BAD_REQUEST)

    if not default_token_generator.check_token(user, token):
        return Response({'error': 'Reset link is invalid or has expired.'}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save()

    return Response({'message': 'Password reset successfully. You can now sign in.'})