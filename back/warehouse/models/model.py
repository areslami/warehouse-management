from django.db import models


class Warehouse(models.Model):
    name = models.CharField(max_length=100, null=False)
    address = models.TextField(blank=False)
    manager = models.CharField(max_length=100, null=False)
    phone = models.CharField(max_length=20)
    description = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
class ShippingCompany(models.Model):
    name = models.CharField(max_length=200)
    contact_person = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    description = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)