# marketplace/models/product_management.py
from django.db import models
from django_jalali.db.models import jDateTimeField
from warehouse.models.base import Product, ProductCategory
from .base import TimestampMixin, StatusMixin


class MarketplaceProductCategory(TimestampMixin, StatusMixin, models.Model):
    """گروه‌های کالایی بازارگاه"""
    
    marketplace_id = models.CharField(max_length=50, unique=True, verbose_name='کد گروه در بازارگاه')
    marketplace_name = models.CharField(max_length=200, verbose_name='نام گروه در بازارگاه')
    marketplace_parent_id = models.CharField(max_length=50, blank=True, null=True, verbose_name='کد گروه والد در بازارگاه')
    description = models.TextField(blank=True, verbose_name='توضیحات')
    
    internal_category = models.ForeignKey(
        ProductCategory, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        verbose_name='گروه کالایی داخلی مرتبط'
    )
    
    class Meta:
        verbose_name = 'گروه کالایی بازارگاه'
        verbose_name_plural = 'گروه‌های کالایی بازارگاه'
        db_table = 'marketplace_product_categories'
        ordering = ['marketplace_name']
    
    def __str__(self):
        return f'{self.marketplace_name} ({self.marketplace_id})'


class MarketplaceProduct(TimestampMixin, StatusMixin, models.Model):
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
    
    internal_product = models.ForeignKey(
        Product,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='کالای داخلی مرتبط'
    )
    
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


class ProductMapping(TimestampMixin, models.Model):
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
    
    class Meta:
        verbose_name = 'تطبیق کالا'
        verbose_name_plural = 'تطبیق‌های کالا'
        db_table = 'marketplace_product_mappings'
        unique_together = ['marketplace_product', 'internal_product']
        ordering = ['-created_at']
    
    def __str__(self):
        return f'{self.marketplace_product.marketplace_name} ↔ {self.internal_product.name}'