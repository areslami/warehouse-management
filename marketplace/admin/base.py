# marketplace/admin/base.py
from django import forms
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe


def format_number(value):
    """فرمت کردن اعداد با جداکننده هزارگان"""
    if value is None:
        return '-'
    try:
        return f"{int(value):,}".replace(',', '،')
    except (ValueError, TypeError):
        return str(value)


class ThousandSeparatorWidget(forms.TextInput):
    """ویجت برای نمایش اعداد با جداکننده هزارگان"""
    
    def __init__(self, attrs=None):
        default_attrs = {'style': 'text-align: left; direction: ltr;'}
        if attrs:
            default_attrs.update(attrs)
        super().__init__(attrs=default_attrs)
    
    def format_value(self, value):
        if value is None or value == '':
            return ''
        try:
            # Remove any existing separators and format with commas
            cleaned_value = str(value).replace('،', '').replace(',', '')
            return f"{int(float(cleaned_value)):,}".replace(',', '،')
        except (ValueError, TypeError):
            return str(value)
    
    class Media:
        js = ('marketplace/js/thousand_separator.js',)


class NumberFormattingMixin:
    """Mixin for consistent number formatting in admin"""
    
    def format_currency(self, value, suffix="ریال"):
        """Format currency values"""
        if value is None:
            return '-'
        try:
            formatted = format_number(value)
            return format_html('<span style="font-family: monospace;">{} {}</span>', formatted, suffix)
        except:
            return str(value)
    
    def format_weight(self, value, unit=""):
        """Format weight values"""
        if value is None:
            return '-'
        try:
            formatted = format_number(value)
            return format_html('<span style="font-family: monospace;">{} {}</span>', formatted, unit)
        except:
            return str(value)


class StatusIndicatorMixin:
    """Mixin for color-coded status displays"""
    
    def get_status_color(self, status):
        """Get color for status display"""
        status_colors = {
            'active': '#28a745',    # Green
            'inactive': '#dc3545',  # Red
            'pending': '#ffc107',   # Yellow
            'confirmed': '#28a745', # Green
            'rejected': '#dc3545',  # Red
            'draft': '#6c757d',     # Gray
            'sold': '#17a2b8',      # Blue
            'expired': '#dc3545',   # Red
            'cancelled': '#6c757d', # Gray
        }
        return status_colors.get(status, '#6c757d')
    
    def format_status(self, status, display_text=None):
        """Format status with color"""
        if not status:
            return '-'
        color = self.get_status_color(status)
        text = display_text or status
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, text
        )


class ExcelOperationsMixin:
    """Mixin for Excel upload/download functionality"""
    
    def get_excel_upload_button(self, obj, action_name, button_text):
        """Generate Excel upload button HTML"""
        if not obj or not obj.pk:
            return '-'
        
        upload_url = reverse(f'admin:{action_name}', args=[obj.pk])
        return format_html(
            '<a href="{}" class="button" style="background-color: #28a745; color: white; '
            'padding: 5px 10px; text-decoration: none; border-radius: 3px;">{}</a>',
            upload_url, button_text
        )
    
    def get_excel_download_button(self, obj, action_name, button_text):
        """Generate Excel download button HTML"""
        if not obj or not obj.pk:
            return '-'
        
        download_url = reverse(f'admin:{action_name}', args=[obj.pk])
        return format_html(
            '<a href="{}" class="button" style="background-color: #17a2b8; color: white; '
            'padding: 5px 10px; text-decoration: none; border-radius: 3px;">{}</a>',
            download_url, button_text
        )


class CustomFilteringMixin:
    """Mixin for custom queryset filtering"""
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """Customize foreign key field filtering"""
        # This can be overridden in specific admin classes
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


class BaseMarketplaceAdmin(admin.ModelAdmin, NumberFormattingMixin, StatusIndicatorMixin):
    """Base admin class for marketplace models"""
    
    list_per_page = 25
    save_on_top = True
    
    def get_readonly_fields(self, request, obj=None):
        """Common readonly fields for all marketplace admins"""
        readonly = list(super().get_readonly_fields(request, obj))
        if hasattr(self.model, 'created_at'):
            readonly.extend(['created_at', 'updated_at'])
        return readonly