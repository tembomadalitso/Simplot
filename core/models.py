from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings


class User(AbstractUser):
    TYPE_CHOICES = (
        ('TENANT',   'Tenant/Seeker'),
        ('LANDLORD', 'Landlord/Property Owner'),
        ('ZRA',      'ZRA Tax Official'),
        ('MINISTRY', 'Ministry of Home Affairs'),
        ('ADMIN',    'Administrator'),
    )
    user_type         = models.CharField(max_length=20, choices=TYPE_CHOICES, default='TENANT')

    # tpin and nrc are landlord-only; both are nullable so tenants don't need them
    tpin_number       = models.BigIntegerField(blank=True, null=True)   # Strictly integer
    nrc_number        = models.CharField(max_length=9, blank=True, null=True)  # Stored as XXXXXXXXX (9 digits, no slashes)

    phone_number      = models.CharField(max_length=15, blank=True)
    full_name         = models.CharField(max_length=255, blank=True)
    home_address      = models.TextField(blank=True)
    id_document       = models.FileField(upload_to='id_documents/', blank=True, null=True)

    # 2FA / email verification
    is_verified       = models.BooleanField(default=False)
    verification_code = models.CharField(max_length=6, blank=True, null=True)

    def __str__(self):
        return f"{self.username} ({self.get_user_type_display()})"

    @property
    def formatted_nrc(self):
        """Return NRC in display format XXXXXX/XX/X from stored 9 digits."""
        if self.nrc_number and len(self.nrc_number) == 9:
            n = self.nrc_number
            return f"{n[:6]}/{n[6:8]}/{n[8]}"
        return self.nrc_number or ''


class TaxPolicy(models.Model):
    name                 = models.CharField(max_length=100)
    percentage           = models.DecimalField(max_digits=5, decimal_places=2)
    min_income_threshold = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.name} - {self.percentage}%"


class Property(models.Model):

    @property
    def main_image_url(self):
        main_img = self.images.filter(is_main=True).first()
        if main_img and main_img.image:
            return main_img.image.url
        first_img = self.images.first()
        if first_img and first_img.image:
            return first_img.image.url
        return None

    CATEGORY_CHOICES = (
        ('RESIDENTIAL', 'Residential House/Apartment'),
        ('BOARDING',    'Student Boarding House'),
        ('LODGE',       'Lodge/Short-stay'),
    )

    owner          = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='properties')
    title          = models.CharField(max_length=255)
    description    = models.TextField(blank=True, null=True)
    category       = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='RESIDENTIAL')
    province       = models.CharField(max_length=50, default="Lusaka")
    district       = models.CharField(max_length=50)
    area_name      = models.CharField(max_length=100, blank=True)
    street_address = models.CharField(max_length=255, blank=True)
    price          = models.DecimalField(max_digits=10, decimal_places=2)
    is_tax_compliant = models.BooleanField(default=False)
    apartment_count  = models.PositiveIntegerField(default=1)
    created_at       = models.DateTimeField(auto_now_add=True)

    def estimated_annual_tax(self):
        annual_income = self.price * self.apartment_count * 12
        policy = TaxPolicy.objects.first()
        if not policy:
            return 0.00
        return round((annual_income * policy.percentage) / 100, 2)


class RentalAgreement(models.Model):
    STATUS_CHOICES = (
        ('PENDING',  'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    )
    property           = models.ForeignKey(Property, on_delete=models.CASCADE)
    tenant             = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    status             = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    is_active          = models.BooleanField(default=True)
    number_of_occupants = models.PositiveIntegerField(default=1)
    start_date         = models.DateField(null=True, blank=True)
    end_date           = models.DateField(null=True, blank=True)


class Expense(models.Model):
    property    = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='expenses')
    amount      = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.CharField(max_length=255)
    date        = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"{self.property.title} - {self.description} ({self.amount})"


class PropertyImage(models.Model):
    property   = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='images')
    image      = models.ImageField(upload_to='property_images/')
    caption    = models.CharField(max_length=255, blank=True)
    is_main    = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for {self.property.title} - Main: {self.is_main}"