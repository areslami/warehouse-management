from django.db import models
from core.models.base import STATUS_TYPES,TRANSACTION_TYPES


class B2BOffer(models.Model):
    offer_id = models.CharField(max_length=100, unique=True, null=False)
    warehouse_receipt = models.ForeignKey(
        'warehouse.WarehouseReceipt',
        on_delete=models.SET_NULL,
        limit_choices_to={'receipt_type__in': ['import_cottage', 'distribution_cottage']},
        null=True,
        blank=True
    )
    
    product = models.ForeignKey('core.Product', on_delete=models.CASCADE)
    cottage_number = models.CharField(max_length=50, blank=True)
    
    offer_date = models.DateTimeField()
    offer_exp_date = models.DateTimeField()
    
    offer_weight = models.DecimalField(max_digits=20, decimal_places=4)
    unit_price = models.DecimalField(max_digits=20, decimal_places=4)
    total_price = models.DecimalField(max_digits=20, decimal_places=4)
    
    offer_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES, default='cash')
    status = models.CharField(max_length=10, choices=STATUS_TYPES, default='pending')
    
    description = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        cottage_info = f" - {self.cottage_number}" if self.cottage_number else ""
        return f"{self.offer_id} - {self.product.name} ({self.offer_weight} kg){cottage_info} - {self.status}"
    
    def save(self, *args, **kwargs):
        if self.warehouse_receipt:
            self.cottage_number = getattr(self.warehouse_receipt, 'cottage_serial_number', '') or ''
            
        if self.unit_price and self.offer_weight:
            self.total_price = self.unit_price * self.offer_weight
        
        super().save(*args, **kwargs)


class B2BAddress(models.Model):
    
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
    
    total_weight_purchased = models.DecimalField(max_digits=20, decimal_places=4, default=0)
    purchase_date = models.DateField(null=True)
    unit_price = models.DecimalField(max_digits=20, decimal_places=4, default=0)
    payment_amount = models.DecimalField(max_digits=20, decimal_places=4, default=0)
    payment_method = models.CharField(max_length=50, blank=True)
    
    province = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    tracking_number = models.CharField(max_length=100, blank=True)
    
    credit_description = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        customer_name = self.customer.company_name if self.customer and self.customer.customer_type == 'corporate' else (self.customer.full_name if self.customer else 'No Customer')
        return f"Sale {self.purchase_id} - {customer_name} ({self.total_weight_purchased} kg)"
    
    def save(self, *args, **kwargs):
        # Calculate unit_price if it's 0 and we have payment_amount and weight
        if (not self.unit_price or self.unit_price == 0) and self.payment_amount and self.total_weight_purchased:
            self.unit_price = self.payment_amount / self.total_weight_purchased
        super().save(*args, **kwargs)

class B2BSale(models.Model):
    purchase_id = models.CharField(max_length=100, unique=True)
    offer = models.ForeignKey(B2BOffer, on_delete=models.CASCADE, related_name='b2b_sales', null=True)
    cottage_code = models.CharField(max_length=50, blank=True)
    weight = models.DecimalField(max_digits=20, decimal_places=4, default=0)
    unit_price = models.DecimalField(max_digits=20, decimal_places=4, default=0)
    total_price = models.DecimalField(max_digits=20, decimal_places=4, default=0)
    sale_date = models.DateField(null=True) 
    product = models.ForeignKey('core.Product', on_delete=models.CASCADE)
    customer = models.ForeignKey('core.Customer', on_delete=models.CASCADE)
    purchase_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES, default='cash')
    description = models.TextField(blank=True)
    
    def __str__(self):
        customer_name = self.customer.company_name if self.customer.customer_type == 'corporate' else self.customer.full_name
        return f"Sale {self.purchase_id} - {customer_name} - {self.product.name} ({self.weight} kg)"
    
    def save(self, *args, **kwargs):
        if self.unit_price and self.weight:
            self.total_price = self.unit_price * self.weight
        super().save(*args, **kwargs)
    
class B2BDistribution(models.Model):
    
    purchase_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    b2b_offer = models.ForeignKey(B2BOffer, on_delete=models.CASCADE, related_name='distributions', null=True)
    
    warehouse = models.ForeignKey('warehouse.Warehouse', on_delete=models.CASCADE)
    product = models.ForeignKey('core.Product', on_delete=models.CASCADE)
    customer = models.ForeignKey('core.Customer', on_delete=models.CASCADE)
    
    agency_date = models.DateTimeField()
    agency_weight = models.DecimalField(max_digits=20, decimal_places=4, default=0)
    description = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        customer_name = self.customer.company_name if self.customer.customer_type == 'corporate' else self.customer.full_name
        warehouse_name = self.warehouse.name if self.warehouse else 'No Warehouse'
        return f"Distribution {self.product.name} - {customer_name} - {warehouse_name} ({self.agency_weight} kg)"
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)