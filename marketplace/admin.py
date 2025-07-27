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