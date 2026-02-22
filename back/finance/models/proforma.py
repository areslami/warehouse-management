from decimal import Decimal
from django.db import models

       
class Proforma(models.Model):
    serial_number=models.CharField(max_length=20,null=False, unique=True)
    date = models.DateTimeField()
    
    subtotal = models.DecimalField(max_digits=30, decimal_places=0, default=0)
    tax = models.DecimalField(max_digits=6, decimal_places=4, default=Decimal("0.0000"))
    discount =models.DecimalField(max_digits=6, decimal_places=4, default=Decimal("0.0000"))
    shipping_cost =models.DecimalField(max_digits=6, decimal_places=4, default=Decimal("0.0000"))
    commission =models.DecimalField(max_digits=6, decimal_places=4, default=Decimal("0.0000"))
    other_cost =models.DecimalField(max_digits=6, decimal_places=4, default=Decimal("0.0000"))
    final_price = models.DecimalField(max_digits=20, decimal_places=0, default=0)
    
    export_preset = models.ForeignKey(
        'finance.ProformaExportPreset',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='proformas',
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.serial_number



class ProformaExportPreset(models.Model):
    name = models.CharField(max_length=100, unique=True)
    bank_name = models.CharField(max_length=100)
    account_number = models.CharField(max_length=64)
    sheba_number = models.CharField(max_length=34)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class ProformaLine(models.Model):
    proforma=models.ForeignKey(Proforma,related_name='lines', on_delete=models.CASCADE)
    
    product = models.ForeignKey('core.Product', on_delete=models.PROTECT)
    weight = models.DecimalField(max_digits=20, decimal_places=0,default=0)
    unit_price = models.DecimalField(max_digits=20, decimal_places=0,default=0)
    tax = models.DecimalField(max_digits=6, decimal_places=4, default=Decimal("0.0000"))
    discount =models.DecimalField(max_digits=6, decimal_places=4, default=Decimal("0.0000"))
    @property
    def total_price(self):
        return (self.weight * self.unit_price) * (1 + self.tax-self.discount)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True) 

class PurchaseProforma(Proforma):
    supplier = models.ForeignKey('core.Supplier', on_delete=models.PROTECT)
    
    def __str__(self):
        supplier_name = self.supplier.company_name if self.supplier.supplier_type == 'corporate' else self.supplier.full_name
        return f"Purchase {self.serial_number} - {supplier_name} (${self.final_price})"

class SalesProforma(Proforma):
    PAYMENT_TYPES=[
        ('cash','cash'),
        ('credit','credit'),
        ('other','other'),
    ]
    customer = models.ForeignKey('core.Customer', on_delete=models.PROTECT)
    payment_type = models.CharField(max_length=6,choices=PAYMENT_TYPES,null=False)
    payment_description =  models.CharField(max_length=200,null=True)

    
    
    def __str__(self):
        customer_name = self.customer.company_name if self.customer.customer_type == 'corporate' else self.customer.full_name
        return f"Sales {self.serial_number} - {customer_name} (${self.final_price})"
    