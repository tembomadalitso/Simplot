# core/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PropertyViewSet, RentalAgreementViewSet, ExpenseViewSet

router = DefaultRouter()
router.register(r'properties', PropertyViewSet)
router.register(r'rentals', RentalAgreementViewSet)
router.register(r'expenses', ExpenseViewSet)

urlpatterns = [
    path('', include(router.urls)),
]