# marketplace/views/__init__.py

# Import all view functions to maintain backward compatibility
from .purchase_views import (
    download_purchases_excel,
    download_purchases_template,
    upload_purchases_excel
)

from .delivery_views import (
    download_delivery_template,
    upload_delivery_addresses
)

# Make all views available at package level
__all__ = [
    # Purchase views
    'download_purchases_excel',
    'download_purchases_template', 
    'upload_purchases_excel',
    
    # Delivery views
    'download_delivery_template',
    'upload_delivery_addresses',
]