from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    WarehouseViewSet, ShippingCompanyViewSet, WarehouseReceiptViewSet,
    DispatchIssueViewSet, DeliveryFulfillmentViewSet
)

router = DefaultRouter()
router.register(r'warehouses', WarehouseViewSet)
router.register(r'shipping-companies', ShippingCompanyViewSet)
router.register(r'receipts', WarehouseReceiptViewSet)
router.register(r'dispatches', DispatchIssueViewSet)
router.register(r'deliveries', DeliveryFulfillmentViewSet)

urlpatterns = [
    path('', include(router.urls)),
]