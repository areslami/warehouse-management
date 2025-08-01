from django.db import models
from django_jalali.db.models import jDateField, jDateTimeField
from .parties import Supplier, Customer
from .proformas import PurchaseProforma, SalesProforma

class AccountsPayable(models.Model):
    """حساب‌های پرداختنی"""
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, verbose_name='تامین کننده')
    purchase_proforma = models.OneToOneField(PurchaseProforma, on_delete=models.CASCADE, verbose_name='پیش فاکتور خرید')
    amount = models.DecimalField(max_digits=15, decimal_places=0, verbose_name='مبلغ')
    date = jDateField(verbose_name='تاریخ')
    description = models.TextField(blank=True, verbose_name='توضیحات')
    
    created_at = jDateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')
    
    class Meta:
        verbose_name = 'حساب پرداختنی'
        verbose_name_plural = 'حساب‌های پرداختنی'
        db_table = 'accounts_payable'
    
    def __str__(self):
        return f'بدهی به {self.supplier} - {self.amount:,} ریال'.replace(',', '٬')

class AccountsReceivable(models.Model):
    """حساب‌های دریافتنی"""
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, verbose_name='مشتری')
    sales_proforma = models.OneToOneField(SalesProforma, on_delete=models.CASCADE, verbose_name='پیش فاکتور فروش')
    amount = models.DecimalField(max_digits=15, decimal_places=0, verbose_name='مبلغ')
    date = jDateField(verbose_name='تاریخ')
    description = models.TextField(blank=True, verbose_name='توضیحات')
    
    created_at = jDateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')
    
    class Meta:
        verbose_name = 'حساب دریافتنی'
        verbose_name_plural = 'حساب‌های دریافتنی'
        db_table = 'accounts_receivable'
    
    def __str__(self):
        return f'طلب از {self.customer} - {self.amount:,} ریال'.replace(',', '٬')