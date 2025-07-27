from django.contrib import admin
from ..models import Supplier, Customer, Receiver, ShippingCompany

@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ['code', 'get_name', 'supplier_type', 'phone']
    search_fields = ['company_name', 'full_name', 'phone']
    list_filter = ['supplier_type']
    list_per_page = 20
    
    def get_name(self, obj):
        return str(obj)
    get_name.short_description = 'نام'

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['code', 'get_name', 'customer_type', 'phone']
    search_fields = ['company_name', 'full_name', 'phone']
    list_filter = ['customer_type']
    list_per_page = 20
    
    def get_name(self, obj):
        return str(obj)
    get_name.short_description = 'نام'

@admin.register(Receiver)
class ReceiverAdmin(admin.ModelAdmin):
    list_display = ['code', 'unique_id', 'get_name', 'receiver_type', 'phone', 'postal_code']
    search_fields = ['unique_id', 'company_name', 'full_name', 'phone']
    list_filter = ['receiver_type']
    list_per_page = 20
    
    def get_name(self, obj):
        return str(obj)
    get_name.short_description = 'نام'

@admin.register(ShippingCompany)
class ShippingCompanyAdmin(admin.ModelAdmin):
    list_display = ['name', 'contact_person', 'phone']
    search_fields = ['name', 'contact_person', 'phone']
    list_per_page = 20