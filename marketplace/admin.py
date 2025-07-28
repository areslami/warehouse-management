# marketplace/admin.py
from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Q
from django.contrib import messages
from django import forms
from .models import MarketplaceProductCategory, MarketplaceProduct, ProductMapping, ProductOffer


def format_number(value):
    """فرمت کردن اعداد با جداکننده هزارگان"""
    if value is None:
        return '-'
    return f'{int(value):,}'


class ThousandSeparatorWidget(forms.TextInput):
    """ویجت برای نمایش اعداد با جداکننده هزارگان"""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.attrs.update({
            'style': 'text-align: left; direction: ltr;',
            'class': 'thousand-separator-input'
        })
    
    def format_value(self, value):
        if value is None or value == '':
            return ''
        try:
            # تبدیل به عدد و نمایش با جداکننده
            return f'{float(value):,.2f}'.rstrip('0').rstrip('.')
        except (ValueError, TypeError):
            return str(value)


class ProductOfferForm(forms.ModelForm):
    class Meta:
        model = ProductOffer
        fields = '__all__'
        widgets = {
            'offer_weight': ThousandSeparatorWidget(),
            'unit_price': ThousandSeparatorWidget(),
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # تغییر queryset برای رسید انبار - فقط کوتاژها
        if 'warehouse_receipt' in self.fields:
            from warehouse.models import WarehouseReceipt
            queryset = WarehouseReceipt.objects.filter(
                receipt_type__in=['import_cottage', 'distribution_agency'],
                cottage_number__isnull=False
            ).exclude(cottage_number='').select_related('purchase_proforma__supplier')
            
            self.fields['warehouse_receipt'].queryset = queryset
            self.fields['warehouse_receipt'].empty_label = "انتخاب کوتاژ..."
    
    class Media:
        js = ('admin/js/thousand_separator.js',)
        css = {
            'all': ('admin/css/thousand_separator.css',)
        }


class MarketplaceProductCategoryAdmin(admin.ModelAdmin):
    list_display = [
        'marketplace_id', 'marketplace_name', 'get_internal_category', 
        'is_active', 'created_at'
    ]
    list_filter = ['is_active', 'created_at']
    search_fields = ['marketplace_id', 'marketplace_name', 'internal_category__name']
    list_editable = ['is_active']
    ordering = ['marketplace_name']
    
    fieldsets = (
        ('اطلاعات بازارگاه', {
            'fields': ('marketplace_id', 'marketplace_name', 'marketplace_parent_id')
        }),
        ('ارتباط با سیستم داخلی', {
            'fields': ('internal_category',)
        }),
        ('اطلاعات تکمیلی', {
            'fields': ('description', 'is_active')
        }),
    )
    
    def get_internal_category(self, obj):
        if obj.internal_category:
            return format_html(
                '<span style="color: green;">✓ {}</span>',
                obj.internal_category.name
            )
        return format_html('<span style="color: red;">✗ تطبیق نشده</span>')
    get_internal_category.short_description = 'گروه داخلی'


class MarketplaceProductAdmin(admin.ModelAdmin):
    list_display = [
        'marketplace_id', 'marketplace_name', 'marketplace_brand', 
        'marketplace_category', 'get_internal_mapping', 'is_active'
    ]
    list_filter = [
        'is_active', 'marketplace_category', 'marketplace_brand', 'created_at',
        ('internal_product', admin.EmptyFieldListFilter)
    ]
    search_fields = [
        'marketplace_id', 'marketplace_name', 'marketplace_brand', 
        'marketplace_model', 'internal_product__name', 'internal_product__code'
    ]
    list_editable = ['is_active']
    ordering = ['marketplace_name']
    
    fieldsets = (
        ('اطلاعات بازارگاه', {
            'fields': (
                'marketplace_id', 'marketplace_name', 'marketplace_brand', 
                'marketplace_model', 'marketplace_unit', 'marketplace_category'
            )
        }),
        ('ارتباط با سیستم داخلی', {
            'fields': ('internal_product',),
            'description': 'کالای داخلی که این کالای بازارگاه به آن مرتبط است'
        }),
        ('اطلاعات تکمیلی', {
            'fields': ('specifications', 'description', 'is_active'),
            'classes': ('collapse',)
        }),
    )
    
    def get_internal_mapping(self, obj):
        if obj.has_internal_mapping:
            return format_html(
                '<span style="color: green; font-weight: bold;">✓ {}</span>',
                obj.internal_product.name
            )
        return format_html(
            '<span style="color: red; font-weight: bold;">✗ تطبیق نشده</span>'
        )
    get_internal_mapping.short_description = 'تطبیق داخلی'


class ProductMappingAdmin(admin.ModelAdmin):
    list_display = [
        'get_marketplace_product', 'get_internal_product', 
        'conversion_factor', 'status', 'created_at'
    ]
    list_filter = ['status', 'created_at', 'confirmed_at']
    search_fields = [
        'marketplace_product__marketplace_name', 'marketplace_product__marketplace_id',
        'internal_product__name', 'internal_product__code'
    ]
    list_editable = ['status', 'conversion_factor']
    ordering = ['-created_at']
    
    def get_marketplace_product(self, obj):
        return format_html(
            '<strong>{}</strong><br><small style="color: #666;">{}</small>',
            obj.marketplace_product.marketplace_name,
            obj.marketplace_product.marketplace_id
        )
    get_marketplace_product.short_description = 'کالای بازارگاه'
    
    def get_internal_product(self, obj):
        return format_html(
            '<strong>{}</strong><br><small style="color: #666;">{}</small>',
            obj.internal_product.name,
            obj.internal_product.code
        )
    get_internal_product.short_description = 'کالای داخلی'


class ProductOfferAdmin(admin.ModelAdmin):
    form = ProductOfferForm
    list_display = [
        'offer_id', 'get_marketplace_product', 'get_cottage_number', 
        'get_offer_weight', 'get_unit_price', 'get_total_price', 
        'offer_type', 'status', 'offer_date'
    ]
    list_filter = [
        'status', 'offer_type', 'offer_date', 'created_at',
        'marketplace_product__marketplace_category'
    ]
    search_fields = [
        'offer_id', 'marketplace_product__marketplace_name', 
        'marketplace_product__marketplace_id', 'warehouse_receipt__cottage_number'
    ]
    list_editable = ['status', 'offer_type']
    ordering = ['-offer_date', '-created_at']
    
    fieldsets = (
        ('اطلاعات اصلی عرضه', {
            'fields': ('offer_id', 'warehouse_receipt', 'marketplace_product')
        }),
        ('جزئیات عرضه', {
            'fields': ('offer_date', 'offer_weight', 'unit_price', 'offer_type'),
            'description': 'وزن به تن و قیمت به ریال وارد شود'
        }),
        ('محاسبات خودکار', {
            'fields': ('get_total_price_display',),
            'classes': ('collapse',)
        }),
        ('وضعیت و توضیحات', {
            'fields': ('status', 'description', 'notes')
        }),
    )
    
    readonly_fields = ['get_total_price_display']
    
    def get_marketplace_product(self, obj):
        return format_html(
            '<strong>{}</strong><br><small style="color: #666;">{}</small>',
            obj.marketplace_product.marketplace_name,
            obj.marketplace_product.marketplace_id
        )
    get_marketplace_product.short_description = 'کالای بازارگاه'
    
    def get_cottage_number(self, obj):
        if obj.cottage_number:
            return format_html(
                '<span style="color: #0066cc; font-weight: bold;">{}</span>',
                obj.cottage_number
            )
        return format_html('<span style="color: red;">بدون کوتاژ</span>')
    get_cottage_number.short_description = 'شماره کوتاژ'
    
    def get_offer_weight(self, obj):
        return format_html(
            '<strong style="direction: ltr;">{}</strong> تن',
            format_number(obj.offer_weight)
        )
    get_offer_weight.short_description = 'وزن عرضه'
    
    def get_unit_price(self, obj):
        return format_html(
            '<strong style="direction: ltr;">{}</strong> ریال',
            format_number(obj.unit_price)
        )
    get_unit_price.short_description = 'قیمت واحد'
    
    def get_total_price(self, obj):
        return format_html(
            '<strong style="color: green; direction: ltr;">{}</strong> ریال',
            format_number(obj.total_price)
        )
    get_total_price.short_description = 'مبلغ کل'
    
    def get_total_price_display(self, obj):
        if obj.offer_weight and obj.unit_price:
            total = obj.offer_weight * obj.unit_price
            return format_html(
                '<div style="font-size: 16px; font-weight: bold; color: green; direction: ltr;">'
                '{} ریال'
                '</div>'
                '<div style="font-size: 12px; color: #666; margin-top: 5px;">'
                '{} تن × {} ریال'
                '</div>',
                format_number(total),
                format_number(obj.offer_weight),
                format_number(obj.unit_price)
            )
        return '-'
    get_total_price_display.short_description = 'مبلغ کل محاسبه شده'
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "warehouse_receipt":
            # فقط رسیدهایی که دارای کوتاژ هستند نمایش داده شوند
            from warehouse.models import WarehouseReceipt
            kwargs["queryset"] = WarehouseReceipt.objects.filter(
                receipt_type__in=['import_cottage', 'distribution_agency'],
                cottage_number__isnull=False
            ).exclude(cottage_number='')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
    
    class Media:
        js = ('admin/js/product_offer.js',)
        css = {
            'all': ('admin/css/product_offer.css',)
        }


# مطمئن شو که admin ها register شدن
try:
    admin.site.register(MarketplaceProductCategory, MarketplaceProductCategoryAdmin)
    admin.site.register(MarketplaceProduct, MarketplaceProductAdmin)  
    admin.site.register(ProductMapping, ProductMappingAdmin)
    admin.site.register(ProductOffer, ProductOfferAdmin)
    print("✅ Marketplace admins registered successfully")
except Exception as e:
    print(f"❌ Error registering marketplace admins: {e}")

    # marketplace/admin.py - اضافه کردن به انتهای فایل موجود

from .models import MarketplaceSale, MarketplacePurchase, MarketplacePurchaseDetail, DeliveryAddress
from django.contrib import messages
from django.shortcuts import redirect
import openpyxl
from django.http import HttpResponse
import io


class MarketplacePurchaseInline(admin.TabularInline):
    """Inline برای خریدهای بازارگاه"""
    model = MarketplacePurchase
    extra = 1
    fields = [
        'purchase_id', 'purchase_weight', 'purchase_date', 
        'buyer_name', 'buyer_mobile', 'buyer_national_id',
        'paid_amount', 'purchase_type'
    ]


class MarketplaceSaleAdmin(admin.ModelAdmin):
    """Admin برای فروش بازارگاه"""
    
    list_display = [
        'get_offer_id', 'get_cottage_number', 'product_title',
        'get_offer_unit_price', 'get_total_offer_weight',
        'get_sold_weight_before_transport', 'get_remaining_weight_before_transport',
        'offer_status', 'created_at'
    ]
    
    list_filter = [
        'offer_status', 'created_at', 
        'product_offer__marketplace_product__marketplace_category'
    ]
    
    search_fields = [
        'cottage_number', 'product_title', 
        'product_offer__offer_id', 'product_offer__cottage_number'
    ]
    
    readonly_fields = [
        'cottage_number', 'product_title', 'offer_unit_price', 'total_offer_weight',
        'sold_weight_before_transport', 'remaining_weight_before_transport',
        'sold_weight_after_transport', 'remaining_weight_after_transport',
        'offer_status', 'entry_customs', 'excel_operations'
    ]
    
    inlines = [MarketplacePurchaseInline]
    
    fieldsets = (
        ('اطلاعات عرضه', {
            'fields': (
                'product_offer', 'cottage_number', 'product_title', 
                'offer_unit_price', 'total_offer_weight', 'offer_status'
            )
        }),
        ('محاسبات وزن', {
            'fields': (
                'sold_weight_before_transport', 'remaining_weight_before_transport',
                'sold_weight_after_transport', 'remaining_weight_after_transport'
            ),
            'classes': ('collapse',)
        }),
        ('اطلاعات تکمیلی', {
            'fields': ('entry_customs',),
            'classes': ('collapse',)
        }),
        ('عملیات اکسل', {
            'fields': ('excel_operations',),
            'classes': ('collapse',)
        }),
    )
    
    def get_offer_id(self, obj):
        return obj.product_offer.offer_id if obj.product_offer else '-'
    get_offer_id.short_description = 'شناسه عرضه'
    
    def get_cottage_number(self, obj):
        if obj.cottage_number:
            return format_html(
                '<span style="color: #0066cc; font-weight: bold;">{}</span>',
                obj.cottage_number
            )
        return '-'
    get_cottage_number.short_description = 'شماره کوتاژ'
    
    def get_offer_unit_price(self, obj):
        return format_html(
            '<span style="direction: ltr; font-weight: bold;">{}</span> ریال',
            format_number(obj.offer_unit_price)
        )
    get_offer_unit_price.short_description = 'فی عرضه'
    
    def get_total_offer_weight(self, obj):
        return format_html(
            '<span style="direction: ltr; font-weight: bold;">{}</span> تن',
            format_number(obj.total_offer_weight)
        )
    get_total_offer_weight.short_description = 'وزن کل عرضه'
    
    def get_sold_weight_before_transport(self, obj):
        return format_html(
            '<span style="direction: ltr; color: green; font-weight: bold;">{}</span> تن',
            format_number(obj.sold_weight_before_transport)
        )
    get_sold_weight_before_transport.short_description = 'وزن فروش رفته'
    
    def get_remaining_weight_before_transport(self, obj):
        color = 'red' if obj.remaining_weight_before_transport <= 0 else 'orange'
        return format_html(
            '<span style="direction: ltr; color: {}; font-weight: bold;">{}</span> تن',
            color, format_number(obj.remaining_weight_before_transport)
        )
    get_remaining_weight_before_transport.short_description = 'وزن باقیمانده'
    
    def excel_operations(self, obj):
        """عملیات اکسل برای import/export خریدها"""
        if obj.pk:
            try:
                from django.urls import reverse
                download_url = reverse('marketplace:download_purchases_excel', args=[obj.pk])
                upload_url = reverse('marketplace:upload_purchases_excel', args=[obj.pk])
                template_url = reverse('marketplace:download_purchases_template')
                
                return format_html(
                    '<div style="display: flex; gap: 8px; margin-bottom: 10px;">'
                    '<a href="{}" class="button" style="background-color:#28a745; color:white; padding:8px 12px; text-decoration:none; border-radius:4px;">📥 دانلود خریدها</a>'
                    '<a href="{}" class="button" style="background-color:#17a2b8; color:white; padding:8px 12px; text-decoration:none; border-radius:4px;">📋 نمونه اکسل</a>'
                    '<a href="{}" class="button" style="background-color:#007bff; color:white; padding:8px 12px; text-decoration:none; border-radius:4px;" target="_blank">📤 آپلود خریدها</a>'
                    '</div>',
                    download_url, template_url, upload_url
                )
            except Exception as e:
                return f"خطا: {str(e)}"
        return "ابتدا فروش را ذخیره کنید"
    excel_operations.short_description = 'عملیات اکسل'
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "product_offer":
            # فقط عرضه‌های فعال نمایش داده شوند
            kwargs["queryset"] = ProductOffer.objects.filter(
                status__in=['active', 'sold']
            ).select_related('marketplace_product', 'warehouse_receipt')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
    
    class Media:
        js = ('admin/js/marketplace_simple.js',)
        css = {
            'all': ('admin/css/marketplace_sale.css',)
        }


class DeliveryAddressInline(admin.TabularInline):
    """Inline برای آدرس‌های تحویل"""
    model = DeliveryAddress
    extra = 0  # فقط از طریق اکسل اضافه میشن
    
    fields = [
        'code', 'product_title', 'description', 'address_registration_date',
        'assignment_id', 'recipient_name', 'recipient_unique_id',
        'vehicle_single', 'vehicle_double', 'vehicle_trailer',
        'delivery_address', 'delivery_postal_code', 'coordination_phone',
        'delivery_national_id', 'order_weight'
    ]
    
    readonly_fields = [
        'code', 'product_title', 'description', 'address_registration_date',
        'assignment_id', 'recipient_name', 'recipient_unique_id',
        'delivery_address', 'delivery_postal_code', 'coordination_phone',
        'delivery_national_id', 'order_weight'
    ]
    
    def has_add_permission(self, request, obj=None):
        return False  # فقط از طریق اکسل
    
    def has_delete_permission(self, request, obj=None):
        return True


class MarketplacePurchaseDetailAdmin(admin.ModelAdmin):
    """Admin برای جزئیات خرید بازارگاه"""
    
    list_display = [
        'get_purchase_id', 'get_buyer_name', 'get_purchase_weight',
        'get_purchase_type', 'get_delivery_addresses_count', 'created_at'
    ]
    
    list_filter = [
        'purchase__purchase_type', 'purchase__purchase_date', 'created_at'
    ]
    
    search_fields = [
        'purchase__purchase_id', 'purchase__buyer_name',
        'purchase__buyer_mobile', 'purchase__buyer_national_id'
    ]
    
    readonly_fields = ['excel_upload_result']
    inlines = [DeliveryAddressInline]
    
    fieldsets = (
        ('اطلاعات خرید', {
            'fields': ('purchase',)
        }),
        ('توضیحات', {
            'fields': ('agreement_description',)
        }),
        ('تخصیص آدرس تحویل', {
            'fields': ('excel_upload_result',),
            'description': 'برای افزودن آدرس‌های تحویل، فایل اکسل را آپلود کنید'
        }),
    )
    
    def get_purchase_id(self, obj):
        return obj.purchase.purchase_id
    get_purchase_id.short_description = 'شناسه خرید'
    
    def get_buyer_name(self, obj):
        return obj.purchase.buyer_name
    get_buyer_name.short_description = 'نام خریدار'
    
    def get_purchase_weight(self, obj):
        return format_html(
            '<span style="direction: ltr; font-weight: bold;">{}</span> تن',
            format_number(obj.purchase.purchase_weight)
        )
    get_purchase_weight.short_description = 'وزن خرید'
    
    def get_purchase_type(self, obj):
        type_colors = {'cash': 'green', 'agreement': 'orange'}
        color = type_colors.get(obj.purchase.purchase_type, 'black')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.purchase.get_purchase_type_display()
        )
    get_purchase_type.short_description = 'نوع خرید'
    
    def get_delivery_addresses_count(self, obj):
        count = obj.delivery_addresses.count()
        if count > 0:
            return format_html(
                '<span style="color: green; font-weight: bold;">{} آدرس</span>',
                count
            )
        return format_html('<span style="color: red;">بدون آدرس</span>')
    get_delivery_addresses_count.short_description = 'آدرس‌های تحویل'
    
    def excel_upload_result(self, obj):
        """نمایش نتیجه آپلود اکسل و فرم آپلود"""
        if obj.pk:
            try:
                from django.urls import reverse
                upload_url = reverse('marketplace:upload_delivery_addresses', args=[obj.pk])
                template_url = reverse('marketplace:download_delivery_template')
                
                addresses_count = obj.delivery_addresses.count()
                
                result = format_html(
                    '<div style="margin-bottom: 15px;">'
                    '<strong>تعداد آدرس‌های موجود:</strong> '
                    '<span style="color: {}; font-weight: bold;">{} آدرس</span>'
                    '</div>',
                    'green' if addresses_count > 0 else 'red',
                    addresses_count
                )
                
                result += format_html(
                    '<div style="display: flex; gap: 8px; margin-bottom: 15px;">'
                    '<a href="{}" class="button" style="background-color:#17a2b8; color:white; padding:8px 12px; text-decoration:none; border-radius:4px;">📋 دانلود نمونه</a>'
                    '<a href="{}" class="button" style="background-color:#007bff; color:white; padding:8px 12px; text-decoration:none; border-radius:4px;" target="_blank">📤 آپلود آدرس‌ها</a>'
                    '</div>',
                    template_url, upload_url
                )
                
                if addresses_count > 0:
                    result += format_html(
                        '<div style="font-size: 12px; color: #666; background: #f8f9fa; padding: 10px; border-radius: 4px;">'
                        '<strong>💡 نکته:</strong> آدرس‌های تحویل با موفقیت بارگذاری شده‌اند. '
                        'برای به‌روزرسانی، فایل جدید آپلود کنید.'
                        '</div>'
                    )
                else:
                    result += format_html(
                        '<div style="font-size: 12px; color: #856404; background: #fff3cd; padding: 10px; border-radius: 4px; border-left: 3px solid #ffc107;">'
                        '<strong>⚠️ توجه:</strong> هنوز آدرس تحویلی تعریف نشده است. '
                        'لطفاً فایل اکسل آدرس‌ها را آپلود کنید.'
                        '</div>'
                    )
                
                return result
            except Exception as e:
                return f"خطا: {str(e)}"
        return "ابتدا رکورد را ذخیره کنید"
    excel_upload_result.short_description = 'وضعیت آدرس‌های تحویل'


# Register کردن Admin ها
try:
    admin.site.register(MarketplaceSale, MarketplaceSaleAdmin)
    admin.site.register(MarketplacePurchaseDetail, MarketplacePurchaseDetailAdmin)
    print("✅ Marketplace Sale admins registered successfully")
except Exception as e:
    print(f"❌ Error registering marketplace sale admins: {e}")