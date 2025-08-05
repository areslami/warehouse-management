from django.db import models

class ProductCategory(models.Model):
    name = models.CharField(max_length=100,null=False)
    description = models.CharField(max_length=255,null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
class ProductReigon(models.Model):
    name = models.CharField(max_length=100,null=False)
    description = models.CharField(max_length=255,null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
class Product(models.Model):
    name = models.CharField(max_length=100,null=False)
    code = models.CharField(max_length=100,null=False, unique=True)
    b2bcode = models.CharField(max_length=100,null=False)
    b2breigon =models.ForeignKey(ProductReigon,on_delete=models.SET_NULL, null=True)
    category = models.ForeignKey(ProductCategory,on_delete=models.SET_NULL, null=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} ({self.code})"