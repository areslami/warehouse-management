from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    WarehouseViewSet, ShippingCompanyViewSet, WarehouseReceiptViewSet,
    DispatchIssueViewSet, DeliveryFulfillmentViewSet, upload_delivery_excel,
    batch_create_deliveries
)

router = DefaultRouter()
router.register(r'warehouses', WarehouseViewSet)
router.register(r'shipping-companies', ShippingCompanyViewSet)
router.register(r'receipts', WarehouseReceiptViewSet)
router.register(r'dispatches', DispatchIssueViewSet)
router.register(r'deliveries', DeliveryFulfillmentViewSet)

urlpatterns = [
    # Custom paths must come before router.urls to avoid conflicts
    path('deliveries/upload/', upload_delivery_excel, name='upload-delivery-excel'),
    path('deliveries/batch/', batch_create_deliveries, name='batch-create-deliveries'),
    path('', include(router.urls)),
]