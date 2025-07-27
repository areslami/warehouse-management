# marketplace/admin.py
from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Q
from django.contrib import messages
from .models import MarketplaceProductCategory, MarketplaceProduct, ProductMapping, ProductOffer


def format_number(value):
    """فرمت کردن اعداد با جداکننده هزارگان"""
    if value is None:
        return '-'
    return f'{int(value):,}'


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
    list_display = [
        'offer_id', 'get_marketplace_product', 'get_cottage_number', 
        'offer_weight', 'get_unit_price', 'get_total_price', 
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
            'fields': ('offer_date', 'offer_weight', 'unit_price', 'offer_type')
        }),
        ('وضعیت و توضیحات', {
            'fields': ('status', 'description', 'notes')
        }),
    )
    
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
    
    def get_unit_price(self, obj):
        return format_html(
            '<strong>{}</strong> ریال',
            format_number(obj.unit_price)
        )
    get_unit_price.short_description = 'قیمت واحد'
    
    def get_total_price(self, obj):
        return format_html(
            '<strong style="color: green;">{}</strong> ریال',
            format_number(obj.total_price)
        )
    get_total_price.short_description = 'مبلغ کل'
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "warehouse_receipt":
            # فقط رسیدهایی که دارای کوتاژ هستند نمایش داده شوند
            from warehouse.models import WarehouseReceipt
            kwargs["queryset"] = WarehouseReceipt.objects.filter(
                receipt_type__in=['import_cottage', 'distribution_agency'],
                cottage_number__isnull=False
            ).exclude(cottage_number='')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


# مطمئن شو که admin ها register شدن
try:
    admin.site.register(MarketplaceProductCategory, MarketplaceProductCategoryAdmin)
    admin.site.register(MarketplaceProduct, MarketplaceProductAdmin)  
    admin.site.register(ProductMapping, ProductMappingAdmin)
    admin.site.register(ProductOffer, ProductOfferAdmin)
    print("✅ Marketplace admins registered successfully")
except Exception as e:
    print(f"❌ Error registering marketplace admins: {e}")