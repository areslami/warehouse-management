from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductViewSet,
    SupplierViewSet,
    CustomerViewSet,
    ReceiverViewSet,
    IndicatorViewSet,
)

router = DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'suppliers', SupplierViewSet)
router.register(r'customers', CustomerViewSet)
router.register(r'receivers', ReceiverViewSet)
router.register(r'indicators', IndicatorViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
