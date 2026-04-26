from rest_framework import serializers
from .models import User, Property, RentalAgreement, TaxPolicy, PropertyImage
import re

# ─────────────────────────────────────────────────────────────────
# PASSWORD VALIDATOR  (shared rule set — mirrors auth.js)
# ─────────────────────────────────────────────────────────────────
PASSWORD_RULES = [
    (lambda p: len(p) >= 8,              "Password must be at least 8 characters."),
    (lambda p: re.search(r'[A-Z]', p),   "Password must contain at least one uppercase letter."),
    (lambda p: re.search(r'[a-z]', p),   "Password must contain at least one lowercase letter."),
    (lambda p: re.search(r'\d', p),      "Password must contain at least one number."),
    (lambda p: re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]', p),
                                          "Password must contain at least one special character (!@#$…)."),
]

def validate_password_strength(value):
    for rule_fn, msg in PASSWORD_RULES:
        if not rule_fn(value):
            raise serializers.ValidationError(msg)
    return value


# ─────────────────────────────────────────────────────────────────
# USER SERIALIZERS
# ─────────────────────────────────────────────────────────────────
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ['id', 'username', 'email', 'phone_number', 'user_type',
                  'nrc_number', 'tpin_number', 'is_verified', 'full_name']
        extra_kwargs = {'password': {'write_only': True}}


class UserCreateSerializer(serializers.ModelSerializer):
    """Used by the registration endpoint."""
    password = serializers.CharField(write_only=True)

    class Meta:
        model  = User
        fields = ['username', 'email', 'password', 'user_type',
                  'phone_number', 'nrc_number', 'tpin_number']

    def validate_password(self, value):
        return validate_password_strength(value)

    def validate_nrc_number(self, value):
        if not value:
            return value
        cleaned = re.sub(r'\D', '', value)
        if len(cleaned) != 9:
            raise serializers.ValidationError("NRC must be 9 digits (stored without slashes).")
        return cleaned   # Store as pure digits e.g. "233456641"

    def validate_tpin_number(self, value):
        if value is None:
            return value
        try:
            int(value)
        except (ValueError, TypeError):
            raise serializers.ValidationError("TPIN must be a valid number.")
        return value

    def validate(self, data):
        if data.get('user_type') == 'LANDLORD':
            if not data.get('nrc_number'):
                raise serializers.ValidationError({'nrc_number': 'NRC number is required for landlords.'})
            if not data.get('tpin_number'):
                raise serializers.ValidationError({'tpin_number': 'TPIN is required for landlords.'})
        return data

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        user.is_verified = False   # Must verify email before login
        user.save()
        return user


# ─────────────────────────────────────────────────────────────────
# PROPERTY SERIALIZERS
# ─────────────────────────────────────────────────────────────────
class PropertyImageSerializer(serializers.ModelSerializer):
    class Meta:
        model  = PropertyImage
        fields = ['id', 'image', 'caption', 'is_main']


class PropertySerializer(serializers.ModelSerializer):
    owner_name      = serializers.ReadOnlyField(source='owner.username')
    owner_tpin      = serializers.ReadOnlyField(source='owner.tpin_number')
    owner_nrc       = serializers.ReadOnlyField(source='owner.nrc_number')
    category_display= serializers.CharField(source='get_category_display', read_only=True)
    estimated_tax   = serializers.ReadOnlyField(source='estimated_annual_tax')
    tax_rate        = serializers.SerializerMethodField()
    total_annual_rent = serializers.SerializerMethodField()
    amount_after_tax  = serializers.SerializerMethodField()
    images          = PropertyImageSerializer(many=True, read_only=True)

    class Meta:
        model  = Property
        fields = [
            'id', 'owner', 'owner_name', 'owner_tpin', 'owner_nrc',
            'title', 'description', 'category', 'category_display',
            'price', 'province', 'district', 'area_name', 'street_address',
            'is_tax_compliant', 'apartment_count',
            'estimated_tax', 'tax_rate', 'total_annual_rent', 'amount_after_tax',
            'created_at', 'images',
        ]
        read_only_fields = ['owner', 'is_tax_compliant', 'created_at']

    def get_tax_rate(self, obj):
        policy = TaxPolicy.objects.first()
        return float(policy.percentage) if policy else 0.0

    def get_total_annual_rent(self, obj):
        return float(obj.price * obj.apartment_count * 12)

    def get_amount_after_tax(self, obj):
        return self.get_total_annual_rent(obj) - float(obj.estimated_annual_tax())


# ─────────────────────────────────────────────────────────────────
# RENTAL AGREEMENT
# ─────────────────────────────────────────────────────────────────
class RentalAgreementSerializer(serializers.ModelSerializer):
    property_details = PropertySerializer(source='property', read_only=True)
    tenant_name      = serializers.ReadOnlyField(source='tenant.username')

    class Meta:
        model  = RentalAgreement
        fields = [
            'id', 'property', 'property_details', 'tenant', 'tenant_name',
            'start_date', 'end_date', 'status', 'is_active', 'number_of_occupants',
        ]
        read_only_fields = ['tenant', 'status']


# ─────────────────────────────────────────────────────────────────
# TAX POLICY
# ─────────────────────────────────────────────────────────────────
class TaxPolicySerializer(serializers.ModelSerializer):
    class Meta:
        model  = TaxPolicy
        fields = '__all__'


# ─────────────────────────────────────────────────────────────────
# EXPENSE
# ─────────────────────────────────────────────────────────────────
from .models import Expense

class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Expense
        fields = ['id', 'property', 'amount', 'description', 'date']


# ─────────────────────────────────────────────────────────────────
# DJOSER COMPATIBILITY  (kept for djoser /auth/users/ if used)
# ─────────────────────────────────────────────────────────────────
from djoser.serializers import UserCreateSerializer as BaseUserCreateSerializer

class DjoserUserCreateSerializer(BaseUserCreateSerializer):
    class Meta(BaseUserCreateSerializer.Meta):
        model  = User
        fields = ('id', 'email', 'username', 'password', 'user_type')

    def validate_password(self, value):
        return validate_password_strength(value)