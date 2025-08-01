# marketplace/admin/offer.py
from django import forms
from django.contrib import admin
from django.utils.html import format_html
from ..models import ProductOffer
from .base import BaseMarketplaceAdmin, ThousandSeparatorWidget, format_number


class ProductOfferForm(forms.ModelForm):
    """فرم سفارشی برای عرضه کالا"""
    
    class Meta:
        model = ProductOffer
        fields = '__all__'
        widgets = {
            'unit_price': ThousandSeparatorWidget(attrs={
                'placeholder': 'مثلاً 2,500,000'
            }),
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # فیلتر کردن رسیدهای انبار فقط به کوتاژها
        if 'warehouse_receipt' in self.fields:
            from warehouse.models import WarehouseReceipt
            self.fields['warehouse_receipt'].queryset = WarehouseReceipt.objects.filter(
                receipt_type__in=['import_cottage', 'distribution_agency'],
                cottage_number__isnull=False
            ).exclude(cottage_number='')
            
        # فیلتر کردن محصولات انبار
        if 'product' in self.fields:
            from warehouse.models.base import Product
            self.fields['product'].queryset = Product.objects.all().order_by('name')
            
        # تنظیمات ظاهری
        if 'offer_weight' in self.fields:
            self.fields['offer_weight'].help_text = 'وزن وارد شود'
        if 'unit_price' in self.fields:
            self.fields['unit_price'].help_text = 'قیمت به ریال وارد شود'


@admin.register(ProductOffer)
class ProductOfferAdmin(BaseMarketplaceAdmin):
    form = ProductOfferForm
    list_display = [
        'offer_id', 'get_product', 'get_cottage_number', 
        'get_offer_weight', 'get_unit_price', 'get_total_price', 
        'offer_type', 'status', 'offer_date'
    ]
    list_filter = [
        'status', 'offer_type', 'offer_date', 'created_at',
        'product__category'
    ]
    search_fields = [
        'offer_id', 'product__name', 
        'product__code', 'warehouse_receipt__cottage_number'
    ]
    list_editable = ['status', 'offer_type']
    ordering = ['-offer_date', '-created_at']
    
    fieldsets = (
        ('اطلاعات اصلی عرضه', {
            'fields': ('offer_id', 'warehouse_receipt', 'product')
        }),
        ('جزئیات عرضه', {
            'fields': ('offer_date', 'offer_weight', 'unit_price', 'offer_type'),
            'description': 'وزن بر حسب کیلوگرم و قیمت به ریال وارد شود'
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
    
    def get_product(self, obj):
        return format_html(
            '<strong>{}</strong><br><small style="color: #666;">{}</small>',
            obj.product.name,
            obj.product.code
        )
    get_product.short_description = 'کالا'
    
    def get_cottage_number(self, obj):
        if obj.cottage_number:
            return format_html(
                '<span style="color: #0066cc; font-weight: bold;">{}</span>',
                obj.cottage_number
            )
        return format_html('<span style="color: red;">بدون کوتاژ</span>')
    get_cottage_number.short_description = 'شماره کوتاژ'
    
    def get_offer_weight(self, obj):
        return self.format_weight(obj.offer_weight)
    get_offer_weight.short_description = 'وزن عرضه'
    
    def get_unit_price(self, obj):
        return self.format_currency(obj.unit_price)
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
                '{} × {} ریال'
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