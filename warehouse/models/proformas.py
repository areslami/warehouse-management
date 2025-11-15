from django.db import models
from django_jalali.db.models import jDateField, jDateTimeField
from .base import Product
from .parties import Supplier, Customer

class PurchaseProforma(models.Model):
    """پیش فاکتور خرید"""
    number = models.CharField(max_length=50, unique=True, verbose_name='شماره پیش فاکتور')
    date = jDateField(verbose_name='تاریخ پیش فاکتور')
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, verbose_name='تامین کننده')
    description = models.TextField(blank=True, verbose_name='توضیحات')
    total_amount = models.DecimalField(max_digits=15, decimal_places=0, default=0, verbose_name='جمع کل پیش فاکتور')
    
    created_at = jDateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')
    updated_at = jDateTimeField(auto_now=True, verbose_name='تاریخ ویرایش')
    
    class Meta:
        verbose_name = 'پیش فاکتور خرید'
        verbose_name_plural = 'پیش فاکتورهای خرید'
        db_table = 'purchase_proformas'
        ordering = ['-date', '-number']
    
    def __str__(self):
        return f'پیش فاکتور خرید {self.number}'
    
    def calculate_total(self):
        """محاسبه جمع کل پیش فاکتور"""
        total = sum(item.total_price for item in self.items.all())
        return total
    
    def save(self, *args, **kwargs):
        # محاسبه جمع کل قبل از ذخیره
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        # اگر پیش فاکتور جدید است یا تغییر کرده، جمع کل را محاسبه کن
        new_total = self.calculate_total()
        if self.total_amount != new_total:
            self.total_amount = new_total
            super().save(update_fields=['total_amount'])

class PurchaseProformaItem(models.Model):
    """آیتم پیش فاکتور خرید"""
    proforma = models.ForeignKey(PurchaseProforma, related_name='items', on_delete=models.CASCADE, verbose_name='پیش فاکتور')
    row_number = models.PositiveIntegerField(verbose_name='ردیف')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, verbose_name='کالا')
    quantity = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='مقدار')
    unit_price = models.DecimalField(max_digits=12, decimal_places=0, verbose_name='فی')
    total_price = models.DecimalField(max_digits=15, decimal_places=0, verbose_name='مبلغ کل سطر')
    
    class Meta:
        verbose_name = 'آیتم پیش فاکتور خرید'
        verbose_name_plural = 'آیتم‌های پیش فاکتور خرید'
        db_table = 'purchase_proforma_items'
        ordering = ['row_number']
        unique_together = ['proforma', 'row_number']
    
    def save(self, *args, **kwargs):
        # محاسبه مبلغ کل سطر
        self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)
        
        # به‌روزرسانی جمع کل پیش فاکتور
        self.proforma.save()

class SalesProforma(models.Model):
    """پیش فاکتور فروش"""
    number = models.CharField(max_length=50, unique=True, verbose_name='شماره پیش فاکتور')
    date = jDateField(verbose_name='تاریخ پیش فاکتور')
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, verbose_name='مشتری')
    description = models.TextField(blank=True, verbose_name='توضیحات')
    total_amount = models.DecimalField(max_digits=15, decimal_places=0, default=0, verbose_name='جمع کل پیش فاکتور')
    
    created_at = jDateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')
    updated_at = jDateTimeField(auto_now=True, verbose_name='تاریخ ویرایش')
    
    class Meta:
        verbose_name = 'پیش فاکتور فروش'
        verbose_name_plural = 'پیش فاکتورهای فروش'
        db_table = 'sales_proformas'
        ordering = ['-date', '-number']
    
    def __str__(self):
        return f'پیش فاکتور فروش {self.number}'
    
    def calculate_total(self):
        """محاسبه جمع کل پیش فاکتور"""
        total = sum(item.total_price for item in self.items.all())
        return total
    
    def save(self, *args, **kwargs):
        # محاسبه جمع کل قبل از ذخیره
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        # اگر پیش فاکتور جدید است یا تغییر کرده، جمع کل را محاسبه کن
        new_total = self.calculate_total()
        if self.total_amount != new_total:
            self.total_amount = new_total
            super().save(update_fields=['total_amount'])

class SalesProformaItem(models.Model):
    """آیتم پیش فاکتور فروش"""
    proforma = models.ForeignKey(SalesProforma, related_name='items', on_delete=models.CASCADE, verbose_name='پیش فاکتور')
    row_number = models.PositiveIntegerField(verbose_name='ردیف')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, verbose_name='کالا')
    quantity = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='مقدار')
    unit_price = models.DecimalField(max_digits=12, decimal_places=0, verbose_name='فی')
    total_price = models.DecimalField(max_digits=15, decimal_places=0, verbose_name='مبلغ کل سطر')
    
    class Meta:
        verbose_name = 'آیتم پیش فاکتور فروش'
        verbose_name_plural = 'آیتم‌های پیش فاکتور فروش'
        db_table = 'sales_proforma_items'
        ordering = ['row_number']
        unique_together = ['proforma', 'row_number']
    
    def save(self, *args, **kwargs):
        # محاسبه مبلغ کل سطر
        self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)
        
        # به‌روزرسانی جمع کل پیش فاکتور
        self.proforma.save()