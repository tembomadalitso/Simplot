from rest_framework import serializers
from .models import User, Property, RentalAgreement, TaxPolicy

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'user_type', 'full_name', 'phone_number']

from .models import PropertyImage

class PropertyImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyImage
        fields = ['id', 'image', 'caption', 'is_main']

class PropertySerializer(serializers.ModelSerializer):
    # These fields help the frontend display readable names instead of IDs
    owner_name = serializers.ReadOnlyField(source='owner.username')
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    estimated_tax = serializers.ReadOnlyField(source='estimated_annual_tax')
    images = PropertyImageSerializer(many=True, read_only=True)

    class Meta:
        model = Property
        fields = [
            'id', 'owner', 'owner_name', 'title', 'description', 'category', 'category_display',
            'price', 'province', 'district', 'area_name', 'street_address', 
            'is_tax_compliant', 'estimated_tax', 'created_at', 'images'
        ]
        # 'owner' is read-only because we set it automatically in views.py
        read_only_fields = ['owner', 'is_tax_compliant']

# core/serializers.py
class RentalAgreementSerializer(serializers.ModelSerializer):
    property_details = PropertySerializer(source='property', read_only=True)
    property_title = serializers.ReadOnlyField(source='property.title')
    tenant_name = serializers.ReadOnlyField(source='tenant.username')

    class Meta:
        model = RentalAgreement
        fields = [
            'id', 'property', 'property_title', 'property_details', 'tenant', 'tenant_name',
            'start_date', 'end_date', 'status', 'is_active', 'number_of_occupants'
        ]
        read_only_fields = ['tenant', 'status']


class TaxPolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = TaxPolicy
        fields = '__all__'

from .models import Expense

class ExpenseSerializer(serializers.ModelSerializer):
    property_title = serializers.ReadOnlyField(source='property.title')
    class Meta:
        model = Expense
        fields = ['id', 'property', 'property_title', 'amount', 'description', 'date']
from djoser.serializers import UserCreateSerializer as BaseUserCreateSerializer

class UserCreateSerializer(BaseUserCreateSerializer):
    class Meta(BaseUserCreateSerializer.Meta):
        model = User
        fields = ('id', 'email', 'username', 'password', 'user_type')
