from django.db import models
from core.models.base import STATUS_TYPES,TRANSACTION_TYPES
from core.utils import get_next_sequential_id

class B2BOffer(models.Model):
    offer_id = models.CharField(max_length=100, unique=True, null=False, blank=True)  # Add blank=True
    warehouse_receipt = models.ForeignKey(
        'warehouse.WarehouseReceipt',
        on_delete=models.SET_NULL,
        limit_choices_to={'receipt_type__in': ['import_cottage', 'distribution_cottage']},
        null=True,
        blank=True
    )
    
    
    offer_date = models.DateTimeField()
    offer_exp_date = models.DateTimeField()
    
    offer_weight = models.DecimalField(max_digits=20, decimal_places=0)
    unit_price = models.DecimalField(max_digits=20, decimal_places=0)
    total_price = models.DecimalField(max_digits=20, decimal_places=0)
    
    offer_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES, default='cash')
    status = models.CharField(max_length=10, choices=STATUS_TYPES, default='pending')
    
    description = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    @classmethod
    def get_next_offer_id(cls):
        return get_next_sequential_id(cls, 'offer_id', 'DIST')
    
    def __str__(self):
        cottage_info = ""
        product_name = 'No Product'
        if self.warehouse_receipt:
            if self.warehouse_receipt.cottage_serial_number:
                cottage_info = f" - {self.warehouse_receipt.cottage_serial_number}"
            first_item = self.warehouse_receipt.items.first()
            if first_item and getattr(first_item, 'product', None):
                product_name = first_item.product.name
        return f"{self.offer_id}{cottage_info} - {product_name} ({self.offer_weight} kg) - {self.status}"
    
    def save(self, *args, **kwargs):
        if not self.offer_id:
            self.offer_id = self.get_next_offer_id()
        
        if self.unit_price and self.offer_weight:
            self.total_price = self.unit_price * self.offer_weight
        
        super().save(*args, **kwargs)


class B2BAddress(models.Model):
    purchase_id = models.CharField(max_length=100, unique=True, default='')
    allocation_id = models.CharField(max_length=100, blank=True, default='')
    cottage_code = models.CharField(max_length=50,null=False, blank=False)
    
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
    
    total_weight_purchased = models.DecimalField(max_digits=20, decimal_places=0, default=0)
    purchase_date = models.DateField(null=True)
    unit_price = models.DecimalField(max_digits=20, decimal_places=0, default=0)
    payment_amount = models.DecimalField(max_digits=20, decimal_places=0, default=0)
    payment_method = models.CharField(max_length=50, blank=True)
    
    province = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    tracking_number = models.CharField(max_length=100, blank=True)
    
    credit_description = models.TextField(blank=True)
    description = models.TextField(blank=True)

    customer_account_number = models.CharField(max_length=50, blank=True, default='')
    address_register_date = models.DateField(null=True, blank=True)
    deposit_id = models.CharField(max_length=50, blank=True, default='')
    single = models.CharField(max_length=10, blank=True, default='')
    double = models.CharField(max_length=10, blank=True, default='')
    trailer = models.CharField(max_length=10, blank=True, default='')
    purchase_weight = models.DecimalField(max_digits=20, decimal_places=0, default=0)
    waybilled_weight = models.DecimalField(max_digits=20, decimal_places=0, default=0)
    non_waybilled_weight = models.DecimalField(max_digits=20, decimal_places=0, default=0)
    agreement_period_1 = models.CharField(max_length=100, blank=True, default='')
    agreement_amount_1 = models.CharField(max_length=100, blank=True, default='')
    agreement_period_2 = models.CharField(max_length=100, blank=True, default='')
    agreement_amount_2 = models.CharField(max_length=100, blank=True, default='')
    agreement_period_3 = models.CharField(max_length=100, blank=True, default='')
    agreement_amount_3 = models.CharField(max_length=100, blank=True, default='')
    
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

 
class B2BDistribution(models.Model):
    transfer_id = models.CharField(max_length=100, unique=True)

    warehouse_receipt = models.ForeignKey('warehouse.WarehouseReceipt', on_delete=models.PROTECT, limit_choices_to={'receipt_type': 'import_cottage'})
    sales_proforma = models.ForeignKey('finance.SalesProforma', on_delete=models.PROTECT, null=True, blank=True)
    customer = models.ForeignKey('core.Customer', on_delete=models.PROTECT)

    agency_date = models.DateTimeField()
    agency_weight = models.DecimalField(max_digits=20, decimal_places=0, default=0)
    unit_price = models.DecimalField(max_digits=20, decimal_places=0, default=0)
    description = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        customer_name = self.customer.company_name if self.customer.customer_type == 'corporate' else self.customer.full_name
        product_name = 'No Product'
        if self.warehouse_receipt:
            first_item = self.warehouse_receipt.items.first()
            if first_item and getattr(first_item, 'product', None):
                product_name = first_item.product.name
        receipt_id = self.warehouse_receipt.receipt_id if self.warehouse_receipt else 'N/A'
        return f"Distribution {receipt_id} - {customer_name} - {product_name} ({self.agency_weight} kg)"

    @classmethod
    def get_next_dist_id(cls):
        return get_next_sequential_id(cls, 'distribution_id', 'DIST')


    def save(self, *args, **kwargs):
        if not self.transfer_id:
            self.transfer_id = self.get_next_offer_id()
        super().save(*args, **kwargs)
        
class B2BSale(models.Model):
    purchase_id = models.CharField(max_length=100, unique=True, blank=True)
    is_distributor = models.BooleanField(default=False)
    b2b_distribution = models.ForeignKey(B2BDistribution, on_delete=models.CASCADE, related_name='b2b_sales', null=True, blank=True)
    offer = models.ForeignKey(B2BOffer, on_delete=models.CASCADE, related_name='b2b_sales', null=True, blank=True)
    sales_proforma = models.ForeignKey('finance.SalesProforma', on_delete=models.SET_NULL, related_name='b2b_sales', null=True, blank=True)
    product = models.ForeignKey('core.Product', on_delete=models.CASCADE)
    weight = models.DecimalField(max_digits=20, decimal_places=0, default=0)
    unit_price = models.DecimalField(max_digits=20, decimal_places=0, default=0)
    total_price = models.DecimalField(max_digits=20, decimal_places=0, default=0)
    sale_date = models.DateField(null=True)
    customer = models.ForeignKey('core.Customer', on_delete=models.CASCADE)
    purchase_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES, default='cash')
    description = models.TextField(blank=True)
    
    def __str__(self):
        customer_name = self.customer.company_name if self.customer.customer_type == 'corporate' else self.customer.full_name
        product_name = self.product.name if self.product else 'No Product'
        return f"Sale {self.purchase_id} - {customer_name} - {product_name} ({self.weight} kg)"
    

    @classmethod
    def get_next_sale_id(cls):
        return get_next_sequential_id(cls, 'sale_id', 'SALE')


    def save(self, *args, **kwargs):
        if self.unit_price and self.weight:
            self.total_price = self.unit_price * self.weight
        
        if not self.purchase_id:
            self.purchase_id = self.get_next_sale_id()

        super().save(*args, **kwargs)
   
