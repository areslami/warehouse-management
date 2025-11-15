
# marketplace/apps.py
from django.apps import AppConfig


class MarketplaceConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'marketplace'
    verbose_name = 'بازارگاه'
    
    def ready(self):
        # لود کردن سیگنال‌ها
        try:
            import marketplace.signals
            marketplace.signals.connect_signals()
        except ImportError:
            pass