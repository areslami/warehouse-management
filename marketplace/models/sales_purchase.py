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
            self.product_title = self.product_offer.product.name
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
    cottage_number = models.CharField(
        max_length=50,
        default='',
        verbose_name='شماره کوتاژ',
        help_text='باید با شماره کوتاژ عرضه تطابق داشته باشد'
    )
    description = models.TextField(
        blank=True,
        verbose_name='توضیحات'
    )
    purchase_weight = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        verbose_name='وزن خرید شده-Kg'
    )
    province = models.CharField(
        max_length=100,
        default='',
        verbose_name='استان'
    )
    purchase_date = jDateField(verbose_name='تاریخ خرید')
    paid_amount = models.DecimalField(
        max_digits=15, 
        decimal_places=0, 
        verbose_name='مبلغ پرداختی-ریال'
    )
    unit_price = models.DecimalField(
        max_digits=15,
        decimal_places=0,
        default=0,
        verbose_name='قیمت هر واحد-ریال'
    )
    delivery_date = jDateField(
        null=True,
        blank=True,
        verbose_name='تاریخ تحویل'
    )
    tracking_number = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='شماره پیگیری'
    )
    document_registration_date = jDateField(
        null=True,
        blank=True,
        verbose_name='تاریخ ثبت سند'
    )
    product_title = models.CharField(
        max_length=300,
        default='',
        verbose_name='عنوان کالا'
    )
    buyer_national_id = models.CharField(
        max_length=20, 
        verbose_name='کد ملی خریدار',
        help_text='کد ملی یا شناسه ملی'
    )
    buyer_account_number = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='شماره حساب خریدار'
    )
    buyer_mobile = models.CharField(
        max_length=20, 
        verbose_name='شماره همراه خریدار'
    )
    buyer_name = models.CharField(
        max_length=200, 
        verbose_name='نام خریدار'
    )
    purchase_type = models.CharField(
        max_length=20, 
        choices=PURCHASE_TYPES,
        verbose_name='شیوه پرداخت'
    )
    
    # بازه‌های پرداخت توافقی
    agreement_period_1 = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='بازه 1 پرداخت توافقی (روز)'
    )
    agreement_period_2 = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='بازه 2 پرداخت توافقی (روز)'
    )
    agreement_period_3 = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='بازه 3 پرداخت توافقی (روز)'
    )
    agreement_amount_1 = models.DecimalField(
        max_digits=15,
        decimal_places=0,
        null=True,
        blank=True,
        verbose_name='مبلغ بازه 1 توافقی-ریال'
    )
    agreement_amount_2 = models.DecimalField(
        max_digits=15,
        decimal_places=0,
        null=True,
        blank=True,
        verbose_name='مبلغ بازه 2 توافقی-ریال'
    )
    agreement_amount_3 = models.DecimalField(
        max_digits=15,
        decimal_places=0,
        null=True,
        blank=True,
        verbose_name='مبلغ بازه 3 توافقی-ریال'
    )
    supply_id = models.CharField(
        max_length=100,
        default='',
        verbose_name='شناسه عرضه'
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
        from ..models.offer_management import ProductOffer
        
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
            
        # اعتبارسنجی شماره کوتاژ با عرضه
        if self.cottage_number and self.marketplace_sale:
            if self.marketplace_sale.cottage_number != self.cottage_number:
                raise ValidationError(
                    f'شماره کوتاژ ({self.cottage_number}) با شماره کوتاژ عرضه ({self.marketplace_sale.cottage_number}) تطابق ندارد'
                )
    
    def get_or_create_customer(self):
        """پیدا کردن یا ایجاد مشتری بر اساس کد ملی"""
        from warehouse.models.parties import Customer
        
        if not self.buyer_national_id:
            return None
            
        # تشخیص نوع کد ملی (10 رقم = حقیقی، 11 رقم = حقوقی)
        clean_national_id = ''.join(filter(str.isdigit, str(self.buyer_national_id)))
        
        if len(clean_national_id) == 10:
            # مشتری حقیقی
            customer, created = Customer.objects.get_or_create(
                personal_code=clean_national_id,
                defaults={
                    'customer_type': 'natural',
                    'full_name': self.buyer_name,
                    'phone': self.buyer_mobile,
                    'address': self.province if self.province else 'نامشخص',
                    'tags': 'بازارگاه',
                    'description': f'ایجاد شده از بازارگاه - خرید {self.purchase_id}'
                }
            )
        elif len(clean_national_id) == 11:
            # مشتری حقوقی
            customer, created = Customer.objects.get_or_create(
                national_id=clean_national_id,
                defaults={
                    'customer_type': 'legal',
                    'company_name': self.buyer_name,
                    'phone': self.buyer_mobile,
                    'address': self.province if self.province else 'نامشخص',
                    'tags': 'بازارگاه',
                    'description': f'ایجاد شده از بازارگاه - خرید {self.purchase_id}'
                }
            )
        else:
            return None
            
        # اگر مشتری جدید است، تگ بازارگاه را اضافه کن
        if created or 'بازارگاه' not in customer.tags:
            if customer.tags:
                customer.tags += ', بازارگاه'
            else:
                customer.tags = 'بازارگاه'
            customer.save()
            
        return customer

    def save(self, *args, **kwargs):
        """ذخیره با پاکسازی خودکار داده‌ها"""
        self.clean()
        
        # ایجاد یا به‌روزرسانی مشتری
        self.get_or_create_customer()
        
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


class DistributionAgency(TimestampMixin, models.Model):
    """اعطای عاملیت توزیع"""
    
    # انتخاب رسید انبار (فقط کوتاژ وارداتی)
    warehouse_receipt = models.ForeignKey(
        'warehouse.WarehouseReceipt',
        on_delete=models.CASCADE,
        verbose_name='رسید انبار',
        limit_choices_to={'receipt_type': 'import_cottage'},
        help_text='فقط رسیدهای کوتاژ وارداتی قابل انتخاب هستند'
    )
    
    # پیش‌فاکتور فروش مرتبط
    sales_proforma = models.ForeignKey(
        'warehouse.SalesProforma',
        on_delete=models.CASCADE,
        verbose_name='پیش‌فاکتور فروش'
    )
    
    # انتخاب مشتری
    customer = models.ForeignKey(
        'warehouse.Customer',
        on_delete=models.CASCADE,
        verbose_name='مشتری (عامل توزیع)'
    )
    
    # مقدار وزنی عاملیت
    agency_weight = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='وزن عاملیت داده شده (کیلوگرم)'
    )
    
    # اطلاعات خودکار از رسید انبار
    warehouse = models.ForeignKey(
        'warehouse.Warehouse',
        on_delete=models.CASCADE,
        verbose_name='انبار',
        editable=False
    )
    
    product_type = models.ForeignKey(
        'warehouse.Product',
        on_delete=models.CASCADE,
        verbose_name='نوع کالا',
        editable=False
    )
    
    cottage_number = models.CharField(
        max_length=50,
        verbose_name='شماره کوتاژ',
        editable=False
    )
    
    # تاریخ اعطای عاملیت
    agency_date = jDateField(
        verbose_name='تاریخ اعطای عاملیت'
    )
    
    # توضیحات
    description = models.TextField(
        blank=True,
        verbose_name='توضیحات'
    )
    
    class Meta:
        verbose_name = 'اعطای عاملیت توزیع'
        verbose_name_plural = 'اعطای عاملیت‌های توزیع'
        db_table = 'distribution_agencies'
        ordering = ['-agency_date', '-created_at']
    
    def __str__(self):
        return f'عاملیت {self.cottage_number} - {self.customer} ({self.agency_weight} کیلو)'
    
    def clean(self):
        """اعتبارسنجی داده‌ها"""
        from django.core.exceptions import ValidationError
        
        # بررسی وزن عاملیت
        if self.agency_weight and self.agency_weight <= 0:
            raise ValidationError('وزن عاملیت باید بیشتر از صفر باشد')
        
        # بررسی اینکه رسید انبار کوتاژ وارداتی باشد
        if self.warehouse_receipt and self.warehouse_receipt.receipt_type != 'import_cottage':
            raise ValidationError('فقط رسیدهای کوتاژ وارداتی قابل انتخاب هستند')
        
        # بررسی اینکه وزن عاملیت از مانده قابل عرضه رسید انبار بیشتر نباشد
        if self.warehouse_receipt and self.agency_weight:
            available_weight = self.warehouse_receipt.get_available_for_offer_weight()
            if self.agency_weight > available_weight:
                raise ValidationError(
                    f'وزن عاملیت ({self.agency_weight}) نمی‌تواند از مانده قابل عرضه ({available_weight}) بیشتر باشد'
                )
    
    def save(self, *args, **kwargs):
        """ذخیره با لود اطلاعات خودکار"""
        self.clean()
        
        # لود اطلاعات از رسید انبار
        if self.warehouse_receipt:
            self.warehouse = self.warehouse_receipt.warehouse
            self.cottage_number = self.warehouse_receipt.cottage_number or self.warehouse_receipt.temp_number
            
            # لود نوع کالا از اولین آیتم رسید انبار
            first_item = self.warehouse_receipt.items.first()
            if first_item:
                self.product_type = first_item.product
        
        super().save(*args, **kwargs)