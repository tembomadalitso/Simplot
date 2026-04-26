# core/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PropertyViewSet, RentalAgreementViewSet, ExpenseViewSet
from . import auth_views

router = DefaultRouter()
router.register(r'properties', PropertyViewSet)
router.register(r'rentals',    RentalAgreementViewSet)
router.register(r'expenses',   ExpenseViewSet)

urlpatterns = [
    # API resources — mounted at whatever prefix main/urls.py uses (e.g. /api/)
    path('', include(router.urls)),
]

# Custom auth endpoints — imported separately in main/urls.py under the 'auth/' prefix.
# See main_urls.py output for the exact wiring.
auth_urlpatterns = [
    path('register/',                auth_views.register_user,          name='auth-register'),
    path('send-code/',               auth_views.send_verification_code, name='auth-send-code'),
    path('verify-email/',            auth_views.verify_email,           name='auth-verify-email'),
    path('password-reset/',          auth_views.password_reset_request, name='auth-password-reset'),
    path('password-reset/confirm/',  auth_views.password_reset_confirm, name='auth-password-reset-confirm'),
]