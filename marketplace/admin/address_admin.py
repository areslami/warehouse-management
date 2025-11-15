# marketplace/admin/address_admin.py
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from ..models import DeliveryAddress
from .base import BaseMarketplaceAdmin


@admin.register(DeliveryAddress)
class DeliveryAddressAdmin(BaseMarketplaceAdmin):
    """Admin برای آدرس‌های تحویل"""
    
    list_display = [
        'assignment_id', 'recipient_name', 'province', 'city', 'order_weight',
        'get_status_display_colored', 'get_purchase_info', 'delivery_order_number',
        'created_at'
    ]
    
    list_filter = [
        'status', 'province', 'city', 'buyer_user_type', 
        'vehicle_single', 'vehicle_double', 'vehicle_trailer',
        'created_at'
    ]
    
    search_fields = [
        'assignment_id', 'recipient_name', 'buyer_name', 'province', 'city',
        'delivery_order_number', 'buyer_national_id', 'delivery_national_id'
    ]
    
    readonly_fields = [
        'created_at', 'updated_at', 'get_management_link'
    ]
    
    fieldsets = (
        ('اطلاعات کلی', {
            'fields': (
                'assignment_id', 'code', 'status', 'order_weight', 
                'total_purchase_weight', 'delivery_order_number'
            )
        }),
        ('اطلاعات خریدار', {
            'fields': (
                'buyer_name', 'buyer_national_id', 'buyer_mobile', 'buyer_address',
                'buyer_postal_code', 'buyer_user_type', 'buyer_unique_id', 'buyer_account_number'
            ),
            'classes': ('collapse',)
        }),
        ('اطلاعات تحویل گیرنده', {
            'fields': (
                'recipient_name', 'recipient_unique_id', 'delivery_address',
                'delivery_postal_code', 'province', 'city', 'coordination_phone', 'delivery_national_id'
            )
        }),
        ('وسیله حمل', {
            'fields': ('vehicle_single', 'vehicle_double', 'vehicle_trailer')
        }),
        ('اطلاعات مالی', {
            'fields': (
                'paid_amount', 'unit_price', 'payment_method',
                'payment_period_1_days', 'payment_amount_1',
                'payment_period_2_days', 'payment_amount_2',
                'payment_period_3_days', 'payment_amount_3'
            ),
            'classes': ('collapse',)
        }),
        ('اطلاعات کالا', {
            'fields': (
                'product_title', 'cottage_code', 'offer_id', 'tracking_number', 'description'
            ),
            'classes': ('collapse',)
        }),
        ('تاریخ‌ها', {
            'fields': (
                'purchase_date', 'address_registration_date'
            ),
            'classes': ('collapse',)
        }),
        ('بارنامه', {
            'fields': ('shipped_weight', 'unshipped_weight'),
            'classes': ('collapse',)
        }),
        ('سیستم', {
            'fields': ('purchase_detail', 'created_at', 'updated_at', 'get_management_link'),
            'classes': ('collapse',)
        }),
    )
    
    def get_status_display_colored(self, obj):
        """نمایش رنگی وضعیت"""
        colors = {
            'pending': '#ffc107',
            'sent_to_delivery': '#17a2b8', 
            'delivery_created': '#28a745',
            'completed': '#6c757d'
        }
        color = colors.get(obj.status, '#6c757d')
        text_color = '#000' if obj.status == 'pending' else '#fff'
        
        return format_html(
            '<span style="background-color: {}; color: {}; padding: 4px 8px; '
            'border-radius: 4px; font-size: 12px; font-weight: bold;">{}</span>',
            color, text_color, obj.get_status_display()
        )
    get_status_display_colored.short_description = 'وضعیت'
    
    def get_purchase_info(self, obj):
        """اطلاعات خرید"""
        purchase = obj.purchase_detail.purchase
        return f'{purchase.purchase_id} - {purchase.buyer_name}'
    get_purchase_info.short_description = 'خرید مرتبط'
    
    def get_management_link(self, obj):
        """لینک مدیریت آدرس‌ها"""
        if obj.pk:
            try:
                list_url = reverse('marketplace:address_list')
                detail_url = reverse('marketplace:address_detail', args=[obj.pk])
                
                return format_html(
                    '<div style="display: flex; gap: 8px;">'
                    '<a href="{}" class="button" style="background-color:#007bff; color:white; '
                    'padding:6px 10px; text-decoration:none; border-radius:4px;">🗺️ لیست آدرس‌ها</a>'
                    '<a href="{}" class="button" style="background-color:#28a745; color:white; '
                    'padding:6px 10px; text-decoration:none; border-radius:4px;">📋 جزئیات کامل</a>'
                    '</div>',
                    list_url, detail_url
                )
            except Exception as e:
                return f"خطا: {str(e)}"
        return "-"
    get_management_link.short_description = 'مدیریت'
    
    def changelist_view(self, request, extra_context=None):
        """اضافه کردن لینک مدیریت به changelist"""
        extra_context = extra_context or {}
        try:
            extra_context['management_url'] = reverse('marketplace:address_list')
        except:
            pass
        return super().changelist_view(request, extra_context)
    
    class Media:
        css = {
            'all': ('admin/css/marketplace_sale.css',)
        }