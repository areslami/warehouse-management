from django.db import models
from django_jalali.db.models import jDateField, jDateTimeField
from .base import Product, Warehouse
from .parties import Receiver, ShippingCompany
from .proformas import PurchaseProforma, SalesProforma

class WarehouseReceipt(models.Model):
    """رسید انبار"""
    temp_number = models.CharField(max_length=50, unique=True, verbose_name='شماره رسید موقت')
    date = jDateField(verbose_name='تاریخ رسید')
    purchase_proforma = models.ForeignKey(PurchaseProforma, on_delete=models.CASCADE, verbose_name='پیش فاکتور خرید')
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, verbose_name='انبار')
    description = models.TextField(blank=True, verbose_name='توضیحات')
    total_weight = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='جمع وزن')
    
    created_at = jDateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')
    updated_at = jDateTimeField(auto_now=True, verbose_name='تاریخ ویرایش')
    
    class Meta:
        verbose_name = 'رسید انبار'
        verbose_name_plural = 'رسیدهای انبار'
        db_table = 'warehouse_receipts'
        ordering = ['-date', '-temp_number']
    
    def __str__(self):
        return f'رسید انبار {self.temp_number}'
    
    def calculate_total_weight(self):
        """محاسبه جمع وزن"""
        total = sum(item.quantity for item in self.items.all())
        return total
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # به‌روزرسانی جمع وزن
        new_weight = self.calculate_total_weight()
        if self.total_weight != new_weight:
            self.total_weight = new_weight
            super().save(update_fields=['total_weight'])

class WarehouseReceiptItem(models.Model):
    """آیتم رسید انبار"""
    receipt = models.ForeignKey(WarehouseReceipt, related_name='items', on_delete=models.CASCADE, verbose_name='رسید انبار')
    row_number = models.PositiveIntegerField(verbose_name='ردیف')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, verbose_name='کالا')
    quantity = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='مقدار')
    
    class Meta:
        verbose_name = 'آیتم رسید انبار'
        verbose_name_plural = 'آیتم‌های رسید انبار'
        db_table = 'warehouse_receipt_items'
        ordering = ['row_number']
        unique_together = ['receipt', 'row_number']
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # به‌روزرسانی جمع وزن رسید
        self.receipt.save()
        # به‌روزرسانی موجودی انبار
        self.update_warehouse_inventory()
    
    def update_warehouse_inventory(self):
        """به‌روزرسانی موجودی انبار"""
        inventory, created = WarehouseInventory.objects.get_or_create(
            warehouse=self.receipt.warehouse,
            product=self.product,
            defaults={'quantity': 0, 'reserved_quantity': 0}
        )
        # محاسبه مجدد موجودی از روی همه رسیدها و تحویل‌ها
        inventory.calculate_inventory()

class WarehouseDeliveryOrder(models.Model):
    """حواله خروج انبار"""
    number = models.CharField(max_length=50, unique=True, verbose_name='شماره حواله')
    issue_date = jDateField(verbose_name='تاریخ صدور حواله')
    validity_date = jDateField(verbose_name='تاریخ اعتبار حواله')
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, verbose_name='انبار')
    description = models.TextField(blank=True, verbose_name='توضیحات')
    purchase_proforma = models.ForeignKey(PurchaseProforma, blank=True, null=True, on_delete=models.CASCADE, verbose_name='پیش فاکتور خرید')
    sales_proforma = models.ForeignKey(SalesProforma, on_delete=models.CASCADE, verbose_name='پیش فاکتور فروش')
    shipping_company = models.ForeignKey(ShippingCompany, on_delete=models.CASCADE, verbose_name='شرکت حمل')
    total_weight = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='جمع وزن')
    
    created_at = jDateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')
    updated_at = jDateTimeField(auto_now=True, verbose_name='تاریخ ویرایش')
    
    class Meta:
        verbose_name = 'حواله خروج انبار'
        verbose_name_plural = 'حواله‌های خروج انبار'
        db_table = 'warehouse_delivery_orders'
        ordering = ['-issue_date', '-number']
    
    def __str__(self):
        return f'حواله خروج {self.number}'
    
    def calculate_total_weight(self):
        """محاسبه جمع وزن"""
        total = sum(item.quantity for item in self.items.all())
        return total
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # به‌روزرسانی جمع وزن
        new_weight = self.calculate_total_weight()
        if self.total_weight != new_weight:
            self.total_weight = new_weight
            super().save(update_fields=['total_weight'])

class WarehouseDeliveryOrderItem(models.Model):
    """آیتم حواله خروج انبار"""
    VEHICLE_TYPES = [
        ('truck', 'کامیون'),
        ('pickup', 'وانت'),
        ('van', 'ون'),
        ('container', 'کانتینر'),
        ('other', 'سایر'),
    ]
    
    delivery_order = models.ForeignKey(WarehouseDeliveryOrder, related_name='items', on_delete=models.CASCADE, verbose_name='حواله خروج')
    row_number = models.PositiveIntegerField(verbose_name='ردیف')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, verbose_name='کالا')
    quantity = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='مقدار')
    vehicle_type = models.CharField(max_length=20, choices=VEHICLE_TYPES, verbose_name='نوع وسیله حمل')
    receiver = models.ForeignKey(Receiver, on_delete=models.CASCADE, verbose_name='گیرنده')
    
    # اطلاعات گیرنده (قابل ویرایش)
    receiver_address = models.TextField(verbose_name='آدرس گیرنده')
    receiver_postal_code = models.CharField(max_length=10, verbose_name='کد پستی گیرنده')
    receiver_phone = models.CharField(max_length=20, verbose_name='تلفن گیرنده')
    receiver_unique_id = models.CharField(max_length=50, verbose_name='شناسه گیرنده')
    
    class Meta:
        verbose_name = 'آیتم حواله خروج انبار'
        verbose_name_plural = 'آیتم‌های حواله خروج انبار'
        db_table = 'warehouse_delivery_order_items'
        ordering = ['row_number']
        unique_together = ['delivery_order', 'row_number']
    
    def save(self, *args, **kwargs):
        # تنظیم شماره ردیف خودکار
        if not self.row_number:
            last_item = WarehouseDeliveryOrderItem.objects.filter(
                delivery_order=self.delivery_order
            ).order_by('-row_number').first()
            self.row_number = (last_item.row_number + 1) if last_item else 1
        
        # لود کردن اطلاعات گیرنده اگر خالی باشد
        if not self.receiver_address:
            self.receiver_address = self.receiver.address
        if not self.receiver_postal_code:
            self.receiver_postal_code = self.receiver.postal_code
        if not self.receiver_phone:
            self.receiver_phone = self.receiver.phone
        if not self.receiver_unique_id:
            self.receiver_unique_id = self.receiver.unique_id
            
        super().save(*args, **kwargs)
        # به‌روزرسانی جمع وزن حواله
        self.delivery_order.save()
        # به‌روزرسانی موجودی رزرو انبار
        self.update_warehouse_reserved()
    
    def update_warehouse_reserved(self):
        """به‌روزرسانی موجودی رزرو انبار"""
        inventory, created = WarehouseInventory.objects.get_or_create(
            warehouse=self.delivery_order.warehouse,
            product=self.product,
            defaults={'quantity': 0, 'reserved_quantity': 0}
        )
        # محاسبه مجدد موجودی رزرو
        inventory.calculate_inventory()

class ProductDelivery(models.Model):
    """تحویل کالا"""
    exit_number = models.CharField(max_length=50, unique=True, verbose_name='شماره خروج از انبار')
    exit_date = jDateField(verbose_name='تاریخ خروج از انبار')
    exit_warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, verbose_name='انبار خروجی')
    delivery_order = models.ForeignKey(WarehouseDeliveryOrder, on_delete=models.CASCADE, verbose_name='حواله خروج')
    description = models.TextField(blank=True, verbose_name='توضیحات')
    shipping_company = models.ForeignKey(ShippingCompany, on_delete=models.CASCADE, verbose_name='شرکت حمل')
    total_weight = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='جمع وزن')
    
    created_at = jDateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')
    updated_at = jDateTimeField(auto_now=True, verbose_name='تاریخ ویرایش')
    
    class Meta:
        verbose_name = 'تحویل کالا'
        verbose_name_plural = 'تحویل‌های کالا'
        db_table = 'product_deliveries'
        ordering = ['-exit_date', '-exit_number']
    
    def __str__(self):
        return f'تحویل کالا {self.exit_number}'
    
    def calculate_total_weight(self):
        """محاسبه جمع وزن"""
        total = sum(item.quantity for item in self.items.all())
        return total
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # به‌روزرسانی جمع وزن
        new_weight = self.calculate_total_weight()
        if self.total_weight != new_weight:
            self.total_weight = new_weight
            super().save(update_fields=['total_weight'])

class ProductDeliveryItem(models.Model):
    """آیتم تحویل کالا"""
    VEHICLE_TYPES = [
        ('truck', 'کامیون'),
        ('pickup', 'وانت'),
        ('van', 'ون'),
        ('container', 'کانتینر'),
        ('other', 'سایر'),
    ]
    
    delivery = models.ForeignKey(ProductDelivery, related_name='items', on_delete=models.CASCADE, verbose_name='تحویل کالا')
    row_number = models.PositiveIntegerField(verbose_name='ردیف')
    bill_of_lading = models.CharField(max_length=50, verbose_name='شماره بارنامه')
    freight_cost = models.DecimalField(max_digits=12, decimal_places=0, verbose_name='کرایه')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, verbose_name='کالا')
    quantity = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='مقدار')
    vehicle_type = models.CharField(max_length=20, choices=VEHICLE_TYPES, verbose_name='نوع وسیله حمل')
    receiver = models.ForeignKey(Receiver, on_delete=models.CASCADE, verbose_name='گیرنده')
    
    # اطلاعات گیرنده (قابل ویرایش)
    receiver_address = models.TextField(verbose_name='آدرس گیرنده')
    receiver_postal_code = models.CharField(max_length=10, verbose_name='کد پستی گیرنده')
    receiver_phone = models.CharField(max_length=20, verbose_name='تلفن گیرنده')
    receiver_unique_id = models.CharField(max_length=50, verbose_name='شناسه گیرنده')
    
    class Meta:
        verbose_name = 'آیتم تحویل کالا'
        verbose_name_plural = 'آیتم‌های تحویل کالا'
        db_table = 'product_delivery_items'
        ordering = ['row_number']
        unique_together = ['delivery', 'row_number']
    
    def save(self, *args, **kwargs):
        # لود کردن اطلاعات گیرنده اگر خالی باشد
        if not self.receiver_address:
            self.receiver_address = self.receiver.address
        if not self.receiver_postal_code:
            self.receiver_postal_code = self.receiver.postal_code
        if not self.receiver_phone:
            self.receiver_phone = self.receiver.phone
        if not self.receiver_unique_id:
            self.receiver_unique_id = self.receiver.unique_id
            
        super().save(*args, **kwargs)
        # به‌روزرسانی جمع وزن تحویل
        self.delivery.save()
        # کسر از موجودی انبار
        self.update_warehouse_inventory()
    
    def update_warehouse_inventory(self):
        """کسر از موجودی انبار"""
        inventory, created = WarehouseInventory.objects.get_or_create(
            warehouse=self.delivery.exit_warehouse,
            product=self.product,
            defaults={'quantity': 0, 'reserved_quantity': 0}
        )
        # محاسبه مجدد موجودی
        inventory.calculate_inventory()

class WarehouseInventory(models.Model):
    """موجودی انبار"""
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, verbose_name='انبار')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, verbose_name='کالا')
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='موجودی')
    reserved_quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='موجودی رزرو شده')
    available_quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='موجودی قابل دسترس')
    
    updated_at = jDateTimeField(auto_now=True, verbose_name='تاریخ به‌روزرسانی')
    
    class Meta:
        verbose_name = 'موجودی انبار'
        verbose_name_plural = 'موجودی‌های انبار'
        db_table = 'warehouse_inventories'
        unique_together = ['warehouse', 'product']
    
    def __str__(self):
        return f'{self.product} در {self.warehouse} - موجودی: {self.quantity}'
    
    def calculate_inventory(self):
        """محاسبه موجودی از روی حرکات انبار"""
        # محاسبه موجودی از رسیدهای انبار
        receipts = WarehouseReceiptItem.objects.filter(
            receipt__warehouse=self.warehouse,
            product=self.product
        ).aggregate(total=models.Sum('quantity'))['total'] or 0
        
        # محاسبه موجودی رزرو شده از حواله‌های خروج
        reserved = WarehouseDeliveryOrderItem.objects.filter(
            delivery_order__warehouse=self.warehouse,
            product=self.product
        ).aggregate(total=models.Sum('quantity'))['total'] or 0
        
        # محاسبه موجودی خروجی از تحویل‌های کالا
        delivered = ProductDeliveryItem.objects.filter(
            delivery__exit_warehouse=self.warehouse,
            product=self.product
        ).aggregate(total=models.Sum('quantity'))['total'] or 0
        
        # به‌روزرسانی موجودی
        self.quantity = receipts - delivered
        self.reserved_quantity = reserved - delivered
        self.available_quantity = self.quantity - self.reserved_quantity
        
        self.save(update_fields=['quantity', 'reserved_quantity', 'available_quantity'])
    
    def save(self, *args, **kwargs):
        # محاسبه موجودی قابل دسترس
        self.available_quantity = self.quantity - self.reserved_quantity
        super().save(*args, **kwargs)