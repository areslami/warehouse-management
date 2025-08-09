from django.db import models

STATUS_CHOICES = [
    ('draft', 'draft'),
    ('pending', 'pending'),
    ('active', 'active'),
    ('sold', 'sold'),
    ('expired', 'expired'),
    ('cancelled', 'cancelled'),
]

class B2BOffer(models.Model):
    
    OFFER_TYPES = [
        ('cash', 'cash'),
        ('credit', 'credit'),
        ('agreement', 'agreement'),
    ]
    
    
    offer_id = models.CharField(max_length=100, unique=True, null=False)
    warehouse_receipt = models.ForeignKey(
        'warehouse.WarehouseReceipt',
        on_delete=models.CASCADE,
        limit_choices_to={'receipt_type__in': ['import_cottage', 'distribution_agency']}
    )
    
    product = models.ForeignKey('core.Product', on_delete=models.CASCADE, verbose_name='کالا')
    offer_date = models.DateTimeField()
    offer_exp_date = models.DateTimeField()
    
    offer_weight = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='وزن عرضه (کیلوگرم)')
    unit_price = models.DecimalField(max_digits=16, decimal_places=6)
    total_price = models.DecimalField(max_digits=16, decimal_places=6)
    
    offer_type = models.CharField(max_length=10, choices=OFFER_TYPES, default='cash')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft')
    
    description = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.offer_id} - {self.product.name} ({self.status})"    
    
    
    

class B2bDistribution(models.Model):
    warehouse = models.ForeignKey('warehouse.Warehouse',on_delete=models.CASCADE)
    
    warehouse_receipt = models.ForeignKey(
        'warehouse.WarehouseReceipt',
        on_delete=models.CASCADE,
        limit_choices_to={'receipt_type': 'import_cottage'},
    )
    
    product= models.ForeignKey('core.Product',on_delete=models.CASCADE,)
    sales_proforma = models.ForeignKey('finance.SalesProforma',on_delete=models.CASCADE,)
    
    customer = models.ForeignKey('core.Customer',on_delete=models.CASCADE,)
    
    agency_date = models.DateTimeField()
    description = models.TextField(blank=True)
    agency_weight = models.DecimalField(max_digits=16,decimal_places=8,default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Distribution {self.product.name} - {self.customer}"    
    


class B2BSale(models.Model):
    
    product_offer = models.ForeignKey(B2BOffer,on_delete=models.CASCADE)
    
    offer_unit_price = models.DecimalField(max_digits=16,decimal_places=8)
    total_offer_weight = models.DecimalField(max_digits=16,decimal_places=8,)
    
    sold_weight_before_transport = models.DecimalField(max_digits=16,decimal_places=8,default=0)
    remaining_weight_before_transport = models.DecimalField(max_digits=16,decimal_places=8,default=0)
    sold_weight_after_transport = models.DecimalField(max_digits=16,decimal_places=8,default=0)
    remaining_weight_after_transport = models.DecimalField(max_digits=10,decimal_places=2)
    
    offer_status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    
    # ! not in warehouse receipt
    entry_customs = models.CharField(max_length=200,blank=True,)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Sale {self.product_offer.offer_id} ({self.offer_status})"    
   
   
class B2BSaleDetail(models.Model):
    marketplace_sale = models.ForeignKey(B2BSale,related_name="items",on_delete=models.CASCADE)
    #? what
    customer = models.ForeignKey('core.Customer',on_delete=models.PROTECT,null=False)



#* Purchase