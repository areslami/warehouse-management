from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductCategoryViewSet, ProductReigonViewSet, ProductViewSet,
    SupplierViewSet, CustomerViewSet, RecieverViewSet
)

router = DefaultRouter()
router.register(r'product-categories', ProductCategoryViewSet)
router.register(r'product-regions', ProductReigonViewSet)
router.register(r'products', ProductViewSet)
router.register(r'suppliers', SupplierViewSet)
router.register(r'customers', CustomerViewSet)
router.register(r'receivers', RecieverViewSet)

urlpatterns = [
    path('', include(router.urls)),
]