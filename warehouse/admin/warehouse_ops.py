from django.contrib import admin
from django.utils.html import format_html
from django.shortcuts import redirect
from ..models import (WarehouseReceipt, WarehouseReceiptItem, WarehouseDeliveryOrder, 
                      WarehouseDeliveryOrderItem, ProductDelivery, ProductDeliveryItem, 
                      WarehouseInventory, Product)
from .base import format_number

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
                    from ..models import Receiver
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