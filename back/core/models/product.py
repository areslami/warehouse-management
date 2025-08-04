from django.db import models

class ProductCategory(models.Model):
    name = models.CharField(max_length=100,null=False)
    description = models.CharField(max_length=255,null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
class ProductReigon(models.Model):
    name = models.CharField(max_length=100,null=False)
    description = models.CharField(max_length=255,null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
class Product(models.Model):
    name = models.CharField(max_length=100,null=False)
    code = models.CharField(max_length=100,null=False)
    b2bcode = models.CharField(max_length=100,null=False)
    b2breigon =models.ForeignKey(ProductReigon,on_delete=models.SET_NULL)
    category = models.ForeignKey(ProductCategory,on_delete=models.SET_NULL)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)