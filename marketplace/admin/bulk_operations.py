# marketplace/admin/bulk_operations.py
from django.contrib import admin
from django.shortcuts import render, redirect
from django.contrib import messages
from django.urls import reverse
from django.utils.html import format_html
from ..models import MarketplacePurchase, MarketplacePurchaseDetail


class BulkOperationsMixin:
    """Mixin برای عملیات بالک در Admin"""
    
    def get_bulk_operations_html(self):
        """HTML برای عملیات بالک"""
        bulk_upload_url = reverse('marketplace:bulk_address_upload')
        
        return format_html(
            '<div style="background: #e8f4fd; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #0073aa;">'
            '<h3 style="margin-top: 0; color: #0073aa;">عملیات بالک آدرس‌های تحویل</h3>'
            '<p>با استفاده از این ابزار می‌توانید آدرس‌های تحویل متعدد را به صورت یکجا از طریق فایل اکسل بارگذاری کنید.</p>'
            '<div style="margin-top: 15px;">'
            '<a href="{}" class="button default" style="background-color:#0073aa; color:white; padding:10px 20px; text-decoration:none; border-radius:5px; display:inline-block; margin-right:10px;">📤 آپلود بالک آدرس‌ها</a>'
            '</div>'
            '<div style="margin-top: 10px; font-size: 12px; color: #666;">'
            '<strong>نحوه استفاده:</strong> فایل اکسل خود را با ستون "شناسه خرید" آماده کنید. سیستم بر اساس شناسه خرید، آدرس‌ها را به خریدهای مربوطه اختصاص می‌دهد.'
            '</div>'
            '</div>',
            bulk_upload_url
        )


def get_bulk_upload_changelist_view(original_changelist_view):
    """Decorator برای اضافه کردن bulk operations به changelist view"""
    
    def changelist_view_with_bulk_operations(self, request, extra_context=None):
        extra_context = extra_context or {}
        
        # اضافه کردن HTML عملیات بالک
        if hasattr(self, 'get_bulk_operations_html'):
            extra_context['bulk_operations_html'] = self.get_bulk_operations_html()
        
        return original_changelist_view(self, request, extra_context)
    
    return changelist_view_with_bulk_operations