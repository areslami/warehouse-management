# marketplace/models.py
# 
# This file has been refactored into multiple modules for better organization.
# All imports here maintain backward compatibility.
# 
# Original file was 579 lines and has been split into:
# - models/base.py: Base mixins and common functionality
# - models/product_management.py: Product categories, products, and mappings  
# - models/offer_management.py: Product offers
# - models/sales_purchase.py: Sales and purchase transactions
# - models/delivery_logistics.py: Delivery addresses and logistics
#

from .models import *  # noqa: F401,F403