from django.db import models

from core.models.base import VEICHLE_TYPES
from .base import Warehouse,ShippingCompany
    
    
    
class WarehouseReceipt(models.Model):
    RECEIPT_TYPES = [
        ('import_cottage', 'import_cottage'),
        ('distribution_cottage', 'distribution_cottage'),
        ('purchase', 'purchase'),
    ]

    receipt_id = models.CharField(max_length=50, unique=True, null=True, blank=True)
    receipt_type = models.CharField(max_length=20,choices=RECEIPT_TYPES,null=False)
    date = models.DateTimeField()
    warehouse=models.ForeignKey(Warehouse,on_delete=models.SET_NULL,null=True)
    description = models.TextField(blank=True)
    total_weight = models.DecimalField(max_digits=20, decimal_places=4, default=0)
    
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
        cottage_info = f" - {self.cottage_serial_number}" if self.cottage_serial_number else ""
        return f"{self.receipt_id or 'Receipt'} - {self.warehouse.name if self.warehouse else 'No Warehouse'}{cottage_info}"


class WarehouseReceiptItem(models.Model):
    receipt = models.ForeignKey(WarehouseReceipt, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey('core.Product', on_delete=models.CASCADE)
    weight = models.DecimalField(max_digits=20, decimal_places=4,default=0)
     
    
class DispatchIssue(models.Model):
    dispatch_id = models.CharField(max_length=50, unique=True,null=False)
    warehouse = models.ForeignKey(Warehouse, on_delete=models.SET_NULL,null=True)
    sales_proforma = models.ForeignKey('finance.SalesProforma', on_delete=models.SET_NULL,null=True)
    
    issue_date = models.DateTimeField()
    validity_date = models.DateTimeField()
    
    description = models.TextField(blank=True)
    shipping_company = models.ForeignKey(ShippingCompany, on_delete=models.SET_NULL,null=True)
    total_weight = models.DecimalField(max_digits=20, decimal_places=4, default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        customer_info = self.sales_proforma.customer if self.sales_proforma else 'No Customer'
        warehouse_info = self.warehouse.name if self.warehouse else 'No Warehouse'
        return f"{self.dispatch_id} - {customer_info} - {warehouse_info} ({self.total_weight} kg)"    

class DispatchIssueItem(models.Model):

    dispatch = models.ForeignKey(DispatchIssue, related_name='items', on_delete=models.SET_NULL,null=True)
    product = models.ForeignKey('core.Product', on_delete=models.SET_NULL,null=True)
    weight = models.DecimalField(max_digits=20, decimal_places=4,default=0)
    vehicle_type = models.CharField(max_length=20, choices=VEICHLE_TYPES)
    receiver = models.ForeignKey('core.Receiver', on_delete=models.SET_NULL,null=True)
    
class DeliveryFulfillment(models.Model):
    
    delivery_id = models.CharField(max_length=50, unique=True, null=False)
    issue_date = models.DateTimeField()
    validity_date = models.DateTimeField()
    warehouse = models.ForeignKey(Warehouse, on_delete=models.SET_NULL,null=True)
    sales_proforma = models.ForeignKey('finance.SalesProforma', on_delete=models.SET_NULL,null=True)
    
    
    description = models.TextField(blank=True,)
    shipping_company = models.ForeignKey(ShippingCompany, on_delete=models.SET_NULL,null=True,)
    total_weight = models.DecimalField(max_digits=20, decimal_places=4, default=0, )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        customer_info = self.sales_proforma.customer if self.sales_proforma else 'No Customer'
        warehouse_info = self.warehouse.name if self.warehouse else 'No Warehouse'
        return f"{self.delivery_id} - {customer_info} - {warehouse_info} ({self.total_weight} kg)"    
    
class DeliveryFulfillmentItem(models.Model):
    delivery = models.ForeignKey(DeliveryFulfillment, related_name='items', on_delete=models.SET_NULL,null=True)
    shipment_id = models.CharField(max_length=50, unique=True, null=False)
    shipment_price = models.DecimalField(max_digits=20, decimal_places=4,default=0)
    product = models.ForeignKey('core.Product', on_delete=models.SET_NULL,null=True)
    weight = models.DecimalField(max_digits=20, decimal_places=4,default=0)
    vehicle_type = models.CharField(max_length=20, choices=VEICHLE_TYPES)
    receiver = models.ForeignKey('core.Receiver', on_delete=models.SET_NULL,null=True)

