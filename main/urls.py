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
)
from core.exports import export_xlsx_view, export_pdf_report

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
    path('export/xlsx/', export_xlsx_view, name='export-xlsx'),
    path('export/pdf/', export_pdf_report, name='export-pdf'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)