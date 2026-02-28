
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main.settings')
django.setup()

import random
from datetime import date
from core.models import User, Property, RentalAgreement, TaxPolicy

def seed():
    # 1. Setup Tax Policy
    policy, _ = TaxPolicy.objects.get_or_create(
        name="Turnover Tax", 
        defaults={'percentage': 4.0}
    )

    # 2. Create Landlord
    landlord, _ = User.objects.get_or_create(username="ZambiaPropertyLtd", defaults={
        'user_type': 'LANDLORD', 'email': 'info@zpl.com', 'tpin_number': '100555999'
    })
    landlord.set_password('pass123')
    landlord.save()

    # 3. Create Properties (Using the new structure)
    Property.objects.get_or_create(
        owner=landlord,
        title="Executive 3BR House - Rhodes Park",
        defaults={
            'price': 15000, 'district': 'Lusaka', 'area_name': 'Rhodes Park',
            'province': 'Lusaka', 'street_address': 'Plot 45, Independence Ave'
        }
    )

    print("✅ Project structure populated with fresh Zambian mock data!")

if __name__ == "__main__":
    seed()