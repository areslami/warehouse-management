from django.shortcuts import render
from django.db.models import Sum, Count
from django.contrib.admin.views.decorators import staff_member_required
from django.utils.decorators import method_decorator
from django.views.generic import TemplateView
from django.http import JsonResponse
from ..models import (
    WarehouseInventory, PurchaseProforma, SalesProforma, 
    WarehouseReceipt, ProductDelivery, Warehouse, Product, 
    ProductCategory, Supplier, Customer
)
import jdatetime

class BaseReportView(TemplateView):
    """کلاس پایه برای گزارش‌ها"""
    
    @method_decorator(staff_member_required)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def format_number(self, value):
        """فرمت کردن اعداد با جداکننده هزارگان"""
        if value is None:
            return 0
        return f'{int(value):,}'

class WarehouseReportView(BaseReportView):
    """گزارش مرور انبار"""
    template_name = 'warehouse/reports/warehouse_report.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        # فیلترهای جستجو
        warehouse_id = self.request.GET.get('warehouse')
        category_id = self.request.GET.get('category')
        product_id = self.request.GET.get('product')
        
        # موجودی‌های انبار
        inventories = WarehouseInventory.objects.select_related('warehouse', 'product', 'product__category')
        
        if warehouse_id:
            inventories = inventories.filter(warehouse_id=warehouse_id)
        if category_id:
            inventories = inventories.filter(product__category_id=category_id)
        if product_id:
            inventories = inventories.filter(product_id=product_id)
        
        # محاسبه آمار کلی
        total_products = inventories.count()
        total_quantity = inventories.aggregate(Sum('quantity'))['quantity__sum'] or 0
        total_reserved = inventories.aggregate(Sum('reserved_quantity'))['reserved_quantity__sum'] or 0
        total_available = inventories.aggregate(Sum('available_quantity'))['available_quantity__sum'] or 0
        
        # گروه‌بندی بر اساس انبار
        warehouse_summary = {}
        for inventory in inventories:
            warehouse_name = inventory.warehouse.name
            if warehouse_name not in warehouse_summary:
                warehouse_summary[warehouse_name] = {
                    'total_quantity': 0,
                    'total_reserved': 0,
                    'total_available': 0,
                    'product_count': 0
                }
            warehouse_summary[warehouse_name]['total_quantity'] += inventory.quantity
            warehouse_summary[warehouse_name]['total_reserved'] += inventory.reserved_quantity
            warehouse_summary[warehouse_name]['total_available'] += inventory.available_quantity
            warehouse_summary[warehouse_name]['product_count'] += 1
        
        context.update({
            'inventories': inventories.order_by('warehouse__name', 'product__name'),
            'warehouses': Warehouse.objects.all(),
            'categories': ProductCategory.objects.all(),
            'products': Product.objects.all(),
            'total_products': total_products,
            'total_quantity': self.format_number(total_quantity),
            'total_reserved': self.format_number(total_reserved),
            'total_available': self.format_number(total_available),
            'warehouse_summary': warehouse_summary,
            'selected_warehouse': warehouse_id,
            'selected_category': category_id,
            'selected_product': product_id,
        })
        
        return context

class PurchaseReportView(BaseReportView):
    """گزارش مرور خرید"""
    template_name = 'warehouse/reports/purchase_report.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        # فیلترهای جستجو
        supplier_id = self.request.GET.get('supplier')
        from_date = self.request.GET.get('from_date')
        to_date = self.request.GET.get('to_date')
        
        # پیش‌فاکتورهای خرید
        purchase_proformas = PurchaseProforma.objects.select_related('supplier')
        
        if supplier_id:
            purchase_proformas = purchase_proformas.filter(supplier_id=supplier_id)
        if from_date:
            # تبدیل تاریخ شمسی به میلادی
            try:
                from_date_jalali = jdatetime.datetime.strptime(from_date, '%Y/%m/%d').date()
                from_date_gregorian = from_date_jalali.togregorian()
                purchase_proformas = purchase_proformas.filter(date__gte=from_date_gregorian)
            except:
                pass
        if to_date:
            try:
                to_date_jalali = jdatetime.datetime.strptime(to_date, '%Y/%m/%d').date()
                to_date_gregorian = to_date_jalali.togregorian()
                purchase_proformas = purchase_proformas.filter(date__lte=to_date_gregorian)
            except:
                pass
        
        # محاسبه آمار کلی
        total_proformas = purchase_proformas.count()
        total_amount = purchase_proformas.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        
        # رسیدهای انبار مرتبط
        receipts = WarehouseReceipt.objects.filter(
            purchase_proforma__in=purchase_proformas
        ).select_related('warehouse', 'purchase_proforma')
        
        total_receipts = receipts.count()
        total_received_weight = receipts.aggregate(Sum('total_weight'))['total_weight__sum'] or 0
        
        # گروه‌بندی بر اساس تامین‌کننده
        supplier_summary = {}
        for proforma in purchase_proformas:
            supplier_name = str(proforma.supplier)
            if supplier_name not in supplier_summary:
                supplier_summary[supplier_name] = {
                    'proforma_count': 0,
                    'total_amount': 0,
                    'receipt_count': 0
                }
            supplier_summary[supplier_name]['proforma_count'] += 1
            supplier_summary[supplier_name]['total_amount'] += proforma.total_amount
            supplier_summary[supplier_name]['receipt_count'] = receipts.filter(
                purchase_proforma__supplier=proforma.supplier
            ).count()
        
        context.update({
            'purchase_proformas': purchase_proformas.order_by('-date'),
            'receipts': receipts.order_by('-date'),
            'suppliers': Supplier.objects.all(),
            'total_proformas': total_proformas,
            'total_amount': self.format_number(total_amount),
            'total_receipts': total_receipts,
            'total_received_weight': self.format_number(total_received_weight),
            'supplier_summary': supplier_summary,
            'selected_supplier': supplier_id,
            'selected_from_date': from_date,
            'selected_to_date': to_date,
        })
        
        return context

class SalesReportView(BaseReportView):
    """گزارش مرور فروش"""
    template_name = 'warehouse/reports/sales_report.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        # فیلترهای جستجو
        customer_id = self.request.GET.get('customer')
        from_date = self.request.GET.get('from_date')
        to_date = self.request.GET.get('to_date')
        
        # پیش‌فاکتورهای فروش
        sales_proformas = SalesProforma.objects.select_related('customer')
        
        if customer_id:
            sales_proformas = sales_proformas.filter(customer_id=customer_id)
        if from_date:
            try:
                from_date_jalali = jdatetime.datetime.strptime(from_date, '%Y/%m/%d').date()
                from_date_gregorian = from_date_jalali.togregorian()
                sales_proformas = sales_proformas.filter(date__gte=from_date_gregorian)
            except:
                pass
        if to_date:
            try:
                to_date_jalali = jdatetime.datetime.strptime(to_date, '%Y/%m/%d').date()
                to_date_gregorian = to_date_jalali.togregorian()
                sales_proformas = sales_proformas.filter(date__lte=to_date_gregorian)
            except:
                pass
        
        # محاسبه آمار کلی
        total_proformas = sales_proformas.count()
        total_amount = sales_proformas.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        
        # تحویل‌های کالا مرتبط
        from ..models import WarehouseDeliveryOrder
        deliveries = ProductDelivery.objects.filter(
            delivery_order__sales_proforma__in=sales_proformas
        ).select_related('exit_warehouse', 'delivery_order')
        
        total_deliveries = deliveries.count()
        total_delivered_weight = deliveries.aggregate(Sum('total_weight'))['total_weight__sum'] or 0
        
        # گروه‌بندی بر اساس مشتری
        customer_summary = {}
        for proforma in sales_proformas:
            customer_name = str(proforma.customer)
            if customer_name not in customer_summary:
                customer_summary[customer_name] = {
                    'proforma_count': 0,
                    'total_amount': 0,
                    'delivery_count': 0
                }
            customer_summary[customer_name]['proforma_count'] += 1
            customer_summary[customer_name]['total_amount'] += proforma.total_amount
            customer_summary[customer_name]['delivery_count'] = deliveries.filter(
                delivery_order__sales_proforma__customer=proforma.customer
            ).count()
        
        context.update({
            'sales_proformas': sales_proformas.order_by('-date'),
            'deliveries': deliveries.order_by('-exit_date'),
            'customers': Customer.objects.all(),
            'total_proformas': total_proformas,
            'total_amount': self.format_number(total_amount),
            'total_deliveries': total_deliveries,
            'total_delivered_weight': self.format_number(total_delivered_weight),
            'customer_summary': customer_summary,
            'selected_customer': customer_id,
            'selected_from_date': from_date,
            'selected_to_date': to_date,
        })
        
        return context

class DashboardView(BaseReportView):
    """داشبورد اصلی"""
    template_name = 'warehouse/dashboard.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        # آمار کلی
        total_warehouses = Warehouse.objects.count()
        total_products = Product.objects.count()
        total_suppliers = Supplier.objects.count()
        total_customers = Customer.objects.count()
        
        # آمار مالی
        total_purchase_amount = PurchaseProforma.objects.aggregate(
            Sum('total_amount'))['total_amount__sum'] or 0
        total_sales_amount = SalesProforma.objects.aggregate(
            Sum('total_amount'))['total_amount__sum'] or 0
        
        # آمار انبار
        total_inventory = WarehouseInventory.objects.aggregate(
            Sum('quantity'))['quantity__sum'] or 0
        total_reserved = WarehouseInventory.objects.aggregate(
            Sum('reserved_quantity'))['reserved_quantity__sum'] or 0
        
        # آخرین فعالیت‌ها
        recent_purchases = PurchaseProforma.objects.order_by('-created_at')[:5]
        recent_sales = SalesProforma.objects.order_by('-created_at')[:5]
        recent_receipts = WarehouseReceipt.objects.order_by('-created_at')[:5]
        recent_deliveries = ProductDelivery.objects.order_by('-created_at')[:5]
        
        context.update({
            'total_warehouses': total_warehouses,
            'total_products': total_products,
            'total_suppliers': total_suppliers,
            'total_customers': total_customers,
            'total_purchase_amount': self.format_number(total_purchase_amount),
            'total_sales_amount': self.format_number(total_sales_amount),
            'total_inventory': self.format_number(total_inventory),
            'total_reserved': self.format_number(total_reserved),
            'recent_purchases': recent_purchases,
            'recent_sales': recent_sales,
            'recent_receipts': recent_receipts,
            'recent_deliveries': recent_deliveries,
        })
        
        return context

# APIهای AJAX برای چارت‌ها
@staff_member_required
def warehouse_chart_data(request):
    """داده‌های چارت موجودی انبار"""
    warehouses = Warehouse.objects.all()
    data = []
    
    for warehouse in warehouses:
        inventory = WarehouseInventory.objects.filter(warehouse=warehouse).aggregate(
            total=Sum('quantity'))['total'] or 0
        data.append({
            'name': warehouse.name,
            'value': float(inventory)
        })
    
    return JsonResponse(data, safe=False)

@staff_member_required
def monthly_sales_chart_data(request):
    """داده‌های چارت فروش ماهانه"""
    import datetime
    from django.db.models import Extract
    
    # آمار 12 ماه گذشته
    monthly_data = SalesProforma.objects.filter(
        date__gte=datetime.date.today() - datetime.timedelta(days=365)
    ).extra(
        select={'month': "EXTRACT(month FROM date)", 'year': "EXTRACT(year FROM date)"}
    ).values('month', 'year').annotate(
        total=Sum('total_amount'), count=Count('id')
    ).order_by('year', 'month')
    
    data = []
    for item in monthly_data:
        data.append({
            'month': f"{item['year']}-{item['month']:02d}",
            'amount': float(item['total']),
            'count': item['count']
        })
    
    return JsonResponse(data, safe=False)