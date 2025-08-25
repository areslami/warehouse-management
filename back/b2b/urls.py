from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    B2BOfferViewSet, 
    B2BSaleViewSet, 
    B2BPurchaseViewSet, 
    B2BPurchaseDetailViewSet,
    B2BDistributionViewSet
)
from .excel_views import (
    upload_excel,
    preview_distribution,
    create_distributions_batch,
    search_customer
)

router = DefaultRouter()
router.register(r'offers', B2BOfferViewSet, basename='b2boffer')
router.register(r'sales', B2BSaleViewSet, basename='b2bsale')
router.register(r'purchases', B2BPurchaseViewSet, basename='b2bpurchase')
router.register(r'purchase-details', B2BPurchaseDetailViewSet, basename='b2bpurchasedetail')
router.register(r'distributions', B2BDistributionViewSet, basename='b2bdistribution')

urlpatterns = [
    path('', include(router.urls)),
    path('excel/upload/', upload_excel, name='excel-upload'),
    path('excel/preview/', preview_distribution, name='excel-preview'),
    path('excel/batch-create/', create_distributions_batch, name='excel-batch-create'),
    path('customers/search/', search_customer, name='customer-search'),
]