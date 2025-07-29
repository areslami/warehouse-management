# marketplace/models/delivery_logistics.py
from django.db import models
from django_jalali.db.models import jDateTimeField, jDateField
from .base import TimestampMixin
from .sales_purchase import MarketplacePurchaseDetail


class DeliveryAddress(TimestampMixin, models.Model):
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
    
    # فیلدهای افزایش طول داده شده
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
    
    class Meta:
        verbose_name = 'آدرس تحویل'
        verbose_name_plural = 'آدرس‌های تحویل'
        db_table = 'marketplace_delivery_addresses'
        ordering = ['-address_registration_date', '-created_at']
        
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