# marketplace/admin/__init__.py

# Import all admin classes from modules
from .base import *
from .product import *
from .offer import *
from .sales import *

# Admin registration is handled within each module using @admin.register decorators
# This ensures all models are properly registered with the Django admin