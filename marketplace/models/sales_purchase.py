# marketplace/models/sales_purchase.py
from django.db import models
from django_jalali.db.models import jDateTimeField, jDateField
from .base import TimestampMixin
from .offer_management import ProductOffer


class MarketplaceSale(TimestampMixin, models.Model):
    """فروش بازارگاه"""
    
    product_offer = models.ForeignKey(
        ProductOffer, 
        on_delete=models.CASCADE, 
        verbose_name='شناسه عرضه'
    )
    
    # فیلدهای محاسبه‌ای خودکار
    cottage_number = models.CharField(
        max_length=50, 
        verbose_name='شماره کوتاژ', 
        editable=False
    )
    product_title = models.CharField(
        max_length=300, 
        verbose_name='عنوان کالا', 
        editable=False
    )
    offer_unit_price = models.DecimalField(
        max_digits=15, 
        decimal_places=0, 
        verbose_name='فی عرضه', 
        editable=False
    )
    total_offer_weight = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        verbose_name='وزن کل عرضه شده', 
        editable=False
    )
    
    # فیلدهای محاسبه‌ای (خودکار از جمع خریدها)
    sold_weight_before_transport = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0,
        verbose_name='وزن فروش رفته قبل از حمل',
        editable=False
    )
    remaining_weight_before_transport = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0,
        verbose_name='وزن باقیمانده قبل از حمل',
        editable=False
    )
    sold_weight_after_transport = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0,
        verbose_name='وزن فروش رفته پس از حمل',
        editable=False
    )
    remaining_weight_after_transport = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0,
        verbose_name='وزن باقیمانده پس از حمل',
        editable=False
    )
    
    # وضعیت عرضه (از ProductOffer)
    offer_status = models.CharField(
        max_length=10, 
        verbose_name='وضعیت عرضه',
        editable=False
    )
    
    # گمرک ورودی (از رسید انبار)
    entry_customs = models.CharField(
        max_length=200, 
        verbose_name='گمرک ورودی',
        blank=True,
        editable=False
    )
    
    class Meta:
        verbose_name = 'فروش بازارگاه'
        verbose_name_plural = 'فروش‌های بازارگاه'
        db_table = 'marketplace_sales'
        ordering = ['-created_at']
    
    def __str__(self):
        return f'فروش {self.product_offer.offer_id} - {self.product_title}'
    
    def save(self, *args, **kwargs):
        # لود کردن اطلاعات از عرضه
        if self.product_offer:
            self.cottage_number = self.product_offer.cottage_number or ''
            self.product_title = self.product_offer.marketplace_product.marketplace_name
            self.offer_unit_price = self.product_offer.unit_price
            self.total_offer_weight = self.product_offer.offer_weight
            self.offer_status = self.product_offer.status
            
            # گمرک ورودی از رسید انبار
            if hasattr(self.product_offer, 'warehouse_receipt') and self.product_offer.warehouse_receipt:
                self.entry_customs = getattr(self.product_offer.warehouse_receipt, 'entry_customs', '')
        
        super().save(*args, **kwargs)
        
        # محاسبه مجدد وزن‌ها
        self.calculate_weights()
    
    def calculate_weights(self):
        """محاسبه خودکار وزن‌ها از روی خریدها"""
        purchases = self.purchases.all()
        
        # محاسبه وزن فروش رفته قبل از حمل
        self.sold_weight_before_transport = purchases.aggregate(
            total=models.Sum('purchase_weight')
        )['total'] or 0
        
        # محاسبه وزن باقیمانده قبل از حمل
        self.remaining_weight_before_transport = self.total_offer_weight - self.sold_weight_before_transport
        
        # فعلاً وزن‌های پس از حمل صفر (بعداً از مراحل بعدی محاسبه خواهد شد)
        self.sold_weight_after_transport = 0
        self.remaining_weight_after_transport = self.total_offer_weight
        
        # ذخیره با فیلدهای خاص
        MarketplaceSale.objects.filter(id=self.id).update(
            sold_weight_before_transport=self.sold_weight_before_transport,
            remaining_weight_before_transport=self.remaining_weight_before_transport,
            sold_weight_after_transport=self.sold_weight_after_transport,
            remaining_weight_after_transport=self.remaining_weight_after_transport
        )


class MarketplacePurchase(TimestampMixin, models.Model):
    """خرید از بازارگاه"""
    
    PURCHASE_TYPES = [
        ('cash', 'نقدی'),
        ('agreement', 'توافقی'),
        ('mixed', 'ترکیبی'),
    ]
    
    marketplace_sale = models.ForeignKey(
        MarketplaceSale,
        related_name='purchases', 
        on_delete=models.CASCADE,
        verbose_name='فروش بازارگاه'
    )
    
    # اطلاعات اصلی خرید
    purchase_id = models.CharField(
        max_length=100, 
        unique=True, 
        verbose_name='شناسه خرید',
        db_index=True
    )
    purchase_weight = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        verbose_name='وزن خرید'
    )
    purchase_date = jDateField(verbose_name='تاریخ خرید')
    buyer_name = models.CharField(max_length=200, verbose_name='نام خریدار')
    
    # فیلدهای با طول افزایش یافته
    buyer_mobile = models.CharField(max_length=20, verbose_name='شماره همراه خریدار')
    buyer_national_id = models.CharField(max_length=20, verbose_name='شماره ملی خریدار')
    
    paid_amount = models.DecimalField(
        max_digits=15, 
        decimal_places=0, 
        verbose_name='مبلغ پرداختی'
    )
    purchase_type = models.CharField(
        max_length=20, 
        choices=PURCHASE_TYPES,
        verbose_name='نوع خرید'
    )
    
    class Meta:
        verbose_name = 'خرید بازارگاه'
        verbose_name_plural = 'خریدهای بازارگاه'
        db_table = 'marketplace_purchases'
        ordering = ['-purchase_date', '-created_at']
        
        indexes = [
            models.Index(fields=['purchase_id'], name='idx_purchase_id'),
            models.Index(fields=['buyer_national_id'], name='idx_buyer_national_purchase'),
            models.Index(fields=['purchase_date', 'purchase_type'], name='idx_purchase_date_type'),
        ]
    
    def __str__(self):
        return f'خرید {self.purchase_id} - {self.buyer_name}'
    
    def clean(self):
        """اعتبارسنجی و پاکسازی داده‌ها"""
        from django.core.exceptions import ValidationError
        
        # پاکسازی شماره ملی
        if self.buyer_national_id:
            self.buyer_national_id = ''.join(filter(str.isdigit, str(self.buyer_national_id)))
            
        # پاکسازی شماره تلفن
        if self.buyer_mobile:
            self.buyer_mobile = ''.join(filter(str.isdigit, str(self.buyer_mobile)))
            
        # بررسی وزن خرید
        if self.purchase_weight and self.purchase_weight <= 0:
            raise ValidationError('وزن خرید باید بیشتر از صفر باشد')
            
        # بررسی مبلغ پرداختی
        if self.paid_amount and self.paid_amount < 0:
            raise ValidationError('مبلغ پرداختی نمی‌تواند منفی باشد')
    
    def save(self, *args, **kwargs):
        """ذخیره با پاکسازی خودکار داده‌ها"""
        self.clean()
        super().save(*args, **kwargs)
        
        # به‌روزرسانی محاسبات فروش والد
        if self.marketplace_sale:
            self.marketplace_sale.calculate_weights()


class MarketplacePurchaseDetail(TimestampMixin, models.Model):
    """جزئیات فروش بازارگاه (رکورد کامل هر خرید)"""
    
    purchase = models.OneToOneField(
        MarketplacePurchase,
        on_delete=models.CASCADE,
        verbose_name='خرید',
        related_name='detail'
    )
    
    # توضیحات فروش توافقی
    agreement_description = models.TextField(
        blank=True,
        verbose_name='توضیحات فروش توافقی'
    )
    
    class Meta:
        verbose_name = 'جزئیات خرید بازارگاه'
        verbose_name_plural = 'جزئیات خریدهای بازارگاه'
        db_table = 'marketplace_purchase_details'
    
    def __str__(self):
        return f'جزئیات {self.purchase.purchase_id}'