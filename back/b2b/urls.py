from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    B2BOfferViewSet, 
    B2BAddressViewSet, 
    B2BDistributionViewSet,
    B2BSaleViewSet
)
from .excel_views import (
    upload_excel_sales,
    upload_excel_addresses,
    preview_sales,
    preview_addresses,
    create_sales_batch,
    create_addresses_batch,
    export_addresses_xlsx,
    export_offers_xlsx,
    export_distributions_xlsx,
    export_sales_xlsx
)

router = DefaultRouter()
router.register(r'offers', B2BOfferViewSet, basename='b2boffer')
router.register(r'address', B2BAddressViewSet, basename='b2baddress')
router.register(r'sales', B2BSaleViewSet, basename='b2bsale')
router.register(r'distributions', B2BDistributionViewSet, basename='b2bdistribution')

urlpatterns = [
    path('sales/upload/', upload_excel_sales, name='sales-upload'),
    path('addresses/upload/', upload_excel_addresses, name='addresses-upload'),
    path('sales/preview/', preview_sales, name='sales-preview'),
    path('addresses/preview/', preview_addresses, name='addresses-preview'),
    path('sales/create/', create_sales_batch, name='sales-create'),
    path('addresses/create/', create_addresses_batch, name='addresses-create'),
    path('addresses/export/', export_addresses_xlsx, name='addresses-export'),
    path('offers/export/', export_offers_xlsx, name='offers-export'),
    path('distributions/export/', export_distributions_xlsx, name='distributions-export'),
    path('sales/export/', export_sales_xlsx, name='sales-export'),
    path('', include(router.urls)),
]
