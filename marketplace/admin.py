# marketplace/admin.py
#
# This file has been refactored into multiple modules for better organization.
# All admin classes are registered within their respective modules using @admin.register decorators.
#
# Original file was 593 lines and has been split into:
# - admin/base.py: Common utilities, widgets, and base admin classes
# - admin/product.py: Product categories, products, and mapping administration
# - admin/offer.py: Product offer administration  
# - admin/sales.py: Sales and purchase management administration
#

# Import all admin modules to ensure registration
from .admin import *  # noqa: F401,F403

# Print success message for debugging
print("Marketplace admins registered successfully")