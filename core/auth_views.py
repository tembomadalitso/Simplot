"""
core/auth_views.py
──────────────────
Custom auth endpoints:
  POST /auth/register/               — Validate + cache data, send OTP
  POST /auth/send-code/              — Resend OTP for pending registration
  POST /auth/verify-email/           — Confirm OTP → create user
  POST /auth/password-reset/         — Send HTML reset link email
  POST /auth/password-reset/confirm/ — Accept uid/token + new password
"""

import random
import string
import smtplib

from django.core.mail import EmailMultiAlternatives
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
# HTML EMAIL TEMPLATES
# ─────────────────────────────────────────────────────────────────

def _otp_html(code):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Email Verification</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0"
             style="background:#1e293b;border-radius:16px;overflow:hidden;
                    box-shadow:0 20px 60px rgba(0,0,0,0.5);max-width:560px;width:100%;">

        <tr>
          <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:36px 40px;text-align:center;">
            <div style="display:inline-block;background:rgba(255,255,255,0.15);
                        border-radius:12px;padding:12px 18px;margin-bottom:14px;font-size:30px;">
              🏠
            </div>
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">
              Zambia Rentals
            </h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.7);font-size:13px;">
              Premium Real Estate Platform
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:40px;">
            <h2 style="margin:0 0 8px;color:#f1f5f9;font-size:20px;font-weight:700;">
              Verify Your Email Address
            </h2>
            <p style="margin:0 0 28px;color:#94a3b8;font-size:14px;line-height:1.7;">
              Thanks for joining Zambia Rentals! Use the code below to confirm your email address.
              It expires in <strong style="color:#c4b5fd;">10 minutes</strong>.
            </p>

            <div style="background:#0f172a;border:2px solid #6366f1;border-radius:14px;
                        padding:30px 20px;text-align:center;margin-bottom:28px;">
              <p style="margin:0 0 10px;color:#64748b;font-size:11px;
                         text-transform:uppercase;letter-spacing:2.5px;font-weight:600;">
                Your verification code
              </p>
              <div style="font-size:46px;font-weight:800;letter-spacing:12px;
                           color:#a5b4fc;font-family:'Courier New',Courier,monospace;padding:0 8px;">
                {code}
              </div>
            </div>

            <div style="background:#172554;border-left:3px solid #3b82f6;
                        border-radius:6px;padding:13px 16px;margin-bottom:28px;">
              <p style="margin:0;color:#93c5fd;font-size:13px;line-height:1.5;">
                🔒 &nbsp;Never share this code with anyone.
                Zambia Rentals staff will never ask for it.
              </p>
            </div>

            <p style="margin:0;color:#475569;font-size:12px;line-height:1.7;">
              If you did not create a Zambia Rentals account, you can safely ignore this email.
              No action is needed.
            </p>
          </td>
        </tr>

        <tr>
          <td style="background:#0f172a;padding:20px 40px;border-top:1px solid #334155;text-align:center;">
            <p style="margin:0;color:#475569;font-size:11px;">
              &copy; 2026 Zambia Rentals &nbsp;&middot;&nbsp; Lusaka, Zambia
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""


def _reset_html(reset_link):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Password Reset</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0"
             style="background:#1e293b;border-radius:16px;overflow:hidden;
                    box-shadow:0 20px 60px rgba(0,0,0,0.5);max-width:560px;width:100%;">

        <tr>
          <td style="background:linear-gradient(135deg,#dc2626,#9333ea);padding:36px 40px;text-align:center;">
            <div style="display:inline-block;background:rgba(255,255,255,0.15);
                        border-radius:12px;padding:12px 18px;margin-bottom:14px;font-size:30px;">
              🔑
            </div>
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">
              Zambia Rentals
            </h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.7);font-size:13px;">
              Premium Real Estate Platform
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:40px;">
            <h2 style="margin:0 0 8px;color:#f1f5f9;font-size:20px;font-weight:700;">
              Password Reset Request
            </h2>
            <p style="margin:0 0 28px;color:#94a3b8;font-size:14px;line-height:1.7;">
              We received a request to reset the password on your Zambia Rentals account.
              Click the button below to set a new password.
              This link is valid for <strong style="color:#f9a8d4;">1 hour</strong>.
            </p>

            <div style="text-align:center;margin-bottom:28px;">
              <a href="{reset_link}"
                 style="display:inline-block;
                        background:linear-gradient(135deg,#dc2626,#9333ea);
                        color:#ffffff;text-decoration:none;
                        padding:15px 40px;border-radius:10px;
                        font-size:15px;font-weight:700;letter-spacing:0.3px;
                        box-shadow:0 4px 24px rgba(220,38,38,0.45);">
                Reset My Password
              </a>
            </div>

            <div style="background:#0f172a;border-radius:10px;padding:16px 18px;margin-bottom:28px;">
              <p style="margin:0 0 6px;color:#64748b;font-size:11px;
                         text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">
                Button not working? Copy this link:
              </p>
              <p style="margin:0;word-break:break-all;color:#818cf8;font-size:12px;line-height:1.6;">
                {reset_link}
              </p>
            </div>

            <div style="background:#172554;border-left:3px solid #3b82f6;
                        border-radius:6px;padding:13px 16px;margin-bottom:28px;">
              <p style="margin:0;color:#93c5fd;font-size:13px;line-height:1.5;">
                🔒 &nbsp;If you did not request a password reset, please ignore this email.
                Your account remains safe and no changes have been made.
              </p>
            </div>

            <p style="margin:0;color:#475569;font-size:12px;line-height:1.7;">
              For security, this link expires after 1 hour and can only be used once.
              If it has expired, return to the sign-in page and request a new one.
            </p>
          </td>
        </tr>

        <tr>
          <td style="background:#0f172a;padding:20px 40px;border-top:1px solid #334155;text-align:center;">
            <p style="margin:0;color:#475569;font-size:11px;">
              &copy; 2026 Zambia Rentals &nbsp;&middot;&nbsp; Lusaka, Zambia
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""


# ─────────────────────────────────────────────────────────────────
# SEND HELPERS
# ─────────────────────────────────────────────────────────────────

def _generate_otp(length=6):
    return ''.join(random.choices(string.digits, k=length))


def _send_otp_email(email, code):
    subject   = "Zambia Rentals \u2014 Email Verification Code"
    text_body = (
        f"Your verification code is: {code}\n\n"
        f"This code expires in 10 minutes.\n"
        f"If you did not request this, please ignore this email."
    )
    msg = EmailMultiAlternatives(
        subject, text_body, settings.DEFAULT_FROM_EMAIL, [email]
    )
    msg.attach_alternative(_otp_html(code), "text/html")
    try:
        msg.send(fail_silently=False)
    except smtplib.SMTPAuthenticationError:
        raise Exception(
            "Gmail authentication failed. Check EMAIL_HOST_USER and "
            "EMAIL_HOST_PASSWORD in your .env (app password must have no spaces)."
        )
    except smtplib.SMTPException as e:
        raise Exception(f"SMTP error: {e}")


def _send_reset_email(email, uid, token):
    reset_link = (
        f"{settings.SITE_URL}/reset-password/"
        f"?uid={uid}&token={token}"
    )
    subject   = "Zambia Rentals \u2014 Password Reset"
    text_body = (
        f"Reset your password here:\n{reset_link}\n\n"
        f"This link is valid for 1 hour.\n"
        f"If you did not request this, please ignore this email."
    )
    msg = EmailMultiAlternatives(
        subject, text_body, settings.DEFAULT_FROM_EMAIL, [email]
    )
    msg.attach_alternative(_reset_html(reset_link), "text/html")
    try:
        msg.send(fail_silently=False)
    except smtplib.SMTPAuthenticationError:
        raise Exception(
            "Gmail authentication failed. Check EMAIL_HOST_USER and "
            "EMAIL_HOST_PASSWORD in your .env (app password must have no spaces)."
        )
    except smtplib.SMTPException as e:
        raise Exception(f"SMTP error: {e}")


# ─────────────────────────────────────────────────────────────────
# REGISTER
# ─────────────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    serializer = UserCreateSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email'].lower()
        cache.set(f'registration_{email}', serializer.validated_data, timeout=600)

        otp = _generate_otp()
        cache.set(f'verify_{email}', otp, timeout=600)

        try:
            _send_otp_email(email, otp)
        except Exception as exc:
            return Response({'error': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(
            {'message': 'Verification code sent. Please check your email.'},
            status=status.HTTP_200_OK,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────────────────────────
# RESEND OTP
# ─────────────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def send_verification_code(request):
    email = request.data.get('email', '').strip().lower()
    if not email:
        return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

    registration_data = cache.get(f'registration_{email}')
    if not registration_data:
        return Response(
            {'error': 'No pending registration for this email.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    otp = _generate_otp()
    cache.set(f'verify_{email}', otp, timeout=600)

    try:
        _send_otp_email(email, otp)
    except Exception as exc:
        return Response({'error': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response({'message': 'Verification code sent.'})


# ─────────────────────────────────────────────────────────────────
# VERIFY EMAIL  →  creates the user account
# ─────────────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email(request):
    email = request.data.get('email', '').strip().lower()
    code  = request.data.get('code', '').strip()

    if not email or not code:
        return Response({'error': 'Email and code are required.'}, status=status.HTTP_400_BAD_REQUEST)

    registration_data = cache.get(f'registration_{email}')
    if not registration_data:
        return Response(
            {'error': 'Registration session expired. Please register again.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    stored_code = cache.get(f'verify_{email}')
    if stored_code != code:
        return Response({'error': 'Invalid or expired code.'}, status=status.HTTP_400_BAD_REQUEST)

    serializer = UserCreateSerializer(data=registration_data)
    if serializer.is_valid():
        user = serializer.save()
        user.is_verified = True
        user.save()
        cache.delete(f'registration_{email}')
        cache.delete(f'verify_{email}')
        return Response({'message': 'Email verified successfully. You can now sign in.'})

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────────────────────────
# FORGOT PASSWORD — send reset link
# ─────────────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_request(request):
    email = request.data.get('email', '').strip().lower()
    try:
        user  = User.objects.get(email__iexact=email)
        uid   = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        _send_reset_email(user.email, uid, token)
    except User.DoesNotExist:
        pass  # Silent — don't reveal whether email exists
    return Response({'message': 'If that email exists, a reset link has been sent.'})


# ─────────────────────────────────────────────────────────────────
# FORGOT PASSWORD — confirm new password
# ─────────────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_confirm(request):
    uid_b64      = request.data.get('uid')
    token        = request.data.get('token')
    new_password = request.data.get('new_password', '')

    if not uid_b64 or not token or not new_password:
        return Response(
            {'error': 'uid, token, and new_password are required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

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
        return Response(
            {'error': 'Reset link is invalid or has expired.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user.set_password(new_password)
    user.save()
    return Response({'message': 'Password reset successfully. You can now sign in.'})