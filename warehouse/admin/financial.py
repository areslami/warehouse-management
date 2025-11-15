from django.contrib import admin
from django.utils.html import format_html
from ..models import AccountsPayable, AccountsReceivable
from .base import format_number

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