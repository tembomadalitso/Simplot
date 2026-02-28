from rest_framework import serializers
from .models import User, Property, RentalAgreement, TaxPolicy

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'user_type', 'full_name', 'phone_number']

class PropertySerializer(serializers.ModelSerializer):
    # These fields help the frontend display readable names instead of IDs
    owner_name = serializers.ReadOnlyField(source='owner.username')
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    estimated_tax = serializers.ReadOnlyField(source='estimated_annual_tax')

    class Meta:
        model = Property
        fields = [
            'id', 'owner', 'owner_name', 'title', 'category', 'category_display', 
            'price', 'province', 'district', 'area_name', 'street_address', 
            'is_tax_compliant', 'estimated_tax', 'created_at'
        ]
        # 'owner' is read-only because we set it automatically in views.py
        read_only_fields = ['owner', 'is_tax_compliant']

# core/serializers.py
class RentalAgreementSerializer(serializers.ModelSerializer):
    property_details = PropertySerializer(source='property', read_only=True)

    class Meta:
        model = RentalAgreement
        fields = [
            'id', 'property', 'property_details', 'tenant', 
            'is_active', 'number_of_occupants'
        ]
        # Tenant should be handled by the backend during creation
        read_only_fields = ['tenant']

    class Meta:
        model = RentalAgreement
        fields = [
            'id', 'property', 'property_details', 'tenant', 'start_date', 
            'end_date', 'is_active', 'number_of_occupants'
        ]

class TaxPolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = TaxPolicy
        fields = '__all__'