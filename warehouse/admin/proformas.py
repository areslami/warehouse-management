from django.contrib import admin
from django.utils.html import format_html
from ..models import (PurchaseProforma, PurchaseProformaItem, SalesProforma, SalesProformaItem,
                      AccountsPayable, AccountsReceivable)
from .base import format_number

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