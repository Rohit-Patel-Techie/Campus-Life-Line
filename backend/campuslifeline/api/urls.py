from django.urls import path
from . import views

urlpatterns = [
    path("donors/", views.create_donor),
    path("donors/list/", views.list_donors),

    path("requests/", views.create_request),
    path("guidance/", views.gemini_guidance, name="gemini_guidance"),
    path("requests/status-lookup/", views.status_lookup),

    path("requests/<str:request_id>/", views.get_request),
    path("requests/<str:request_id>/matches/", views.list_matching_donors),
    path("requests/<str:request_id>/alerts/", views.send_alerts),
    path("requests/<str:request_id>/respond/", views.respond_request),
    path("requests/<str:request_id>/status/", views.request_status),
]