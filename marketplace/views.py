# marketplace/views.py
#
# This file has been refactored into multiple modules for better organization.
# All imports here maintain backward compatibility.
#
# Original file was 518 lines and has been split into:
# - views/mixins.py: Common mixins and utilities
# - views/purchase_views.py: Purchase-related Excel operations
# - views/delivery_views.py: Delivery address Excel operations
#

from .views import *  # noqa: F401,F403