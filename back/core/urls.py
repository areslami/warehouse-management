from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (ProductViewSet,SupplierViewSet, CustomerViewSet, ReceiverViewSet)

router = DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'suppliers', SupplierViewSet)
router.register(r'customers', CustomerViewSet)
router.register(r'receivers', ReceiverViewSet)

urlpatterns = [
    path('', include(router.urls)),
]