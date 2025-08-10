from django.urls import path, include
from rest_framework import routers
from .views import (
    PurchaseProformaViewSet, SalesProformaViewSet,
    ProformaLineViewSet
)

router = routers.DefaultRouter()
router.register(r'purchase-proformas', PurchaseProformaViewSet)
router.register(r'sales-proformas', SalesProformaViewSet)
router.register(r'proforma-lines', ProformaLineViewSet)

urlpatterns = [
    path('', include(router.urls)),
]