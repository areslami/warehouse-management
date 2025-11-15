# marketplace/models/__init__.py

# Import all models to maintain backward compatibility
from .base import TimestampMixin, StatusMixin
from .offer_management import ProductOffer
from .sales_purchase import (
    MarketplaceSale,
    MarketplacePurchase,  
    MarketplacePurchaseDetail,
    DistributionAgency
)
from .delivery_logistics import DeliveryAddress

# Make all models available at package level
__all__ = [
    # Base classes
    'TimestampMixin',
    'StatusMixin',
    
    # Offer management
    'ProductOffer',
    
    # Sales and purchases
    'MarketplaceSale',
    'MarketplacePurchase',
    'MarketplacePurchaseDetail',
    'DistributionAgency',
    
    # Delivery and logistics
    'DeliveryAddress',
]