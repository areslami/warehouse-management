# marketplace/models/offer_management.py
from django.db import models
from django_jalali.db.models import jDateTimeField, jDateField
from .base import TimestampMixin
from .product_management import MarketplaceProduct


class ProductOffer(TimestampMixin, models.Model):
    """عرضه کالا در بازارگاه"""
    
    OFFER_TYPES = [
        ('cash', 'نقدی'),
        ('agreement', 'توافقی'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'پیش‌نویس'),
        ('pending', 'در انتظار تایید'),
        ('active', 'فعال'),
        ('sold', 'فروخته شده'),
        ('expired', 'منقضی شده'),
        ('cancelled', 'لغو شده'),
    ]
    
    offer_id = models.CharField(max_length=100, unique=True, verbose_name='شناسه عرضه')
    
    # ارتباط با رسید انبار
    warehouse_receipt = models.ForeignKey(
        'warehouse.WarehouseReceipt',
        on_delete=models.CASCADE,
        verbose_name='رسید انبار (کوتاژ)',
        limit_choices_to={'receipt_type__in': ['import_cottage', 'distribution_agency']}
    )
    
    marketplace_product = models.ForeignKey(MarketplaceProduct, on_delete=models.CASCADE, verbose_name='کالای بازارگاه')
    offer_date = jDateField(verbose_name='تاریخ عرضه')
    offer_weight = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='وزن عرضه (تن)')
    unit_price = models.DecimalField(max_digits=15, decimal_places=0, verbose_name='قیمت فروش (ریال)')
    total_price = models.DecimalField(max_digits=18, decimal_places=0, verbose_name='مبلغ کل', editable=False)
    
    offer_type = models.CharField(max_length=10, choices=OFFER_TYPES, default='cash', verbose_name='نوع عرضه پیشنهادی')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft', verbose_name='وضعیت عرضه')
    
    description = models.TextField(blank=True, verbose_name='توضیحات')
    notes = models.TextField(blank=True, verbose_name='یادداشت‌ها')
    
    class Meta:
        verbose_name = 'عرضه کالا'
        verbose_name_plural = 'عرضه‌های کالا'
        db_table = 'marketplace_product_offers'
        ordering = ['-offer_date', '-created_at']
    
    def __str__(self):
        return f'عرضه {self.offer_id} - {self.marketplace_product.marketplace_name}'
    
    def save(self, *args, **kwargs):
        self.total_price = self.offer_weight * self.unit_price
        super().save(*args, **kwargs)
    
    @property
    def cottage_number(self):
        return self.warehouse_receipt.cottage_number if self.warehouse_receipt else None
    
    @property
    def internal_product(self):
        return self.marketplace_product.internal_product if self.marketplace_product else None