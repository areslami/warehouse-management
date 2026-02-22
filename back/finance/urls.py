from django.urls import path, include
from rest_framework import routers
from .views import (
    PurchaseProformaViewSet,
    SalesProformaViewSet,
    ProformaLineViewSet,
    ProformaExportPresetViewSet,
)

router = routers.DefaultRouter()
router.register(r"purchase-proformas", PurchaseProformaViewSet)
router.register(r"sales-proformas", SalesProformaViewSet)
router.register(r"proforma-lines", ProformaLineViewSet)
router.register(r"sales-proforma-presets", ProformaExportPresetViewSet)

urlpatterns = [
    path("", include(router.urls)),
]