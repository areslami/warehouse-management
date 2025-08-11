from django.db import models
from .base import Warehouse,ShippingCompany

VEHICLE_TYPES = [
    ('truck', 'truck'),
    ('pickup', 'pickup'),
    ('van', 'van'),
    ('container', 'container'),
    ('other', 'other'),
]
    
    
    
class WarehouseReceipt(models.Model):
    RECEIPT_TYPES = [
        ('import_cottage', 'import_cottage'),
        ('distribution_cottage', 'distribution_cottage'),
        ('purchase', 'purchase'),
    ]

    receipt_id = models.CharField(max_length=50, unique=True, null=True, blank=True)
    receipt_type = models.CharField(max_length=20,choices=RECEIPT_TYPES,null=False)
    date = models.DateTimeField()
    warehouse=models.ForeignKey(Warehouse,on_delete=models.PROTECT)
    description = models.TextField(blank=True)
    total_weight = models.DecimalField(max_digits=16, decimal_places=8, default=0)
    
    cottage_serial_number = models.CharField(max_length=100, null=True, blank=True, unique=True)

    proforma = models.ForeignKey(
        'finance.PurchaseProforma',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.receipt_id or 'Receipt'} - {self.warehouse.name}"


class WarehouseReceiptItem(models.Model):
    receipt = models.ForeignKey(WarehouseReceipt, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey('core.Product', on_delete=models.CASCADE)
    weight = models.DecimalField(max_digits=16, decimal_places=8)
     
    
class DispatchIssue(models.Model):
    dispatch_id = models.CharField(max_length=50, unique=True,null=False)
    warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT)
    sales_proforma = models.ForeignKey('finance.SalesProforma', null=False, on_delete=models.PROTECT)
    
    issue_date = models.DateTimeField()
    validity_date = models.DateTimeField()
    
    description = models.TextField(blank=True)
    shipping_company = models.ForeignKey(ShippingCompany, on_delete=models.PROTECT)
    total_weight = models.DecimalField(max_digits=16, decimal_places=8, default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.dispatch_id} - {self.warehouse.name}"    


class DispatchIssueItem(models.Model):

    dispatch = models.ForeignKey(DispatchIssue, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey('core.Product', on_delete=models.CASCADE)
    weight = models.DecimalField(max_digits=10, decimal_places=2)
    vehicle_type = models.CharField(max_length=20, choices=VEHICLE_TYPES)
    receiver = models.ForeignKey('core.Receiver', on_delete=models.PROTECT)
    
class DeliveryFulfillment(models.Model):
    
    delivery_id = models.CharField(max_length=50, unique=True, null=False)
    issue_date = models.DateTimeField()
    validity_date = models.DateTimeField()
    warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT)
    sales_proforma = models.ForeignKey('finance.SalesProforma', on_delete=models.PROTECT)
    
    
    description = models.TextField(blank=True,)
    shipping_company = models.ForeignKey(ShippingCompany, on_delete=models.CASCADE, verbose_name='شرکت حمل')
    total_weight = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='جمع وزن')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.delivery_id} - {self.warehouse.name}"    
    
class DeliveryFulfillmentItem(models.Model):
    delivery = models.ForeignKey(DeliveryFulfillment, related_name='items', on_delete=models.CASCADE)
    shipment_id = models.CharField(max_length=50, unique=True, null=False)
    shipment_price = models.DecimalField(max_digits=16, decimal_places=8)
    product = models.ForeignKey('core.Product', on_delete=models.PROTECT)
    weight = models.DecimalField(max_digits=16, decimal_places=8)
    vehicle_type = models.CharField(max_length=20, choices=VEHICLE_TYPES)
    receiver = models.ForeignKey('core.Receiver', on_delete=models.PROTECT)

