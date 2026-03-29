from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from core.views import (
    index_page,
    auth_page,
    add_property_page,
    dashboard_page,
    property_detail_page,
    zra_dashboard_page,
    occupancy_dashboard_page,
    apply_page,
    zra_export_pdf,
    zra_export_excel,
    ministry_export_pdf,
    ministry_export_excel,
    landlord_export_pdf,
    landlord_export_excel,
)


urlpatterns = [
    path('admin/', admin.site.urls),
    path('', index_page, name='index'),
    path('api/', include('core.urls')),
    path('auth/', include('djoser.urls')),
    path('auth/', include('djoser.urls.authtoken')),
    path('auth/login/', auth_page, name='login'),
    path('properties/add/', add_property_page, name='add-property'),
    path('dashboard/', dashboard_page, name='dashboard'),
    path('property/<int:pk>/', property_detail_page, name='property-detail'),
    path('gov/zra/', zra_dashboard_page, name='zra-dashboard'),
    path('gov/occupancy/', occupancy_dashboard_page, name='occupancy-dashboard'),
    path('property/<int:pk>/apply/', apply_page, name='apply-property'),

    # ZRA
    path('zra/export/pdf/',              zra_export_pdf,         name='zra-export-pdf'),
    path('zra/export/excel/',            zra_export_excel,       name='zra-export-excel'),
    # Ministry
    path('ministry/export/pdf/',         ministry_export_pdf,    name='ministry-export-pdf'),
    path('ministry/export/excel/',       ministry_export_excel,  name='ministry-export-excel'),
    # Landlord dashboard
    path('dashboard/export/pdf/',        landlord_export_pdf,    name='landlord-export-pdf'),
    path('dashboard/export/excel/',      landlord_export_excel,  name='landlord-export-excel'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)