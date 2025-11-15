from django.contrib import admin
from django.contrib.admin import AdminSite
from .models import (ProductCategory, Product, Warehouse, Supplier, Customer, Receiver, ShippingCompany,
                     PurchaseProforma, PurchaseProformaItem, SalesProforma, SalesProformaItem,
                     AccountsPayable, AccountsReceivable, WarehouseReceipt, WarehouseReceiptItem,
                     WarehouseDeliveryOrder, WarehouseDeliveryOrderItem, ProductDelivery, ProductDeliveryItem,
                     WarehouseInventory)
from django.utils.html import format_html
from django.shortcuts import redirect

# تغییر تنظیمات پنل مدیریت
admin.site.site_header = 'سیستم مدیریت انبار'
admin.site.site_title = 'مدیریت انبار'
admin.site.index_title = 'پنل مدیریت انبار'

# اضافه کردن CSS فارسی به پنل ادمین
class RTLAdminSite(AdminSite):
    class Media:
        css = {
            'all': ('css/rtl.css',)
        }

# جایگزینی admin site پیش‌فرض
admin.site.__class__ = RTLAdminSite

# تابع کمکی برای فرمت کردن اعداد
def format_number(value):
    """فرمت کردن اعداد با جداکننده هزارگان"""
    if value is None:
        return '-'
    return f'{int(value):,}'

# تنظیمات Admin برای مدل‌های پایه
@admin.register(ProductCategory)
class ProductCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'description']
    search_fields = ['name']
    list_per_page = 20

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'category', 'unit']
    search_fields = ['name', 'code']
    list_filter = ['category']
    list_per_page = 20

@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ['name', 'manager', 'phone']
    search_fields = ['name', 'manager']
    list_per_page = 20

@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ['code', 'get_name', 'supplier_type', 'phone']
    search_fields = ['company_name', 'full_name', 'phone']
    list_filter = ['supplier_type']
    list_per_page = 20
    
    def get_name(self, obj):
        return str(obj)
    get_name.short_description = 'نام'

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['code', 'get_name', 'customer_type', 'phone']
    search_fields = ['company_name', 'full_name', 'phone']
    list_filter = ['customer_type']
    list_per_page = 20
    
    def get_name(self, obj):
        return str(obj)
    get_name.short_description = 'نام'

@admin.register(Receiver)
class ReceiverAdmin(admin.ModelAdmin):
    list_display = ['code', 'unique_id', 'get_name', 'receiver_type', 'phone', 'postal_code']
    search_fields = ['unique_id', 'company_name', 'full_name', 'phone']
    list_filter = ['receiver_type']
    list_per_page = 20
    
    def get_name(self, obj):
        return str(obj)
    get_name.short_description = 'نام'

@admin.register(ShippingCompany)
class ShippingCompanyAdmin(admin.ModelAdmin):
    list_display = ['name', 'contact_person', 'phone']
    search_fields = ['name', 'contact_person', 'phone']
    list_per_page = 20

# Inline Admin برای آیتم‌های پیش فاکتور
class PurchaseProformaItemInline(admin.TabularInline):
    model = PurchaseProformaItem
    extra = 1
    fields = ['row_number', 'product', 'quantity', 'unit_price', 'get_total_price']
    readonly_fields = ['get_total_price']
    
    def get_total_price(self, obj):
        if obj.total_price:
            return format_number(obj.total_price)
        return '-'
    get_total_price.short_description = 'مبلغ کل سطر'

@admin.register(PurchaseProforma)
class PurchaseProformaAdmin(admin.ModelAdmin):
    list_display = ['number', 'date', 'supplier', 'get_total_amount', 'created_at']
    search_fields = ['number', 'supplier__company_name', 'supplier__full_name']
    list_filter = ['date', 'supplier']
    inlines = [PurchaseProformaItemInline]
    readonly_fields = ['get_total_amount_display']
    list_per_page = 20
    
    def get_total_amount(self, obj):
        return format_number(obj.total_amount)
    get_total_amount.short_description = 'جمع کل'
    
    def get_total_amount_display(self, obj):
        return format_html('<strong>{}</strong> ریال', format_number(obj.total_amount))
    get_total_amount_display.short_description = 'جمع کل پیش فاکتور'
    
    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        # ایجاد سند حساب پرداختنی
        AccountsPayable.objects.get_or_create(
            purchase_proforma=obj,
            defaults={
                'supplier': obj.supplier,
                'amount': obj.total_amount,
                'date': obj.date,
                'description': f'بابت پیش فاکتور خرید {obj.number}'
            }
        )

class SalesProformaItemInline(admin.TabularInline):
    model = SalesProformaItem
    extra = 1
    fields = ['row_number', 'product', 'quantity', 'unit_price', 'get_total_price']
    readonly_fields = ['get_total_price']
    
    def get_total_price(self, obj):
        if obj.total_price:
            return format_number(obj.total_price)
        return '-'
    get_total_price.short_description = 'مبلغ کل سطر'

@admin.register(SalesProforma)
class SalesProformaAdmin(admin.ModelAdmin):
    list_display = ['number', 'date', 'customer', 'get_total_amount', 'created_at']
    search_fields = ['number', 'customer__company_name', 'customer__full_name']
    list_filter = ['date', 'customer']
    inlines = [SalesProformaItemInline]
    readonly_fields = ['get_total_amount_display']
    list_per_page = 20
    
    def get_total_amount(self, obj):
        return format_number(obj.total_amount)
    get_total_amount.short_description = 'جمع کل'
    
    def get_total_amount_display(self, obj):
        return format_html('<strong>{}</strong> ریال', format_number(obj.total_amount))
    get_total_amount_display.short_description = 'جمع کل پیش فاکتور'
    
    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        # ایجاد سند حساب دریافتنی
        AccountsReceivable.objects.get_or_create(
            sales_proforma=obj,
            defaults={
                'customer': obj.customer,
                'amount': obj.total_amount,
                'date': obj.date,
                'description': f'بابت پیش فاکتور فروش {obj.number}'
            }
        )

@admin.register(AccountsPayable)
class AccountsPayableAdmin(admin.ModelAdmin):
    list_display = ['supplier', 'purchase_proforma', 'get_amount', 'date']
    search_fields = ['supplier__company_name', 'supplier__full_name', 'purchase_proforma__number']
    list_filter = ['date', 'supplier']
    readonly_fields = ['get_amount_display']
    list_per_page = 20
    
    def get_amount(self, obj):
        return format_number(obj.amount)
    get_amount.short_description = 'مبلغ'
    
    def get_amount_display(self, obj):
        return format_html('<strong>{}</strong> ریال', format_number(obj.amount))
    get_amount_display.short_description = 'مبلغ'

@admin.register(AccountsReceivable)
class AccountsReceivableAdmin(admin.ModelAdmin):
    list_display = ['customer', 'sales_proforma', 'get_amount', 'date']
    search_fields = ['customer__company_name', 'customer__full_name', 'sales_proforma__number']
    list_filter = ['date', 'customer']
    readonly_fields = ['get_amount_display']
    list_per_page = 20
    
    def get_amount(self, obj):
        return format_number(obj.amount)
    get_amount.short_description = 'مبلغ'
    
    def get_amount_display(self, obj):
        return format_html('<strong>{}</strong> ریال', format_number(obj.amount))
    get_amount_display.short_description = 'مبلغ'

# Inline و Admin برای رسید انبار
class WarehouseReceiptItemInline(admin.TabularInline):
    model = WarehouseReceiptItem
    extra = 1
    fields = ['row_number', 'product', 'quantity']

@admin.register(WarehouseReceipt)
class WarehouseReceiptAdmin(admin.ModelAdmin):
    list_display = ['temp_number', 'date', 'purchase_proforma', 'warehouse', 'get_total_weight', 'created_at']
    search_fields = ['temp_number', 'purchase_proforma__number']
    list_filter = ['date', 'warehouse']
    inlines = [WarehouseReceiptItemInline]
    readonly_fields = ['get_total_weight_display']
    list_per_page = 20
    
    def get_total_weight(self, obj):
        return f'{obj.total_weight} {obj.purchase_proforma.items.first().product.unit if obj.purchase_proforma.items.exists() else ""}'
    get_total_weight.short_description = 'جمع وزن'
    
    def get_total_weight_display(self, obj):
        return format_html('<strong>{}</strong>', obj.total_weight)
    get_total_weight_display.short_description = 'جمع وزن رسید'

# Inline و Admin برای حواله خروج
class WarehouseDeliveryOrderItemInline(admin.TabularInline):
    model = WarehouseDeliveryOrderItem
    extra = 1
    fields = ['product', 'quantity', 'vehicle_type', 'receiver']

@admin.register(WarehouseDeliveryOrder)
class WarehouseDeliveryOrderAdmin(admin.ModelAdmin):
    list_display = ['number', 'issue_date', 'validity_date', 'warehouse', 'sales_proforma', 'get_total_weight', 'shipping_company']
    search_fields = ['number', 'sales_proforma__number']
    list_filter = ['issue_date', 'warehouse', 'shipping_company']
    inlines = [WarehouseDeliveryOrderItemInline]
    readonly_fields = ['get_total_weight_display', 'excel_operations']
    list_per_page = 20
    
    def get_total_weight(self, obj):
        return f'{obj.total_weight}'
    get_total_weight.short_description = 'جمع وزن'
    
    def get_total_weight_display(self, obj):
        return format_html('<strong>{}</strong>', obj.total_weight)
    get_total_weight_display.short_description = 'جمع وزن حواله'
    
    def excel_operations(self, obj):
        if obj.pk:
            try:
                from django.urls import reverse
                download_url = reverse('warehouse:download_delivery_order_excel', args=[obj.pk])
                template_url = reverse('warehouse:download_delivery_order_template')
                upload_url = reverse('warehouse:upload_delivery_order_excel', args=[obj.pk])
                
                return format_html(
                    '<div style="display: flex; gap: 8px; margin-bottom: 10px;">'
                    '<a href="{}" class="button" style="background-color:#28a745; color:white; padding:8px 12px; text-decoration:none; border-radius:4px; display:inline-block;">📥 دانلود اکسل</a>'
                    '<a href="{}" class="button" style="background-color:#17a2b8; color:white; padding:8px 12px; text-decoration:none; border-radius:4px; display:inline-block;">📋 دانلود نمونه</a>'
                    '<a href="{}" class="button" style="background-color:#007bff; color:white; padding:8px 12px; text-decoration:none; border-radius:4px; display:inline-block;" target="_blank">📤 آپلود اکسل</a>'
                    '</div>'
                    '<div style="font-size:11px; color:#666; margin-top:8px; padding:8px; background-color:#f8f9fa; border-radius:4px; border-left:3px solid #007bff;">'
                    '<strong>💡 راهنمای استفاده:</strong><br>'
                    '۱. ابتدا "دانلود نمونه" کنید<br>'
                    '۲. فایل اکسل را با داده‌های مناسب پر کنید<br>'
                    '۳. روی "آپلود اکسل" کلیک کنید و فایل را انتخاب کنید'
                    '</div>',
                    download_url, template_url, upload_url
                )
            except Exception as e:
                return f"خطا: {str(e)}"
        return "ابتدا حواله را ذخیره کنید"
    excel_operations.short_description = 'عملیات اکسل'
    
    def get_csrf_token(self):
        from django.middleware.csrf import get_token
        from django.test import RequestFactory
        factory = RequestFactory()
        request = factory.get('/')
        return get_token(request)
    
    def response_change(self, request, obj):
        """پردازش فرم آپلود اکسل"""
        if request.method == 'POST' and request.POST.get('upload_excel') and 'excel_file' in request.FILES:
            return self.handle_excel_upload(request, obj)
        return super().response_change(request, obj)
    
    def handle_excel_upload(self, request, obj):
        """پردازش آپلود فایل اکسل"""
        from django.contrib import messages
        import openpyxl
        
        excel_file = request.FILES['excel_file']
        
        try:
            workbook = openpyxl.load_workbook(excel_file)
            sheet = workbook.active
            
            success_count = 0
            error_rows = []
            
            for row_idx, row in enumerate(sheet.iter_rows(min_row=2, values_only=True), start=2):
                try:
                    if not any(row):
                        continue
                        
                    product_code = str(row[0]).strip() if row[0] else None
                    quantity = float(row[1]) if row[1] else None
                    vehicle_type = str(row[2]).strip().lower() if row[2] else None
                    receiver_unique_id = str(row[3]).strip() if row[3] else None
                    
                    if not all([product_code, quantity, vehicle_type, receiver_unique_id]):
                        error_rows.append(f"ردیف {row_idx}: داده‌های ناقص")
                        continue
                    
                    # بررسی نوع وسیله حمل معتبر
                    valid_vehicles = ['truck', 'pickup', 'van', 'container', 'other']
                    if vehicle_type not in valid_vehicles:
                        error_rows.append(f"ردیف {row_idx}: نوع وسیله نامعتبر ({vehicle_type})")
                        continue
                    
                    # پیدا کردن کالا
                    product = Product.objects.get(code=product_code)
                    receiver = Receiver.objects.get(unique_id=receiver_unique_id)
                    
                    # ایجاد آیتم حواله
                    WarehouseDeliveryOrderItem.objects.create(
                        delivery_order=obj,
                        product=product,
                        quantity=quantity,
                        vehicle_type=vehicle_type,
                        receiver=receiver,
                        receiver_address=receiver.address,
                        receiver_postal_code=receiver.postal_code,
                        receiver_phone=receiver.phone,
                        receiver_unique_id=receiver.unique_id
                    )
                    success_count += 1
                    
                except Product.DoesNotExist:
                    error_rows.append(f"ردیف {row_idx}: کالا با کد '{product_code}' یافت نشد")
                except Receiver.DoesNotExist:
                    error_rows.append(f"ردیف {row_idx}: گیرنده با شناسه '{receiver_unique_id}' یافت نشد")
                except ValueError:
                    error_rows.append(f"ردیف {row_idx}: مقدار نامعتبر")
                except Exception as e:
                    error_rows.append(f"ردیف {row_idx}: {str(e)}")
            
            if success_count > 0:
                messages.success(request, f'✅ {success_count} آیتم با موفقیت اضافه شد')
            
            if error_rows:
                error_message = '❌ خطا در ردیف‌های: ' + ', '.join(error_rows[:3])
                if len(error_rows) > 3:
                    error_message += f' و {len(error_rows) - 3} خطای دیگر'
                messages.error(request, error_message)
                
        except Exception as e:
            messages.error(request, f'❌ خطا در خواندن فایل: {str(e)}')
        
        return redirect(request.get_full_path())

# Admin برای تحویل کالا
class ProductDeliveryItemInline(admin.TabularInline):
    model = ProductDeliveryItem
    extra = 1
    fields = ['row_number', 'bill_of_lading', 'freight_cost', 'product', 'quantity', 'vehicle_type', 'receiver']

@admin.register(ProductDelivery)
class ProductDeliveryAdmin(admin.ModelAdmin):
    list_display = ['exit_number', 'exit_date', 'exit_warehouse', 'delivery_order', 'get_total_weight', 'shipping_company']
    search_fields = ['exit_number', 'delivery_order__number']
    list_filter = ['exit_date', 'exit_warehouse', 'shipping_company']
    inlines = [ProductDeliveryItemInline]
    readonly_fields = ['get_total_weight_display']
    list_per_page = 20
    
    def get_total_weight(self, obj):
        return f'{obj.total_weight}'
    get_total_weight.short_description = 'جمع وزن'
    
    def get_total_weight_display(self, obj):
        return format_html('<strong>{}</strong>', obj.total_weight)
    get_total_weight_display.short_description = 'جمع وزن تحویل'

@admin.register(WarehouseInventory)
class WarehouseInventoryAdmin(admin.ModelAdmin):
    list_display = ['warehouse', 'product', 'get_quantity', 'get_reserved_quantity', 'get_available_quantity', 'updated_at']
    search_fields = ['warehouse__name', 'product__name', 'product__code']
    list_filter = ['warehouse', 'product__category']
    readonly_fields = ['get_quantity_display', 'get_reserved_display', 'get_available_display']
    list_per_page = 20
    
    def get_quantity(self, obj):
        return f'{obj.quantity} {obj.product.unit}'
    get_quantity.short_description = 'موجودی'
    
    def get_reserved_quantity(self, obj):
        return f'{obj.reserved_quantity} {obj.product.unit}'
    get_reserved_quantity.short_description = 'رزرو شده'
    
    def get_available_quantity(self, obj):
        return f'{obj.available_quantity} {obj.product.unit}'
    get_available_quantity.short_description = 'قابل دسترس'
    
    def get_quantity_display(self, obj):
        return format_html('<strong>{}</strong> {}', obj.quantity, obj.product.unit)
    get_quantity_display.short_description = 'موجودی کل'
    
    def get_reserved_display(self, obj):
        return format_html('<strong>{}</strong> {}', obj.reserved_quantity, obj.product.unit)
    get_reserved_display.short_description = 'موجودی رزرو شده'
    
    def get_available_display(self, obj):
        return format_html('<strong>{}</strong> {}', obj.available_quantity, obj.product.unit)
    get_available_display.short_description = 'موجودی قابل دسترس'
    
    def has_add_permission(self, request):
        # موجودی انبار خودکار محاسبه می‌شود
        return False