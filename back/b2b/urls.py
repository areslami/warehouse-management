from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    B2BOfferViewSet, 
    B2BSaleViewSet, 
    B2BDistributionViewSet
)
from .excel_views import (
    upload_excel_distribution,
    upload_excel_sale,
    preview_distribution,
    preview_sale,
    create_distributions_batch,
    create_sale_batch
)

router = DefaultRouter()
router.register(r'offers', B2BOfferViewSet, basename='b2boffer')
router.register(r'sales', B2BSaleViewSet, basename='b2bsale')
router.register(r'distributions', B2BDistributionViewSet, basename='b2bdistribution')

urlpatterns = [
    path('', include(router.urls)),
    path('distribution/upload/', upload_excel_distribution, name='distribution-upload'),
    path('sale/upload/', upload_excel_sale, name='sale-upload'),
    path('distribution/preview/', preview_distribution, name='distribution-preview'),
    path('sale/preview/', preview_sale, name='sale-preview'),
    path('distribution/create/', create_distributions_batch, name='distribution-create'),
    path('sale/create/', create_sale_batch, name='sale-create'),
]