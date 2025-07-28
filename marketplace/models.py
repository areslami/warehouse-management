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


# ========== مدل‌های فروش بازارگاه (جدید) ==========

class MarketplaceSale(models.Model):
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
    
    created_at = jDateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')
    updated_at = jDateTimeField(auto_now=True, verbose_name='تاریخ ویرایش')
    
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
                # اینجا می‌توانید منطق استخراج گمرک ورودی را اضافه کنید
                # فعلاً فرض می‌کنیم در رسید انبار فیلد گمرک وجود دارد
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


class MarketplacePurchase(models.Model):
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
    
    # فیلدهای با طول افزایش یافته - FIX برای خطای character varying
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
    
    created_at = jDateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')
    updated_at = jDateTimeField(auto_now=True, verbose_name='تاریخ ویرایش')
    
    class Meta:
        verbose_name = 'خرید بازارگاه'
        verbose_name_plural = 'خریدهای بازارگاه'
        db_table = 'marketplace_purchases'
        ordering = ['-purchase_date', '-created_at']
        
        # اضافه کردن indexes برای بهبود performance
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

class MarketplacePurchaseDetail(models.Model):
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
    
    created_at = jDateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')
    updated_at = jDateTimeField(auto_now=True, verbose_name='تاریخ ویرایش')
    
    class Meta:
        verbose_name = 'جزئیات خرید بازارگاه'
        verbose_name_plural = 'جزئیات خریدهای بازارگاه'
        db_table = 'marketplace_purchase_details'
    
    def __str__(self):
        return f'جزئیات {self.purchase.purchase_id}'

class DeliveryAddress(models.Model):
    """آدرس تحویل (از فایل اکسل)"""
    
    VEHICLE_TYPES = [
        ('single', 'تک'),
        ('double', 'جفت'), 
        ('trailer', 'تریلی'),
    ]
    
    USER_TYPES = [
        ('individual', 'حقیقی'),
        ('company', 'حقوقی'),
    ]
    
    purchase_detail = models.ForeignKey(
        MarketplacePurchaseDetail,
        related_name='delivery_addresses',
        on_delete=models.CASCADE,
        verbose_name='جزئیات خرید'
    )
    
    # فیلدهای اصلی از اکسل
    code = models.CharField(max_length=100, verbose_name='کد', db_index=True)
    total_purchase_weight = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='وزن کل خرید')
    purchase_date = jDateField(verbose_name='تاریخ خرید')
    unit_price = models.DecimalField(max_digits=15, decimal_places=0, verbose_name='قیمت هر واحد')
    tracking_number = models.CharField(max_length=100, blank=True, verbose_name='شماره پیگیری')
    province = models.CharField(max_length=100, verbose_name='استان')
    city = models.CharField(max_length=100, verbose_name='شهرستان')
    paid_amount = models.DecimalField(max_digits=15, decimal_places=0, verbose_name='مبلغ پرداختی')
    buyer_account_number = models.CharField(max_length=50, blank=True, verbose_name='شماره حساب خریدار')
    cottage_code = models.CharField(max_length=50, verbose_name='کد کوتاژ')
    product_title = models.CharField(max_length=300, verbose_name='عنوان کالا')
    description = models.TextField(blank=True, verbose_name='توضیحات')
    payment_method = models.CharField(max_length=50, verbose_name='شیوه پرداخت')
    offer_id = models.CharField(max_length=100, verbose_name='شناسه عرضه')
    address_registration_date = jDateField(verbose_name='تاریخ ثبت آدرس')
    assignment_id = models.CharField(max_length=100, unique=True, verbose_name='شناسه تخصیص')
    buyer_name = models.CharField(max_length=200, verbose_name='نام خریدار')
    
    # فیلدهای افزایش طول داده شده - FIX برای خطای character varying(10)
    buyer_national_id = models.CharField(max_length=20, blank=True, verbose_name='شناسه ملی خریدار')
    buyer_postal_code = models.CharField(max_length=20, blank=True, verbose_name='کدپستی خریدار')
    
    buyer_address = models.TextField(verbose_name='آدرس خریدار')
    deposit_id = models.CharField(max_length=100, blank=True, verbose_name='شناسه واریز')
    
    # فیلدهای تلفن با طول افزایش یافته
    buyer_mobile = models.CharField(max_length=20, verbose_name='شماره همراه خریدار')
    
    buyer_unique_id = models.CharField(max_length=100, verbose_name='شناسه یکتا خریدار')
    buyer_user_type = models.CharField(max_length=20, choices=USER_TYPES, verbose_name='نوع کاربری خریدار')
    
    # اطلاعات تحویل گیرنده
    recipient_name = models.CharField(max_length=200, verbose_name='نام تحویل گیرنده')
    recipient_unique_id = models.CharField(max_length=100, verbose_name='شناسه یکتای تحویل')
    
    # نوع وسیله حمل
    vehicle_single = models.BooleanField(default=False, verbose_name='تک')
    vehicle_double = models.BooleanField(default=False, verbose_name='جفت')
    vehicle_trailer = models.BooleanField(default=False, verbose_name='تریلی')
    
    # آدرس تحویل با فیلدهای طول افزایش یافته
    delivery_address = models.TextField(verbose_name='آدرس تحویل')
    delivery_postal_code = models.CharField(max_length=20, blank=True, verbose_name='کد پستی تحویل')
    coordination_phone = models.CharField(max_length=20, verbose_name='شماره هماهنگی تحویل')
    delivery_national_id = models.CharField(max_length=20, blank=True, verbose_name='کد ملی تحویل')
    
    order_weight = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='وزن سفارش')
    
    # بازه‌های پرداخت توافقی (اختیاری)
    payment_period_1_days = models.IntegerField(blank=True, null=True, verbose_name='بازه 1 پرداخت توافقی (روز)')
    payment_period_2_days = models.IntegerField(blank=True, null=True, verbose_name='بازه 2 پرداخت توافقی (روز)')
    payment_period_3_days = models.IntegerField(blank=True, null=True, verbose_name='بازه 3 پرداخت توافقی (روز)')
    payment_amount_1 = models.DecimalField(max_digits=15, decimal_places=0, blank=True, null=True, verbose_name='مبلغ بازه 1 توافقی-ریال')
    payment_amount_2 = models.DecimalField(max_digits=15, decimal_places=0, blank=True, null=True, verbose_name='مبلغ بازه 2 توافقی-ریال')
    payment_amount_3 = models.DecimalField(max_digits=15, decimal_places=0, blank=True, null=True, verbose_name='مبلغ بازه 3 توافقی-ریال')
    
    # وزن‌های بارنامه
    shipped_weight = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='وزن بارنامه شده')
    unshipped_weight = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='وزن بارنامه نشده')
    
    created_at = jDateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')
    updated_at = jDateTimeField(auto_now=True, verbose_name='تاریخ ویرایش')
    
    class Meta:
        verbose_name = 'آدرس تحویل'
        verbose_name_plural = 'آدرس‌های تحویل'
        db_table = 'marketplace_delivery_addresses'
        ordering = ['-address_registration_date', '-created_at']
        
        # اضافه کردن indexes برای بهبود performance
        indexes = [
            models.Index(fields=['assignment_id'], name='idx_assignment_id'),
            models.Index(fields=['recipient_unique_id'], name='idx_recipient_unique'),
            models.Index(fields=['buyer_national_id'], name='idx_buyer_national'),
            models.Index(fields=['province', 'city'], name='idx_location'),
        ]
    
    def __str__(self):
        return f'آدرس {self.assignment_id} - {self.recipient_name}'
    
    @property
    def vehicle_type_display(self):
        """نمایش نوع وسیله حمل"""
        types = []
        if self.vehicle_single:
            types.append('تک')
        if self.vehicle_double:
            types.append('جفت')
        if self.vehicle_trailer:
            types.append('تریلی')
        return ', '.join(types) if types else '-'
    
    def clean(self):
        """اعتبارسنجی داده‌ها"""
        from django.core.exceptions import ValidationError
        
        # بررسی کد ملی در صورت وجود
        if self.buyer_national_id and len(self.buyer_national_id) > 0:
            # حذف کاراکترهای غیرعددی
            self.buyer_national_id = ''.join(filter(str.isdigit, str(self.buyer_national_id)))
            
        if self.delivery_national_id and len(self.delivery_national_id) > 0:
            self.delivery_national_id = ''.join(filter(str.isdigit, str(self.delivery_national_id)))
            
        # بررسی کد پستی در صورت وجود
        if self.buyer_postal_code and len(self.buyer_postal_code) > 0:
            self.buyer_postal_code = ''.join(filter(str.isdigit, str(self.buyer_postal_code)))
            
        if self.delivery_postal_code and len(self.delivery_postal_code) > 0:
            self.delivery_postal_code = ''.join(filter(str.isdigit, str(self.delivery_postal_code)))
            
        # بررسی شماره تلفن
        if self.buyer_mobile:
            self.buyer_mobile = ''.join(filter(str.isdigit, str(self.buyer_mobile)))
            
        if self.coordination_phone:
            self.coordination_phone = ''.join(filter(str.isdigit, str(self.coordination_phone)))
    
    def save(self, *args, **kwargs):
        """ذخیره با پاکسازی خودکار داده‌ها"""
        self.clean()
        super().save(*args, **kwargs)