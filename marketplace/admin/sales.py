# marketplace/admin/sales.py
from django.contrib import admin
from django.utils.html import format_html
from ..models import MarketplaceSale, MarketplacePurchase, MarketplacePurchaseDetail, DeliveryAddress, ProductOffer, DistributionAgency
from .base import BaseMarketplaceAdmin, ExcelOperationsMixin, format_number
from .bulk_operations import BulkOperationsMixin, get_bulk_upload_changelist_view


class MarketplacePurchaseInline(admin.TabularInline):
    """Inline برای خریدهای بازارگاه"""
    model = MarketplacePurchase
    extra = 1
    fields = [
        'purchase_id', 'cottage_number', 'description', 'purchase_weight', 'province',
        'purchase_date', 'paid_amount', 'unit_price', 'tracking_number',
        'product_title', 'buyer_national_id', 'buyer_mobile', 'buyer_name', 'purchase_type'
    ]


@admin.register(MarketplaceSale)
class MarketplaceSaleAdmin(BaseMarketplaceAdmin, ExcelOperationsMixin):
    """Admin برای فروش بازارگاه"""
    
    list_display = [
        'get_offer_id', 'get_cottage_number', 'product_title',
        'get_offer_unit_price', 'get_total_offer_weight',
        'get_sold_weight_before_transport', 'get_remaining_weight_before_transport',
        'offer_status', 'created_at'
    ]
    
    list_filter = [
        'offer_status', 'created_at', 
        'product_offer__product__category'
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
        return self.format_currency(obj.offer_unit_price)
    get_offer_unit_price.short_description = 'فی عرضه'
    
    def get_total_offer_weight(self, obj):
        return self.format_weight(obj.total_offer_weight)
    get_total_offer_weight.short_description = 'وزن کل عرضه'
    
    def get_sold_weight_before_transport(self, obj):
        return format_html(
            '<span style="direction: ltr; color: green; font-weight: bold;">{}</span>',
            format_number(obj.sold_weight_before_transport)
        )
    get_sold_weight_before_transport.short_description = 'وزن فروش رفته'
    
    def get_remaining_weight_before_transport(self, obj):
        color = 'red' if obj.remaining_weight_before_transport <= 0 else 'orange'
        return format_html(
            '<span style="direction: ltr; color: {}; font-weight: bold;">{}</span>',
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
    
    def add_view(self, request, form_url='', extra_context=None):
        """Redirect to custom form for creating sales with Excel upload"""
        from django.urls import reverse
        from django.shortcuts import redirect
        return redirect(reverse('marketplace:create_sale_with_excel'))
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "product_offer":
            # فقط عرضه‌های فعال نمایش داده شوند
            kwargs["queryset"] = ProductOffer.objects.filter(
                status__in=['active', 'sold']
            ).select_related('product', 'warehouse_receipt')
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
        'assignment_id', 'recipient_name', 'province', 'city',
        'order_weight', 'buyer_name', 'coordination_phone'
    ]
    readonly_fields = ['assignment_id', 'recipient_name', 'province', 'city', 'order_weight']


@admin.register(MarketplacePurchaseDetail)
class MarketplacePurchaseDetailAdmin(BaseMarketplaceAdmin, ExcelOperationsMixin, BulkOperationsMixin):
    """Admin برای جزئیات خرید بازارگاه"""
    
    list_display = [
        'get_purchase_id', 'get_buyer_name', 'get_purchase_weight', 
        'get_purchase_date', 'get_purchase_type', 'get_delivery_addresses_count'
    ]
    
    list_filter = [
        'purchase__purchase_type', 'purchase__purchase_date', 'created_at'
    ]
    
    search_fields = [
        'purchase__purchase_id', 'purchase__buyer_name', 
        'purchase__buyer_national_id', 'purchase__buyer_mobile'
    ]
    
    readonly_fields = [
        'get_purchase_info', 'get_delivery_count', 'delivery_excel_operations'
    ]
    
    inlines = [DeliveryAddressInline]
    
    fieldsets = (
        ('اطلاعات خرید', {
            'fields': ('purchase', 'get_purchase_info')
        }),
        ('جزئیات اضافی', {
            'fields': ('agreement_description',)
        }),
        ('آدرس‌های تحویل', {
            'fields': ('get_delivery_count', 'delivery_excel_operations'),
            'classes': ('collapse',)
        }),
    )
    
    def get_purchase_id(self, obj):
        return obj.purchase.purchase_id
    get_purchase_id.short_description = 'شناسه خرید'
    
    def get_buyer_name(self, obj):
        return obj.purchase.buyer_name
    get_buyer_name.short_description = 'نام خریدار'
    
    def get_purchase_weight(self, obj):
        return self.format_weight(obj.purchase.purchase_weight)
    get_purchase_weight.short_description = 'وزن خرید'
    
    def get_purchase_date(self, obj):
        return obj.purchase.purchase_date
    get_purchase_date.short_description = 'تاریخ خرید'
    
    def get_purchase_type(self, obj):
        return obj.purchase.get_purchase_type_display()
    get_purchase_type.short_description = 'نوع خرید'
    
    def get_delivery_addresses_count(self, obj):
        count = obj.delivery_addresses.count()
        color = 'green' if count > 0 else 'red'
        return format_html(
            '<span style="color: {}; font-weight: bold;">{} آدرس</span>',
            color, count
        )
    get_delivery_addresses_count.short_description = 'تعداد آدرس‌ها'
    
    def get_purchase_info(self, obj):
        """نمایش اطلاعات کامل خرید"""
        purchase = obj.purchase
        return format_html(
            '<div style="background: #f8f9fa; padding: 10px; border-radius: 5px;">'
            '<strong>شناسه:</strong> {}<br>'
            '<strong>خریدار:</strong> {}<br>'
            '<strong>وزن:</strong> {}<br>'
            '<strong>مبلغ:</strong> {} ریال<br>'
            '<strong>تاریخ:</strong> {}<br>'
            '<strong>نوع:</strong> {}'
            '</div>',
            purchase.purchase_id,
            purchase.buyer_name,
            format_number(purchase.purchase_weight),
            format_number(purchase.paid_amount),
            purchase.purchase_date,
            purchase.get_purchase_type_display()
        )
    get_purchase_info.short_description = 'اطلاعات خرید'
    
    def get_delivery_count(self, obj):
        count = obj.delivery_addresses.count()
        return format_html(
            '<span style="font-size: 16px; font-weight: bold; color: {};">{} آدرس تحویل</span>',
            'green' if count > 0 else 'red', count
        )
    get_delivery_count.short_description = 'تعداد آدرس‌ها'
    
    def delivery_excel_operations(self, obj):
        """عملیات اکسل برای آدرس‌های تحویل"""
        if obj.pk:
            try:
                from django.urls import reverse
                upload_url = reverse('marketplace:upload_delivery_addresses', args=[obj.pk])
                template_url = reverse('marketplace:download_delivery_template')
                address_list_url = reverse('marketplace:address_list') + f'?purchase_detail={obj.pk}'
                
                address_count = obj.delivery_addresses.count()
                
                return format_html(
                    '<div style="display: flex; flex-direction: column; gap: 8px;">'
                    '<div style="display: flex; gap: 8px;">'
                    '<a href="{}" class="button" style="background-color:#17a2b8; color:white; padding:8px 12px; text-decoration:none; border-radius:4px;">📋 نمونه اکسل</a>'
                    '<a href="{}" class="button" style="background-color:#007bff; color:white; padding:8px 12px; text-decoration:none; border-radius:4px;">📤 آپلود آدرس‌ها</a>'
                    '</div>'
                    '<div style="display: flex; gap: 8px;">'
                    '<a href="{}" class="button" style="background-color:#28a745; color:white; padding:8px 12px; text-decoration:none; border-radius:4px;">🗺️ مدیریت آدرس‌ها ({} آدرس)</a>'
                    '</div>'
                    '</div>',
                    template_url, upload_url, address_list_url, address_count
                )
            except Exception as e:
                return f"خطا: {str(e)}"
        return "ابتدا جزئیات خرید را ذخیره کنید"
    delivery_excel_operations.short_description = 'عملیات اکسل آدرس‌ها'
    
    # اضافه کردن bulk operations به changelist view
    changelist_view = get_bulk_upload_changelist_view(BaseMarketplaceAdmin.changelist_view)


@admin.register(DistributionAgency)
class DistributionAgencyAdmin(BaseMarketplaceAdmin):
    """Admin برای اعطای عاملیت توزیع"""
    
    list_display = [
        'get_cottage_number', 'get_warehouse', 'get_product_type', 
        'customer', 'get_agency_weight', 'agency_date', 'get_sales_proforma'
    ]
    
    list_filter = [
        'agency_date', 'warehouse', 'product_type', 'customer'
    ]
    
    search_fields = [
        'cottage_number', 'customer__full_name', 'customer__company_name',
        'warehouse_receipt__cottage_number', 'warehouse_receipt__temp_number',
        'sales_proforma__number'
    ]
    
    readonly_fields = [
        'warehouse', 'product_type', 'cottage_number', 
        'get_warehouse_info', 'get_receipt_info', 'get_available_weight'
    ]
    
    fieldsets = (
        ('انتخاب رسید انبار', {
            'fields': ('warehouse_receipt', 'get_receipt_info')
        }),
        ('اطلاعات خودکار از رسید', {
            'fields': ('warehouse', 'product_type', 'cottage_number'),
            'classes': ('collapse',)
        }),
        ('اطلاعات عاملیت', {
            'fields': ('sales_proforma', 'customer', 'agency_weight', 'agency_date')
        }),
        ('وضعیت موجودی', {
            'fields': ('get_available_weight',),
            'classes': ('collapse',)
        }),
        ('توضیحات', {
            'fields': ('description',),
            'classes': ('collapse',)
        }),
    )
    
    def get_cottage_number(self, obj):
        if obj.cottage_number:
            return format_html(
                '<span style="color: #0066cc; font-weight: bold;">{}</span>',
                obj.cottage_number
            )
        return '-'
    get_cottage_number.short_description = 'شماره کوتاژ'
    
    def get_warehouse(self, obj):
        return obj.warehouse.name if obj.warehouse else '-'
    get_warehouse.short_description = 'انبار'
    
    def get_product_type(self, obj):
        return obj.product_type.name if obj.product_type else '-'
    get_product_type.short_description = 'نوع کالا'
    
    def get_agency_weight(self, obj):
        return format_html(
            '<span style="color: #fd7e14; font-weight: bold;">{}</span> کیلو',
            format_number(obj.agency_weight)
        )
    get_agency_weight.short_description = 'وزن عاملیت'
    
    def get_sales_proforma(self, obj):
        return obj.sales_proforma.number if obj.sales_proforma else '-'
    get_sales_proforma.short_description = 'شماره پیش‌فاکتور فروش'
    
    def get_warehouse_info(self, obj):
        """نمایش اطلاعات انبار"""
        if obj.warehouse:
            return format_html(
                '<div style="background: #e3f2fd; padding: 8px; border-radius: 4px;">'
                '<strong>انبار:</strong> {}<br>'
                '<strong>نوع کالا:</strong> {}'
                '</div>',
                obj.warehouse.name,
                obj.product_type.name if obj.product_type else 'نامشخص'
            )
        return 'انبار انتخاب نشده'
    get_warehouse_info.short_description = 'اطلاعات انبار'
    
    def get_receipt_info(self, obj):
        """نمایش اطلاعات رسید انبار"""
        if obj.warehouse_receipt:
            receipt = obj.warehouse_receipt
            return format_html(
                '<div style="background: #f3e5f5; padding: 8px; border-radius: 4px;">'
                '<strong>رسید:</strong> {}<br>'
                '<strong>کوتاژ:</strong> {}<br>'
                '<strong>تاریخ:</strong> {}<br>'
                '<strong>جمع وزن:</strong> {} کیلو<br>'
                '<strong>وزن عرضه شده:</strong> {} کیلو<br>'
                '<strong>وزن عاملیت داده شده:</strong> {} کیلو<br>'
                '<strong>مانده قابل عرضه:</strong> <span style="color: #28a745; font-weight: bold;">{}</span> کیلو'
                '</div>',
                receipt.temp_number,
                receipt.cottage_number or 'ندارد',
                receipt.date,
                format_number(receipt.total_weight),
                format_number(receipt.get_offered_weight()),
                format_number(receipt.get_agency_weight()),
                format_number(receipt.get_available_for_offer_weight())
            )
        return 'رسید انبار انتخاب نشده'
    get_receipt_info.short_description = 'اطلاعات رسید انبار'
    
    def get_available_weight(self, obj):
        """نمایش وزن قابل دسترس برای عاملیت"""
        if obj.warehouse_receipt:
            available = obj.warehouse_receipt.get_available_for_offer_weight()
            color = '#28a745' if available > 0 else '#dc3545'
            return format_html(
                '<div style="background: #f8f9fa; padding: 8px; border-radius: 4px; border-left: 3px solid {};">'
                '<strong>مانده قابل عرضه:</strong> <span style="color: {}; font-weight: bold;">{}</span> کیلو'
                '</div>',
                color, color, format_number(available)
            )
        return 'رسید انبار انتخاب نشده'
    get_available_weight.short_description = 'وضعیت موجودی'
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "warehouse_receipt":
            # فقط رسیدهای کوتاژ وارداتی نمایش داده شوند
            kwargs["queryset"] = kwargs.get("queryset", db_field.remote_field.model.objects.all()).filter(
                receipt_type='import_cottage'
            ).select_related('warehouse', 'purchase_proforma')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
    
    class Media:
        js = ('admin/js/conditional_fields.js',)
        css = {
            'all': ('admin/css/marketplace_sale.css',)
        }