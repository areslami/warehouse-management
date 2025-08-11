from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    B2BOfferViewSet, 
    B2BSaleViewSet, 
    B2BPurchaseViewSet, 
    B2BPurchaseDetailViewSet,
    B2BDistributionViewSet
)

router = DefaultRouter()
router.register(r'offers', B2BOfferViewSet, basename='b2boffer')
router.register(r'sales', B2BSaleViewSet, basename='b2bsale')
router.register(r'purchases', B2BPurchaseViewSet, basename='b2bpurchase')
router.register(r'purchase-details', B2BPurchaseDetailViewSet, basename='b2bpurchasedetail')
router.register(r'distributions', B2BDistributionViewSet, basename='b2bdistribution')

urlpatterns = [
    path('', include(router.urls)),
]