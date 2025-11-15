from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=100,null=False)
    code = models.CharField(max_length=10,null=False, unique=True)
    b2bcode = models.CharField(max_length=10,null=False)
    b2bregion = models.CharField(max_length=10,null=False)
    category =  models.CharField(max_length=10,null=False)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} ({self.code})"