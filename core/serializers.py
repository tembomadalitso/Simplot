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
    owner_tpin = serializers.ReadOnlyField(source='owner.tpin_number')
    owner_nrc = serializers.ReadOnlyField(source='owner.nrc_number')
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    estimated_tax = serializers.ReadOnlyField(source='estimated_annual_tax')
    tax_rate = serializers.SerializerMethodField()
    total_annual_rent = serializers.SerializerMethodField()
    amount_after_tax = serializers.SerializerMethodField()
    images = PropertyImageSerializer(many=True, read_only=True)

    class Meta:
        model = Property
        fields = [
            'id', 'owner', 'owner_name', 'owner_tpin', 'owner_nrc', 'title', 'description', 'category', 'category_display',
            'price', 'province', 'district', 'area_name', 'street_address', 
            'is_tax_compliant', 'apartment_count', 'estimated_tax', 'tax_rate', 'total_annual_rent', 'amount_after_tax', 'created_at', 'images'
        ]

        read_only_fields = ['owner', 'is_tax_compliant', 'created_at']

    def get_tax_rate(self, obj):
        policy = TaxPolicy.objects.first()
        return float(policy.percentage) if policy else 0.0

    def get_total_annual_rent(self, obj):
        return float(obj.price * obj.apartment_count * 12)

    def get_amount_after_tax(self, obj):
        return self.get_total_annual_rent(obj) - float(obj.estimated_annual_tax())
        # 'owner' is read-only because we set it automatically in views.py
        read_only_fields = ['owner', 'is_tax_compliant']

# core/serializers.py
class RentalAgreementSerializer(serializers.ModelSerializer):
    property_details = PropertySerializer(source='property', read_only=True)
    tenant_name = serializers.ReadOnlyField(source='tenant.username')

    class Meta:
        model = RentalAgreement
        fields = [
            'id', 'property', 'property_details', 'tenant', 'tenant_name',
            'start_date', 'end_date', 'status', 'is_active', 'number_of_occupants'
        ]
        read_only_fields = ['tenant', 'status']


class TaxPolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = TaxPolicy
        fields = '__all__'

from .models import Expense

class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = ['id', 'property', 'amount', 'description', 'date']
from djoser.serializers import UserCreateSerializer as BaseUserCreateSerializer

class UserCreateSerializer(BaseUserCreateSerializer):
    class Meta(BaseUserCreateSerializer.Meta):
        model = User
        fields = ('id', 'email', 'username', 'password', 'user_type')
