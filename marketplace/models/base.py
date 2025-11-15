# marketplace/models/base.py
from django.db import models
from django_jalali.db.models import jDateTimeField


class TimestampMixin(models.Model):
    """Base mixin for timestamp fields"""
    created_at = jDateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')
    updated_at = jDateTimeField(auto_now=True, verbose_name='تاریخ ویرایش')
    
    class Meta:
        abstract = True


class StatusMixin(models.Model):
    """Base mixin for status fields"""
    is_active = models.BooleanField(default=True, verbose_name='فعال')
    
    class Meta:
        abstract = True