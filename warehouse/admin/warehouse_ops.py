from django.contrib import admin
from django.utils.html import format_html
from django.shortcuts import redirect
from django.db import models
from ..models import (WarehouseReceipt, WarehouseReceiptItem, WarehouseDeliveryOrder, 
                      WarehouseDeliveryOrderItem, ProductDelivery, ProductDeliveryItem, 
                      WarehouseInventory, Product)
from .base import format_number

# فیلتر سفارشی برای عرضه‌های بازارگاه
class MarketplaceOfferFilter(admin.SimpleListFilter):
    title = 'وضعیت عرضه در بازارگاه'
    parameter_name = 'marketplace_offer_status'

    def lookups(self, request, model_admin):
        return (
            ('offered', 'عرضه شده'),
            ('not_offered', 'عرضه نشده'),
            ('has_active', 'دارای عرضه فعال'),
            ('has_sold', 'دارای عرضه فروخته شده'),
        )

    def queryset(self, request, queryset):
        try:
            from marketplace.models import ProductOffer
            
            if self.value() == 'offered':
                return queryset.filter(
                    id__in=ProductOffer.objects.values_list('warehouse_receipt_id', flat=True)
                )
            elif self.value() == 'not_offered':
                return queryset.exclude(
                    id__in=ProductOffer.objects.values_list('warehouse_receipt_id', flat=True)
                )
            elif self.value() == 'has_active':
                return queryset.filter(
                    id__in=ProductOffer.objects.filter(status='active').values_list('warehouse_receipt_id', flat=True)
                )
            elif self.value() == 'has_sold':
                return queryset.filter(
                    id__in=ProductOffer.objects.filter(status='sold').values_list('warehouse_receipt_id', flat=True)
                )
        except ImportError:
            pass
        
        return queryset

# Inline و Admin برای رسید انبار
class WarehouseReceiptItemInline(admin.TabularInline):
    model = WarehouseReceiptItem
    extra = 1
    fields = ['row_number', 'product', 'quantity']

@admin.register(WarehouseReceipt)
class WarehouseReceiptAdmin(admin.ModelAdmin):
    list_display = ['temp_number', 'receipt_type', 'cottage_number', 'date', 'purchase_proforma', 'warehouse', 'get_total_weight', 'get_offered_weight', 'created_at']
    search_fields = ['temp_number', 'cottage_number', 'purchase_proforma__number']
    list_filter = ['date', 'warehouse', 'receipt_type', MarketplaceOfferFilter]
    inlines = [WarehouseReceiptItemInline]
    readonly_fields = ['get_total_weight_display', 'get_offered_weight_display', 'temp_number']  # شماره رسید خودکار میشه
    list_per_page = 20
    
    fieldsets = (
        ('اطلاعات اصلی', {
            'fields': ('temp_number', 'receipt_type', 'cottage_number', 'date', 'purchase_proforma', 'warehouse')
        }),
        ('جزئیات', {
            'fields': ('description', 'get_total_weight_display', 'get_offered_weight_display'),
            'classes': ('collapse',)
        }),
    )
    
    def get_total_weight(self, obj):
        unit = obj.purchase_proforma.items.first().product.unit if obj.purchase_proforma.items.exists() else ""
        return f'{obj.total_weight} {unit}'
    get_total_weight.short_description = 'جمع وزن'
    
    def get_total_weight_display(self, obj):
        return format_html('<strong>{}</strong>', obj.total_weight)
    get_total_weight_display.short_description = 'جمع وزن رسید'
    
    def get_offered_weight(self, obj):
        """محاسبه وزن عرضه شده در بازارگاه"""
        try:
            # import کردن مدل ProductOffer از marketplace
            from marketplace.models import ProductOffer
            
            # محاسبه مجموع وزن عرضه شده برای این رسید
            total_offered = ProductOffer.objects.filter(
                warehouse_receipt=obj
            ).aggregate(
                total=models.Sum('offer_weight')
            )['total'] or 0
            
            if total_offered > 0:
                return format_html(
                    '<span style="color: #28a745; font-weight: bold;">{}</span> تن',
                    total_offered
                )
            else:
                return format_html(
                    '<span style="color: #dc3545;">عرضه نشده</span>'
                )
        except ImportError:
            # اگر marketplace app وجود نداشته باشد
            return format_html('<span style="color: #6c757d;">-</span>')
        except Exception as e:
            return format_html('<span style="color: #dc3545;">خطا</span>')
    
    get_offered_weight.short_description = 'وزن عرضه شده'
    get_offered_weight.admin_order_field = None  # غیرقابل مرتب‌سازی
    
    def get_offered_weight_display(self, obj):
        """نمایش تفصیلی وزن عرضه شده برای صفحه جزئیات"""
        try:
            from marketplace.models import ProductOffer
            
            offers = ProductOffer.objects.filter(warehouse_receipt=obj)
            if not offers.exists():
                return format_html(
                    '<div style="color: #dc3545; padding: 10px; background: #f8d7da; border-radius: 4px;">'
                    '<i class="fas fa-info-circle"></i> هیچ عرضه‌ای در بازارگاه ثبت نشده است'
                    '</div>'
                )
            
            total_offered = offers.aggregate(total=models.Sum('offer_weight'))['total'] or 0
            active_offers = offers.filter(status='active').count()
            sold_offers = offers.filter(status='sold').count()
            
            return format_html(
                '<div style="background: #d4edda; padding: 10px; border-radius: 4px; border-left: 4px solid #28a745;">'
                '<strong>مجموع وزن عرضه شده:</strong> {} تن<br>'
                '<small style="color: #495057;">'
                '• عرضه‌های فعال: {} مورد<br>'
                '• عرضه‌های فروخته شده: {} مورد<br>'
                '• کل عرضه‌ها: {} مورد'
                '</small>'
                '</div>',
                total_offered, active_offers, sold_offers, offers.count()
            )
        except ImportError:
            return format_html(
                '<div style="color: #856404; padding: 10px; background: #fff3cd; border-radius: 4px;">'
                'ماژول بازارگاه در دسترس نیست'
                '</div>'
            )
        except Exception as e:
            return format_html(
                '<div style="color: #721c24; padding: 10px; background: #f8d7da; border-radius: 4px;">'
                'خطا در محاسبه: {}'
                '</div>',
                str(e)
            )
    
    get_offered_weight_display.short_description = 'جزئیات عرضه در بازارگاه'
    
    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        
        # اگر فرم جدید است، راهنما برای فیلد شماره کوتاژ
        if not obj:
            form.base_fields['cottage_number'].help_text = '''
            <div class="cottage-field-help">
                <p><strong>شماره کوتاژ:</strong></p>
                <ul>
                    <li>برای <strong>کوتاژ‌وارداتی</strong>: شماره کوتاژ وارداتی را وارد کنید</li>
                    <li>برای <strong>عاملیت توزیع</strong>: شماره کوتاژ عاملیت را وارد کنید</li>
                    <li>برای <strong>خرید داخلی</strong>: این فیلد نمایش داده نمی‌شود</li>
                </ul>
            </div>
            <script>
            document.addEventListener('DOMContentLoaded', function() {
                function toggleCottageField() {
                    var receiptType = document.querySelector('select[name="receipt_type"]');
                    var cottageField = document.querySelector('input[name="cottage_number"]').closest('.form-row');
                    
                    if (receiptType && cottageField) {
                        if (receiptType.value === 'import_cottage' || receiptType.value === 'distribution_agency') {
                            cottageField.style.display = 'block';
                        } else {
                            cottageField.style.display = 'none';
                            document.querySelector('input[name="cottage_number"]').value = '';
                        }
                    }
                }
                
                var receiptTypeField = document.querySelector('select[name="receipt_type"]');
                if (receiptTypeField) {
                    receiptTypeField.addEventListener('change', toggleCottageField);
                    toggleCottageField(); // اجرای اولیه
                }
            });
            </script>
            '''
        
        return form
    
    class Media:
        css = {
            'all': ('admin/css/warehouse_receipt.css',)
        }
        js = ('admin/js/warehouse_receipt.js',)

# Inline و Admin برای حواله خروج - بدون تغییر
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