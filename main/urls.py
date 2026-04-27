from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from core.views import (
    index_page,
    auth_page,
    password_reset_confirm_page,
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
from core.urls import auth_urlpatterns


urlpatterns = [
    path('admin/', admin.site.urls),
    path('', index_page, name='index'),

    # ── IMPORTANT: HTML page routes MUST come before djoser includes ──
    # djoser registers /auth/password/reset/confirm/ at a similar path;
    # our HTML page sits at /auth/password-reset/confirm/ (note the hyphen).
    # Declaring it first ensures Django matches our view before djoser's.
    path('auth/login/', auth_page, name='auth-login-page'),
    path('auth/password-reset/confirm/', password_reset_confirm_page, name='password-reset-confirm-page'),
    path('signup/', auth_page, name='signup'),
    # ── API ───────────────────────────────────────────────────────────
    path('api/', include('core.urls')),

    # ── Djoser auth (token login/logout, /auth/users/) ────────────────
    path('auth/', include('djoser.urls')),
    path('auth/', include('djoser.urls.authtoken')),

    # ── Custom auth API endpoints (register, send-code, verify, reset) ─
    path('auth/', include(auth_urlpatterns)),

    # ── Other pages ───────────────────────────────────────────────────
    path('properties/add/', add_property_page, name='add-property'),
    path('dashboard/', dashboard_page, name='dashboard'),
    path('property/<int:pk>/', property_detail_page, name='property-detail'),
    path('gov/zra/', zra_dashboard_page, name='zra-dashboard'),
    path('gov/occupancy/', occupancy_dashboard_page, name='occupancy-dashboard'),
    path('property/<int:pk>/apply/', apply_page, name='apply-property'),
    

    # ZRA exports
    path('zra/export/pdf/',         zra_export_pdf,        name='zra-export-pdf'),
    path('zra/export/excel/',       zra_export_excel,      name='zra-export-excel'),
    # Ministry exports
    path('ministry/export/pdf/',    ministry_export_pdf,   name='ministry-export-pdf'),
    path('ministry/export/excel/',  ministry_export_excel, name='ministry-export-excel'),
    # Landlord exports
    path('dashboard/export/pdf/',   landlord_export_pdf,   name='landlord-export-pdf'),
    path('dashboard/export/excel/', landlord_export_excel, name='landlord-export-excel'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)