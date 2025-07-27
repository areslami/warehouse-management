# marketplace/models.py
from django.db import models
from django_jalali.db.models import jDateTimeField, jDateField
from warehouse.models.base import Product, ProductCategory


class MarketplaceProductCategory(models.Model):
    """گروه‌های کالایی بازارگاه"""
    
    marketplace_id = models.CharField(max_length=50, unique=True, verbose_name='کد گروه در بازارگاه')
    marketplace_name = models.CharField(max_length=200, verbose_name='نام گروه در بازارگاه')
    marketplace_parent_id = models.CharField(max_length=50, blank=True, null=True, verbose_name='کد گروه والد در بازارگاه')
    description = models.TextField(blank=True, verbose_name='توضیحات')
    is_active = models.BooleanField(default=True, verbose_name='فعال')
    
    internal_category = models.ForeignKey(
        ProductCategory, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        verbose_name='گروه کالایی داخلی مرتبط'
    )
    
    created_at = jDateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')
    updated_at = jDateTimeField(auto_now=True, verbose_name='تاریخ ویرایش')
    
    class Meta:
        verbose_name = 'گروه کالایی بازارگاه'
        verbose_name_plural = 'گروه‌های کالایی بازارگاه'
        db_table = 'marketplace_product_categories'
        ordering = ['marketplace_name']
    
    def __str__(self):
        return f'{self.marketplace_name} ({self.marketplace_id})'


class MarketplaceProduct(models.Model):
    """کالاهای بازارگاه"""
    
    marketplace_id = models.CharField(max_length=100, unique=True, verbose_name='کد کالا در بازارگاه')
    marketplace_name = models.CharField(max_length=300, verbose_name='نام کالا در بازارگاه')
    marketplace_brand = models.CharField(max_length=100, blank=True, verbose_name='برند در بازارگاه')
    marketplace_model = models.CharField(max_length=100, blank=True, verbose_name='مدل در بازارگاه')
    marketplace_unit = models.CharField(max_length=50, blank=True, verbose_name='واحد در بازارگاه')
    
    marketplace_category = models.ForeignKey(
        MarketplaceProductCategory,
        on_delete=models.CASCADE,
        verbose_name='گروه کالایی بازارگاه'
    )
    
    specifications = models.JSONField(default=dict, blank=True, verbose_name='مشخصات فنی')
    description = models.TextField(blank=True, verbose_name='توضیحات')
    is_active = models.BooleanField(default=True, verbose_name='فعال')
    
    internal_product = models.ForeignKey(
        Product,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='کالای داخلی مرتبط'
    )
    
    created_at = jDateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')
    updated_at = jDateTimeField(auto_now=True, verbose_name='تاریخ ویرایش')
    
    class Meta:
        verbose_name = 'کالای بازارگاه'
        verbose_name_plural = 'کالاهای بازارگاه'
        db_table = 'marketplace_products'
        ordering = ['marketplace_name']
    
    def __str__(self):
        return f'{self.marketplace_name} ({self.marketplace_id})'
    
    @property
    def has_internal_mapping(self):
        return self.internal_product is not None


class ProductMapping(models.Model):
    """جدول تطبیق کالاهای بازارگاه با کالاهای داخلی"""
    
    MAPPING_STATUS_CHOICES = [
        ('pending', 'در انتظار تایید'),
        ('confirmed', 'تایید شده'),
        ('rejected', 'رد شده'),
        ('need_review', 'نیاز به بررسی'),
    ]
    
    marketplace_product = models.ForeignKey(MarketplaceProduct, on_delete=models.CASCADE, verbose_name='کالای بازارگاه')
    internal_product = models.ForeignKey(Product, on_delete=models.CASCADE, verbose_name='کالای داخلی')
    status = models.CharField(max_length=20, choices=MAPPING_STATUS_CHOICES, default='pending', verbose_name='وضعیت تطبیق')
    conversion_factor = models.DecimalField(max_digits=10, decimal_places=4, default=1, verbose_name='ضریب تبدیل')
    notes = models.TextField(blank=True, verbose_name='یادداشت‌ها')
    
    created_by = models.CharField(max_length=100, blank=True, verbose_name='ایجادکننده')
    confirmed_by = models.CharField(max_length=100, blank=True, verbose_name='تاییدکننده')
    confirmed_at = jDateTimeField(null=True, blank=True, verbose_name='تاریخ تایید')
    
    created_at = jDateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')
    updated_at = jDateTimeField(auto_now=True, verbose_name='تاریخ ویرایش')
    
    class Meta:
        verbose_name = 'تطبیق کالا'
        verbose_name_plural = 'تطبیق‌های کالا'
        db_table = 'marketplace_product_mappings'
        unique_together = ['marketplace_product', 'internal_product']
        ordering = ['-created_at']
    
    def __str__(self):
        return f'{self.marketplace_product.marketplace_name} ↔ {self.internal_product.name}'


class ProductOffer(models.Model):
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
    
    created_at = jDateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')
    updated_at = jDateTimeField(auto_now=True, verbose_name='تاریخ ویرایش')
    
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