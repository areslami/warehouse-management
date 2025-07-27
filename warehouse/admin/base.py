from django.contrib import admin
from django.contrib.admin import AdminSite
from django.utils.html import format_html
from ..models import ProductCategory, Product, Warehouse

# تغییر تنظیمات پنل مدیریت
admin.site.site_header = 'سیستم مدیریت انبار'
admin.site.site_title = 'مدیریت انبار'
admin.site.index_title = 'پنل مدیریت انبار'

# اضافه کردن CSS فارسی به پنل ادمین
class RTLAdminSite(AdminSite):
    class Media:
        css = {
            'all': ('css/rtl.css',)
        }

# جایگزینی admin site پیش‌فرض
admin.site.__class__ = RTLAdminSite

# تابع کمکی برای فرمت کردن اعداد
def format_number(value):
    """فرمت کردن اعداد با جداکننده هزارگان"""
    if value is None:
        return '-'
    return f'{int(value):,}'

# Admin های مدل‌های پایه
@admin.register(ProductCategory)
class ProductCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'description']
    search_fields = ['name']
    list_per_page = 20

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'category', 'unit']
    search_fields = ['name', 'code']
    list_filter = ['category']
    list_per_page = 20

@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ['name', 'manager', 'phone']
    search_fields = ['name', 'manager']
    list_per_page = 20