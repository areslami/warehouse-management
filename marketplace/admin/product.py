# marketplace/admin/product.py
from django.contrib import admin
from django.utils.html import format_html
from ..models import MarketplaceProductCategory, MarketplaceProduct, ProductMapping
from .base import BaseMarketplaceAdmin


@admin.register(MarketplaceProductCategory)
class MarketplaceProductCategoryAdmin(BaseMarketplaceAdmin):
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


@admin.register(MarketplaceProduct)
class MarketplaceProductAdmin(BaseMarketplaceAdmin):
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


@admin.register(ProductMapping)
class ProductMappingAdmin(BaseMarketplaceAdmin):
    list_display = [
        'marketplace_product', 'internal_product', 'get_status_display', 
        'conversion_factor', 'created_by', 'confirmed_by', 'created_at'
    ]
    list_filter = ['status', 'created_at', 'confirmed_at']
    search_fields = [
        'marketplace_product__marketplace_name', 'internal_product__name',
        'marketplace_product__marketplace_id', 'internal_product__code'
    ]
    list_editable = ['conversion_factor']
    ordering = ['-created_at']
    
    fieldsets = (
        ('تطبیق کالا', {
            'fields': ('marketplace_product', 'internal_product', 'conversion_factor')
        }),
        ('وضعیت تطبیق', {
            'fields': ('status', 'notes')
        }),
        ('اطلاعات تایید', {
            'fields': ('created_by', 'confirmed_by', 'confirmed_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_status_display(self, obj):
        return self.format_status(obj.status, obj.get_status_display())
    get_status_display.short_description = 'وضعیت'