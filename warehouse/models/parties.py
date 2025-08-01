from django.db import models
from django_jalali.db.models import jDateTimeField
from django.core.validators import RegexValidator

class Supplier(models.Model):
    """تامین کننده"""
    SUPPLIER_TYPES = [
        ('legal', 'حقوقی'),
        ('natural', 'حقیقی'),
    ]
    
    code = models.AutoField(primary_key=True, verbose_name='کد تامین کننده')
    supplier_type = models.CharField(max_length=10, choices=SUPPLIER_TYPES, verbose_name='نوع تامین کننده')
    
    # فیلدهای حقوقی
    company_name = models.CharField(max_length=200, blank=True, verbose_name='نام شرکت')
    national_id = models.CharField(max_length=11, blank=True, verbose_name='شناسه ملی', 
                                   validators=[RegexValidator(regex=r'^\d{11}$', message='شناسه ملی باید 11 رقم باشد')])
    
    # فیلدهای حقیقی
    full_name = models.CharField(max_length=100, blank=True, verbose_name='نام و نام خانوادگی')
    personal_code = models.CharField(max_length=10, blank=True, verbose_name='کد ملی',
                                     validators=[RegexValidator(regex=r'^\d{10}$', message='کد ملی باید 10 رقم باشد')])
    
    # فیلدهای مشترک
    economic_code = models.CharField(max_length=20, blank=True, verbose_name='کد اقتصادی')
    phone = models.CharField(max_length=20, verbose_name='شماره تلفن')
    address = models.TextField(verbose_name='آدرس')
    description = models.TextField(blank=True, verbose_name='توضیحات')
    
    created_at = jDateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')
    updated_at = jDateTimeField(auto_now=True, verbose_name='تاریخ ویرایش')
    
    class Meta:
        verbose_name = 'تامین کننده'
        verbose_name_plural = 'تامین کنندگان'
        db_table = 'suppliers'
    
    def __str__(self):
        if self.supplier_type == 'legal':
            return f'{self.company_name} ({self.code})'
        else:
            return f'{self.full_name} ({self.code})'
    
    def clean(self):
        from django.core.exceptions import ValidationError
        if self.supplier_type == 'legal':
            if not self.company_name:
                raise ValidationError('نام شرکت برای نوع حقوقی اجباری است')
            if not self.national_id:
                raise ValidationError('شناسه ملی برای نوع حقوقی اجباری است')
        elif self.supplier_type == 'natural':
            if not self.full_name:
                raise ValidationError('نام و نام خانوادگی برای نوع حقیقی اجباری است')
            if not self.personal_code:
                raise ValidationError('کد ملی برای نوع حقیقی اجباری است')

class Customer(models.Model):
    """مشتری"""
    CUSTOMER_TYPES = [
        ('legal', 'حقوقی'),
        ('natural', 'حقیقی'),
    ]
    
    code = models.AutoField(primary_key=True, verbose_name='کد مشتری')
    customer_type = models.CharField(max_length=10, choices=CUSTOMER_TYPES, verbose_name='نوع مشتری')
    
    # فیلدهای حقوقی
    company_name = models.CharField(max_length=200, blank=True, verbose_name='نام شرکت')
    national_id = models.CharField(max_length=11, blank=True, verbose_name='شناسه ملی',
                                   validators=[RegexValidator(regex=r'^\d{11}$', message='شناسه ملی باید 11 رقم باشد')])
    
    # فیلدهای حقیقی
    full_name = models.CharField(max_length=100, blank=True, verbose_name='نام و نام خانوادگی')
    personal_code = models.CharField(max_length=10, blank=True, verbose_name='کد ملی',
                                     validators=[RegexValidator(regex=r'^\d{10}$', message='کد ملی باید 10 رقم باشد')])
    
    # فیلدهای مشترک
    economic_code = models.CharField(max_length=20, blank=True, verbose_name='کد اقتصادی')
    phone = models.CharField(max_length=20, verbose_name='شماره تلفن', blank=True)
    address = models.TextField(verbose_name='آدرس', blank=True)
    description = models.TextField(blank=True, verbose_name='توضیحات')
    tags = models.CharField(max_length=200, blank=True, verbose_name='برچسب‌ها', 
                           help_text='برچسب‌ها را با کاما جدا کنید')
    
    created_at = jDateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')
    updated_at = jDateTimeField(auto_now=True, verbose_name='تاریخ ویرایش')
    
    class Meta:
        verbose_name = 'مشتری'
        verbose_name_plural = 'مشتریان'
        db_table = 'customers'
    
    def __str__(self):
        if self.customer_type == 'legal':
            return f'{self.company_name} ({self.code})'
        else:
            return f'{self.full_name} ({self.code})'
    
    def clean(self):
        from django.core.exceptions import ValidationError
        if self.customer_type == 'legal':
            if not self.company_name:
                raise ValidationError('نام شرکت برای نوع حقوقی اجباری است')
            if not self.national_id:
                raise ValidationError('شناسه ملی برای نوع حقوقی اجباری است')
        elif self.customer_type == 'natural':
            if not self.full_name:
                raise ValidationError('نام و نام خانوادگی برای نوع حقیقی اجباری است')
            if not self.personal_code:
                raise ValidationError('کد ملی برای نوع حقیقی اجباری است')

class Receiver(models.Model):
    """گیرنده"""
    RECEIVER_TYPES = [
        ('legal', 'حقوقی'),
        ('natural', 'حقیقی'),
    ]
    
    code = models.AutoField(primary_key=True, verbose_name='کد گیرنده')
    system_id = models.CharField(max_length=50, unique=True, verbose_name='شناسه سیستمی', editable=False)
    unique_id = models.CharField(max_length=50, verbose_name='شناسه یکتا', help_text='شناسه از اکسل آدرس‌ها')
    receiver_type = models.CharField(max_length=10, choices=RECEIVER_TYPES, verbose_name='نوع گیرنده')
    
    # فیلدهای حقوقی
    company_name = models.CharField(max_length=200, blank=True, verbose_name='نام شرکت')
    national_id = models.CharField(max_length=11, blank=True, verbose_name='شناسه ملی',
                                   validators=[RegexValidator(regex=r'^\d{11}$', message='شناسه ملی باید 11 رقم باشد')])
    
    # فیلدهای حقیقی
    full_name = models.CharField(max_length=100, blank=True, verbose_name='نام و نام خانوادگی')
    personal_code = models.CharField(max_length=10, blank=True, verbose_name='کد ملی',
                                     validators=[RegexValidator(regex=r'^\d{10}$', message='کد ملی باید 10 رقم باشد')])
    
    # فیلدهای مشترک
    economic_code = models.CharField(max_length=20, blank=True, verbose_name='کد اقتصادی')
    phone = models.CharField(max_length=20, verbose_name='شماره تلفن')
    address = models.TextField(verbose_name='آدرس')
    postal_code = models.CharField(max_length=10, verbose_name='کد پستی',
                                   validators=[RegexValidator(regex=r'^\d{10}$', message='کد پستی باید 10 رقم باشد')])
    description = models.TextField(blank=True, verbose_name='توضیحات')
    
    created_at = jDateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')
    updated_at = jDateTimeField(auto_now=True, verbose_name='تاریخ ویرایش')
    
    class Meta:
        verbose_name = 'گیرنده'
        verbose_name_plural = 'گیرندگان'
        db_table = 'receivers'
    
    def __str__(self):
        if self.receiver_type == 'legal':
            return f'{self.company_name} ({self.unique_id})'
        else:
            return f'{self.full_name} ({self.unique_id})'
    
    def save(self, *args, **kwargs):
        """تولید خودکار شناسه سیستمی"""
        if not self.system_id:
            import uuid
            from datetime import datetime
            import jdatetime
            
            # تولید شناسه یکتا با ترکیب تاریخ شمسی و UUID
            jalali_date = jdatetime.datetime.now().strftime('%Y%m%d')
            unique_part = str(uuid.uuid4())[:8].upper()
            self.system_id = f"REC-{jalali_date}-{unique_part}"
        
        super().save(*args, **kwargs)
    
    def clean(self):
        from django.core.exceptions import ValidationError
        if self.receiver_type == 'legal':
            if not self.company_name:
                raise ValidationError('نام شرکت برای نوع حقوقی اجباری است')
            if not self.national_id:
                raise ValidationError('شناسه ملی برای نوع حقوقی اجباری است')
        elif self.receiver_type == 'natural':
            if not self.full_name:
                raise ValidationError('نام و نام خانوادگی برای نوع حقیقی اجباری است')
            if not self.personal_code:
                raise ValidationError('کد ملی برای نوع حقیقی اجباری است')

class ShippingCompany(models.Model):
    """شرکت حمل"""
    name = models.CharField(max_length=200, verbose_name='نام شرکت')
    contact_person = models.CharField(max_length=100, verbose_name='نام تماس')
    phone = models.CharField(max_length=20, verbose_name='تلفن')
    email = models.EmailField(blank=True, verbose_name='ایمیل')
    address = models.TextField(verbose_name='آدرس')
    description = models.TextField(blank=True, verbose_name='توضیحات')
    
    created_at = jDateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')
    updated_at = jDateTimeField(auto_now=True, verbose_name='تاریخ ویرایش')
    
    class Meta:
        verbose_name = 'شرکت حمل'
        verbose_name_plural = 'شرکت‌های حمل'
        db_table = 'shipping_companies'
    
    def __str__(self):
        return self.name
        