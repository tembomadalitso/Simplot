# core/views.py
from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.db.models import Sum, Count
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Property, RentalAgreement, User
from .serializers import PropertySerializer, RentalAgreementSerializer

# --- FRONTEND VIEWS ---

def index_page(request):
    return render(request, 'index.html')

def auth_page(request):
    return render(request, 'auth.html')

@login_required
def apply_page(request, pk):
    property_obj = get_object_or_404(Property, pk=pk)
    return render(request, 'apply.html', {'property': property_obj})

@login_required
def add_property_page(request):
    return render(request, 'add_property.html')

def property_detail_page(request, pk):
    property_obj = get_object_or_404(Property, pk=pk)
    # Goal: Ensure landlord contact is available for tenants
    landlord_phone = property_obj.owner.phone_number
    return render(request, 'property_detail.html', {
        'property': property_obj,
        'landlord_phone': landlord_phone
    })

@login_required
def dashboard_page(request):
    """Restore the missing dashboard for Landlords"""
    user_properties = Property.objects.filter(owner=request.user)
    
    # Goal 1: Landlords track their own earnings and tax obligations
    total_tax = sum(p.estimated_annual_tax() for p in user_properties)
    
    context = {
        'properties': user_properties,
        'total_tax': total_tax,
        'property_count': user_properties.count()
    }
    return render(request, 'dashboard.html', context)

@login_required
def official_dashboard_page(request):
    """Unified Oversight for ZRA and Ministry of Home Affairs"""
    if request.user.user_type != 'OFFICIAL':
        return render(request, '403.html')

    all_properties = Property.objects.all()
    
    # Goal 1: ZRA - Calculate Total Potential Tax Revenue
    total_annual_tax_potential = sum(p.estimated_annual_tax() for p in all_properties)
    compliant_count = all_properties.filter(is_tax_compliant=True).count()
    non_compliant_count = all_properties.filter(is_tax_compliant=False).count()

    # Goal 2: Ministry of Home Affairs - Occupancy and Density
    occupancy_stats = (
        RentalAgreement.objects.filter(is_active=True)
        .values('property__district')
        .annotate(
            total_people=Sum('number_of_occupants'),
            property_count=Count('property', distinct=True)
        )
        .order_by('-total_people')
    )

    context = {
        'total_tax': total_annual_tax_potential,
        'compliance_rate': (compliant_count / all_properties.count() * 100) if all_properties.count() > 0 else 0,
        'non_compliant_count': non_compliant_count,
        'occupancy_stats': occupancy_stats,
    }
    return render(request, 'official_dashboard.html', context)

# --- API VIEWSETS ---

class PropertyViewSet(viewsets.ModelViewSet):
    queryset = Property.objects.all()
    serializer_class = PropertySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def zra_report(self, request):
        """ZRA specific API endpoint"""
        if request.user.user_type != 'OFFICIAL':
            return Response({'error': 'Unauthorized'}, status=403)
        
        landlords = User.objects.filter(user_type='LANDLORD')
        landlord_stats = []
        for landlord in landlords:
            landlord_properties = Property.objects.filter(owner=landlord)
            annual_income = sum(float(p.price) * 12 for p in landlord_properties)
            landlord_stats.append({
                'landlord_name': landlord.username,
                'property_count': landlord_properties.count(),
                'annual_income_estimate': annual_income
            })
        return Response({'landlords': landlord_stats})

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def census_report(self, request):
        """Ministry of Home Affairs API for population density statistics"""
        if request.user.user_type != 'OFFICIAL':
            return Response({'error': 'Unauthorized'}, status=403) 
            
        agreements = RentalAgreement.objects.filter(is_active=True) 
        stats = {}
        for ag in agreements:
            dist = ag.property.district
            cat = ag.property.category 
            count = ag.number_of_occupants 
            
            if dist not in stats:
                stats[dist] = {
                    'total_population': 0,
                    'property_count': 0,
                    'by_category': {}
                }
            
            stats[dist]['total_population'] += count
            stats[dist]['property_count'] += 1
            stats[dist]['by_category'][cat] = stats[dist]['by_category'].get(cat, 0) + count
        return Response(stats)

class RentalAgreementViewSet(viewsets.ModelViewSet):
    queryset = RentalAgreement.objects.all()
    serializer_class = RentalAgreementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # Automatically set the tenant to the logged-in user
        serializer.save(tenant=self.request.user)