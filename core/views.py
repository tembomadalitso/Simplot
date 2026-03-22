# core/views.py
from django.shortcuts import render, get_object_or_404, redirect
from django.db.models import Sum, Count, Q
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.authtoken.models import Token

from .models import Property, RentalAgreement, User, Expense
from .serializers import PropertySerializer, RentalAgreementSerializer, ExpenseSerializer


# ---------------------------------------------------------------
# HELPER: Resolve the real user from token (cookie or header)
# This bypasses Django's unreliable session-based request.user
# ---------------------------------------------------------------
def get_user_from_request(request):
    # 1. Try Authorization header
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    if auth_header.startswith('Token '):
        token_key = auth_header.split(' ')[1]
        try:
            return Token.objects.get(key=token_key).user
        except Token.DoesNotExist:
            pass

    # 2. Try auth_token cookie
    token_key = request.COOKIES.get('auth_token')
    if token_key:
        try:
            return Token.objects.get(key=token_key).user
        except Token.DoesNotExist:
            pass

    return None  # Not authenticated


# ---------------------------------------------------------------
# FRONTEND VIEWS
# ---------------------------------------------------------------

def index_page(request):
    return render(request, 'index.html')


def auth_page(request):
    return render(request, 'auth.html')


def property_detail_page(request, pk):
    property_obj = get_object_or_404(Property, pk=pk)
    landlord_phone = property_obj.owner.phone_number
    return render(request, 'property_detail.html', {
        'property': property_obj,
        'landlord_phone': landlord_phone,
    })


def apply_page(request, pk):
    user = get_user_from_request(request)
    if not user:
        return redirect('/auth/login/')
    property_obj = get_object_or_404(Property, pk=pk)
    return render(request, 'apply.html', {'property': property_obj})


def add_property_page(request):
    user = get_user_from_request(request)
    if not user:
        return redirect('/auth/login/')
    return render(request, 'add_property.html')


def dashboard_page(request):
    """Landlord dashboard."""
    user = get_user_from_request(request)
    if not user:
        return redirect('/auth/login/')

    user_properties = Property.objects.filter(owner=user)
    total_tax = sum(p.estimated_annual_tax() for p in user_properties)

    return render(request, 'dashboard.html', {
        'properties': user_properties,
        'user_properties': user_properties,
        'total_tax': total_tax,
        'property_count': user_properties.count(),
    })


def zra_dashboard_page(request):
    """ZRA Tax Compliance dashboard."""
    user = get_user_from_request(request)
    if not user:
        return redirect('/auth/login/')
    if user.user_type != 'ZRA':
        return render(request, '403.html')

    all_properties = Property.objects.all()
    total_tax = sum(p.estimated_annual_tax() for p in all_properties)
    compliant_count = all_properties.filter(is_tax_compliant=True).count()
    non_compliant_count = all_properties.filter(is_tax_compliant=False).count()
    total_count = all_properties.count()

    return render(request, 'zra_dashboard.html', {
        'total_tax': total_tax,
        'compliance_rate': (compliant_count / total_count * 100) if total_count > 0 else 0,
        'non_compliant_count': non_compliant_count,
    })


def occupancy_dashboard_page(request):
    """Ministry of Home Affairs dashboard."""
    user = get_user_from_request(request)
    if not user:
        return redirect('/auth/login/')
    if user.user_type != 'MINISTRY':
        return render(request, '403.html')

    occupancy_stats = (
        RentalAgreement.objects.filter(is_active=True)
        .values('property__district')
        .annotate(
            total_people=Sum('number_of_occupants'),
            property_count=Count('property', distinct=True)
        )
        .order_by('-total_people')
    )

    return render(request, 'ministry_dashboard.html', {
        'occupancy_stats': occupancy_stats,
    })


# ---------------------------------------------------------------
# API VIEWSETS
# ---------------------------------------------------------------

class PropertyViewSet(viewsets.ModelViewSet):
    queryset = Property.objects.all()
    serializer_class = PropertySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(district__icontains=search) |
                Q(area_name__icontains=search) |
                Q(title__icontains=search)
            )
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        return queryset

    def perform_create(self, serializer):
        property_obj = serializer.save(owner=self.request.user)
        images = self.request.FILES.getlist('images')
        captions = self.request.POST.getlist('captions')
        try:
            main_index = int(self.request.POST.get('main_image_index', '0'))
        except ValueError:
            main_index = 0

        from .models import PropertyImage
        for i, image in enumerate(images):
            PropertyImage.objects.create(
                property=property_obj,
                image=image,
                caption=captions[i] if i < len(captions) else '',
                is_main=(i == main_index)
            )

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def toggle_compliance(self, request, pk=None):
        if request.user.user_type != 'ZRA':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        property_obj = self.get_object()
        property_obj.is_tax_compliant = not property_obj.is_tax_compliant
        property_obj.save()
        return Response({'is_tax_compliant': property_obj.is_tax_compliant})

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def zra_report(self, request):
        if request.user.user_type != 'ZRA':
            return Response({'error': 'Unauthorized'}, status=403)
        landlords = User.objects.filter(user_type='LANDLORD')
        stats = []
        for landlord in landlords:
            props = Property.objects.filter(owner=landlord)
            stats.append({
                'landlord_name': landlord.username,
                'property_count': props.count(),
                'annual_income_estimate': sum(float(p.price) * 12 for p in props)
            })
        return Response({'landlords': stats})

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def census_report(self, request):
        if request.user.user_type != 'MINISTRY':
            return Response({'error': 'Unauthorized'}, status=403)
        agreements = RentalAgreement.objects.filter(is_active=True)
        stats = {}
        for ag in agreements:
            dist = ag.property.district
            if dist not in stats:
                stats[dist] = {'total_population': 0, 'property_count': 0, 'by_category': {}}
            stats[dist]['total_population'] += ag.number_of_occupants
            stats[dist]['property_count'] += 1
            cat = ag.property.category
            stats[dist]['by_category'][cat] = stats[dist]['by_category'].get(cat, 0) + ag.number_of_occupants
        return Response(stats)


class RentalAgreementViewSet(viewsets.ModelViewSet):
    queryset = RentalAgreement.objects.all()
    serializer_class = RentalAgreementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'TENANT':
            return RentalAgreement.objects.filter(tenant=user)
        elif user.user_type == 'LANDLORD':
            return RentalAgreement.objects.filter(property__owner=user)
        return RentalAgreement.objects.all()

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def approve(self, request, pk=None):
        agreement = self.get_object()
        if agreement.property.owner != request.user:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        agreement.status = 'APPROVED'
        agreement.save()
        return Response({'status': 'Approved'})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def reject(self, request, pk=None):
        agreement = self.get_object()
        if agreement.property.owner != request.user:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        agreement.status = 'REJECTED'
        agreement.save()
        return Response({'status': 'Rejected'})


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Expense.objects.filter(property__owner=self.request.user)

    def perform_create(self, serializer):
        property_id = self.request.data.get('property')
        prop = get_object_or_404(Property, id=property_id)
        if prop.owner != self.request.user:
            raise permissions.PermissionDenied("You don't own this property.")
        serializer.save()