from django.contrib import admin
from django.utils.translation import gettext_lazy as _

class MarketplaceOfferFilter(admin.SimpleListFilter):
    title = _('وضعیت عرضه در بازارگاه')
    parameter_name = 'marketplace_offer_status'

    def lookups(self, request, model_admin):
        return (
            ('offered', _('عرضه شده')),
            ('not_offered', _('عرضه نشده')),
            ('has_active', _('دارای عرضه فعال')),
            ('has_sold', _('دارای عرضه فروخته شده')),
        )

    def queryset(self, request, queryset):
        try:
            from marketplace.models import ProductOffer
            
            if self.value() == 'offered':
                # رسیدهایی که حداقل یک عرضه دارند
                return queryset.filter(
                    id__in=ProductOffer.objects.values_list('warehouse_receipt_id', flat=True)
                )
            elif self.value() == 'not_offered':
                # رسیدهایی که هیچ عرضه‌ای ندارند
                return queryset.exclude(
                    id__in=ProductOffer.objects.values_list('warehouse_receipt_id', flat=True)
                )
            elif self.value() == 'has_active':
                # رسیدهایی که عرضه فعال دارند
                return queryset.filter(
                    id__in=ProductOffer.objects.filter(status='active').values_list('warehouse_receipt_id', flat=True)
                )
            elif self.value() == 'has_sold':
                # رسیدهایی که عرضه فروخته شده دارند
                return queryset.filter(
                    id__in=ProductOffer.objects.filter(status='sold').values_list('warehouse_receipt_id', flat=True)
                )
        except ImportError:
            # اگر marketplace app وجود نداشته باشد
            pass
        
        return queryset