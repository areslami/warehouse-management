from django.db import models

       
class Proforma(models.Model):
    serial_number=models.CharField(max_length=20,null=False, unique=True)
    date = models.DateTimeField()
    
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    final_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    def __str__(self):
        return self.serial_number

    

class PurchaseProforma(Proforma):
    supplier = models.ForeignKey('core.Supplier', on_delete=models.PROTECT)
    
    def __str__(self):
        return f"Purchase {self.serial_number} - {self.supplier}"
    
class SalesProforma(Proforma):
    PAYMENT_TYPES=[
        ('cash','cash'),
        ('credit','credit'),
        ('other','other'),
    ]
    customer = models.ForeignKey('core.BaseParty', on_delete=models.PROTECT)
    payment_type = models.CharField(max_length=6,choices=PAYMENT_TYPES,null=False)
    payment_description =  models.CharField(max_length=200,null=True)
    
    def __str__(self):
        return f"Sales {self.serial_number} - {self.customer}"
    




class ProformaLine(models.Model):
    proforma=models.ForeignKey(Proforma,related_name='lines', on_delete=models.CASCADE)
    
    product = models.ForeignKey('core.Product', on_delete=models.PROTECT)
    weight = models.DecimalField(max_digits=16, decimal_places=8)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    @property
    def total_price(self):
        return self.weight * self.unit_price
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)