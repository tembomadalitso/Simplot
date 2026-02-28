# core/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.http import HttpResponse
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from .models import Property, User, TaxPolicy, RentalAgreement


# --- CUSTOM ACTIONS ---
def download_tax_report(modeladmin, request, queryset):
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = 'attachment; filename="zra_defaulters_report.pdf"'
    p = canvas.Canvas(response, pagesize=letter)
    p.setFont("Helvetica-Bold", 16)
    p.drawString(50, 750, "ZRA Tax Compliance Report - Non-Compliant Properties")
    y = 700
    for prop in queryset.filter(is_tax_compliant=False):
        p.setFont("Helvetica", 10)
        p.drawString(50, y, f"Landlord: {prop.owner.username} | Property: {prop.title} | Tax Due: K{prop.estimated_annual_tax()}")
        y -= 20
        if y < 50: p.showPage(); y = 750
    p.showPage()
    p.save()
    return response

download_tax_report.short_description = "Generate ZRA Defaulter PDF"

# --- ADMIN REGISTRATIONS ---

# Register your custom User model with the standard UserAdmin interface
@admin.register(User)
class MyUserAdmin(UserAdmin):
    # This adds your custom fields to the User edit page in Admin
    fieldsets = UserAdmin.fieldsets + (
        ('Zambia Rentals Info', {'fields': ('user_type', 'tpin_number', 'nrc_number', 'phone_number')}),
    )
    list_display = ('username', 'email', 'user_type', 'is_staff')

@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ('title', 'owner', 'district', 'is_tax_compliant')
    actions = [download_tax_report]

@admin.register(RentalAgreement)
class RentalAgreementAdmin(admin.ModelAdmin):
    list_display = ('property', 'tenant', 'number_of_occupants', 'is_active')

admin.site.register(TaxPolicy)