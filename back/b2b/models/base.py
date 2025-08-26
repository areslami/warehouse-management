from django.db import models

STATUS_CHOICES = [
    ('pending', 'Pending'),
    ('active', 'Active'),
    ('sold', 'Sold'),
    ('expired', 'Expired'),
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
        limit_choices_to={'receipt_type__in': ['import_cottage', 'distribution_agency']},
        null=True,
        blank=True
    )
    
    product = models.ForeignKey('core.Product', on_delete=models.CASCADE)
    cottage_number = models.CharField(max_length=50, blank=True, editable=False)
    
    offer_date = models.DateTimeField()
    offer_exp_date = models.DateTimeField()
    
    offer_weight = models.DecimalField(max_digits=10, decimal_places=2)
    unit_price = models.DecimalField(max_digits=16, decimal_places=6)
    total_price = models.DecimalField(max_digits=16, decimal_places=6, editable=False)
    
    offer_type = models.CharField(max_length=10, choices=OFFER_TYPES, default='cash')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    
    description = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.offer_id} - {self.product.name} ({self.status})"
    
    def save(self, *args, **kwargs):
        if self.warehouse_receipt:
            self.cottage_number = getattr(self.warehouse_receipt, 'cottage_serial_number', '') or ''
            
        if self.unit_price and self.offer_weight:
            self.total_price = self.unit_price * self.offer_weight
        
        super().save(*args, **kwargs)


class B2BSale(models.Model):
    
    purchase_id = models.CharField(max_length=100, unique=True, default='')
    allocation_id = models.CharField(max_length=100, blank=True, default='')
    cottage_code = models.CharField(max_length=50, blank=True)
    
    product_offer = models.ForeignKey(
        B2BOffer,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sales'
    )
    product = models.ForeignKey('core.Product', on_delete=models.CASCADE, null=True)
    customer = models.ForeignKey('core.Customer', on_delete=models.CASCADE, null=True)
    receiver = models.ForeignKey('core.Receiver', on_delete=models.SET_NULL, null=True, blank=True)
    
    total_weight_purchased = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    purchase_date = models.DateField(null=True)
    unit_price = models.DecimalField(max_digits=16, decimal_places=6, default=0)
    payment_amount = models.DecimalField(max_digits=15, decimal_places=0, default=0)
    payment_method = models.CharField(max_length=50, blank=True)
    
    province = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    tracking_number = models.CharField(max_length=100, blank=True)
    
    credit_description = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Sale {self.purchase_id} - {self.customer}"


class B2BPurchase(models.Model):
    
    PURCHASE_TYPES = [
        ('cash', 'cash'),
        ('agreement', 'agreement'),
        ('mixed', 'mixed'),
    ]
    
    b2b_sale = models.ForeignKey(B2BSale, related_name='purchases', on_delete=models.CASCADE)
    
    purchase_id = models.CharField(max_length=100, unique=True)
    cottage_number = models.CharField(max_length=50, default='', blank=True)
    description = models.TextField(blank=True)
    purchase_weight = models.DecimalField(max_digits=10, decimal_places=2)
    province = models.CharField(max_length=100, default='')
    purchase_date = models.DateField()
    paid_amount = models.DecimalField(max_digits=15, decimal_places=0)
    unit_price = models.DecimalField(max_digits=15, decimal_places=0, default=0)
    delivery_date = models.DateField(null=True, blank=True)
    tracking_number = models.CharField(max_length=100, blank=True)
    document_registration_date = models.DateField(null=True, blank=True)
    product_title = models.CharField(max_length=300, default='')
    
    buyer_national_id = models.CharField(max_length=20)
    buyer_account_number = models.CharField(max_length=50, blank=True)
    buyer_mobile = models.CharField(max_length=20)
    buyer_name = models.CharField(max_length=200)
    purchase_type = models.CharField(max_length=20, choices=PURCHASE_TYPES)
    
    agreement_period_1 = models.PositiveIntegerField(null=True, blank=True)
    agreement_period_2 = models.PositiveIntegerField(null=True, blank=True)
    agreement_period_3 = models.PositiveIntegerField(null=True, blank=True)
    agreement_amount_1 = models.DecimalField(max_digits=15, decimal_places=0, null=True, blank=True)
    agreement_amount_2 = models.DecimalField(max_digits=15, decimal_places=0, null=True, blank=True)
    agreement_amount_3 = models.DecimalField(max_digits=15, decimal_places=0, null=True, blank=True)
    
    supply_id = models.CharField(max_length=100, default='')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.purchase_id} - {self.buyer_name}"
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        
        if self.b2b_sale:
            self.b2b_sale.calculate_weights()


class B2BPurchaseDetail(models.Model):
    
    purchase = models.OneToOneField(B2BPurchase, on_delete=models.CASCADE, related_name='detail')
    agreement_description = models.TextField(blank=True)
    
    def __str__(self):
        return f"Detail {self.purchase.purchase_id}"


class B2BDistribution(models.Model):
    
    purchase_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    b2b_offer = models.ForeignKey(B2BOffer, on_delete=models.CASCADE, related_name='distributions', null=True)
    
    warehouse = models.ForeignKey('warehouse.Warehouse', on_delete=models.CASCADE)
    product = models.ForeignKey('core.Product', on_delete=models.CASCADE)
    customer = models.ForeignKey('core.Customer', on_delete=models.CASCADE)
    
    agency_date = models.DateTimeField()
    agency_weight = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    description = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    @property
    def warehouse_receipt(self):
        if self.b2b_offer:
            return self.b2b_offer.warehouse_receipt
        return None
    
    @property
    def cottage_number(self):
        if self.b2b_offer:
            return self.b2b_offer.cottage_number
        return ''
    
    def __str__(self):
        return f"Distribution {self.product.name} - {self.customer} ({self.agency_weight} kg)"
    
    def save(self, *args, **kwargs):
        if self.warehouse_receipt:
            self.warehouse = self.warehouse_receipt.warehouse
            self.cottage_number = self.warehouse_receipt.cottage_serial_number or ''
            
            # Only auto-set product if not already provided
            if not self.product_id:
                first_item = self.warehouse_receipt.items.first()
                if first_item:
                    self.product = first_item.product
        
        super().save(*args, **kwargs)