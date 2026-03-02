from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings

class User(AbstractUser):
    TYPE_CHOICES = (
        ('TENANT', 'Tenant/Seeker'),
        ('LANDLORD', 'Landlord/Property Owner'),
        ('OFFICIAL', 'Government Official (ZRA/Ministry)'),
    )
    user_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='TENANT')
    tpin_number = models.CharField(max_length=20, blank=True, null=True, help_text="Required for Landlords")
    nrc_number = models.CharField(max_length=20, blank=True, null=True, unique=True)
    phone_number = models.CharField(max_length=15, blank=True) 
    full_name = models.CharField(max_length=255, blank=True)
    home_address = models.TextField(blank=True)
    id_document = models.FileField(upload_to='id_documents/', blank=True, null=True)

    def __str__(self):
        return f"{self.username} ({self.get_user_type_display()})"

class TaxPolicy(models.Model):
    name = models.CharField(max_length=100)
    percentage = models.DecimalField(max_digits=5, decimal_places=2)
    min_income_threshold = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.name} - {self.percentage}%"

# core/models.py

class Property(models.Model):
    CATEGORY_CHOICES = (
        ('RESIDENTIAL', 'Residential House/Apartment'),
        ('BOARDING', 'Student Boarding House'),
        ('LODGE', 'Lodge/Short-stay'),
    )
    
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='properties')
    title = models.CharField(max_length=255)
    # Added fields referenced by the serializer
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='RESIDENTIAL') 
    province = models.CharField(max_length=50, default="Lusaka") 
    district = models.CharField(max_length=50)
    area_name = models.CharField(max_length=100, blank=True)
    street_address = models.CharField(max_length=255, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_tax_compliant = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def estimated_annual_tax(self):
        annual_income = self.price * 12
        policy = TaxPolicy.objects.first()
        if not policy: return 0.00
        return round((annual_income * policy.percentage) / 100, 2)

class RentalAgreement(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    )
    property = models.ForeignKey(Property, on_delete=models.CASCADE)
    tenant = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    is_active = models.BooleanField(default=True)
    number_of_occupants = models.PositiveIntegerField(default=1)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)

class Expense(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='expenses')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.CharField(max_length=255)
    date = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"{self.property.title} - {self.description} ({self.amount})"
class PropertyImage(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='property_images/')
    caption = models.CharField(max_length=255, blank=True)
    is_main = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for {self.property.title} - Main: {self.is_main}"
