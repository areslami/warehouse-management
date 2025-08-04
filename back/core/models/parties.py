from django.db import models

class PartyType(models.TextChoices):
    INDIVIDUAL = 'Individual', 'Individual'
    CORPORATE = 'Corporate', 'Corporate'

    
class Supplier(models.Model):
    supplier_type = models.CharField(max_length=10, choices=PartyType.choices,null=False)
    
    # corporate
    company_name = models.CharField(max_length=200, blank=True)
    national_id = models.CharField(max_length=11, blank=True)
    
    # indicidual
    full_name = models.CharField(max_length=100, blank=True)
    personal_code = models.CharField(max_length=10, blank=True)
    
    
    economic_code = models.CharField(max_length=20)
    phone = models.CharField(max_length=20)
    address = models.TextField(blank=False)
    description = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
class Customer(models.Model):
    customer_type = models.CharField(max_length=10, choices=PartyType.choices,null=False)
    
    # corporate
    company_name = models.CharField(max_length=200, blank=True)
    national_id = models.CharField(max_length=11, blank=True)
    
    # indicidual
    full_name = models.CharField(max_length=100, blank=True)
    personal_code = models.CharField(max_length=10, blank=True)
    
    
    economic_code = models.CharField(max_length=20)
    phone = models.CharField(max_length=20)
    address = models.TextField(blank=False)
    description = models.TextField(blank=True)
    tags = models.CharField(max_length=200, blank=True)
    
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Reciever(models.Model):
    reciever_type = models.CharField(max_length=10, choices=PartyType.choices,null=False)
    system_id = models.CharField(max_length=50, unique=True)
    unique_id = models.CharField(max_length=50)
    
    # corporate
    company_name = models.CharField(max_length=200, blank=True)
    national_id = models.CharField(max_length=11, blank=True)
    
    # indicidual
    full_name = models.CharField(max_length=100, blank=True)
    personal_code = models.CharField(max_length=10, blank=True)
    
    
    economic_code = models.CharField(max_length=20)
    phone = models.CharField(max_length=20)
    address = models.TextField(blank=False)
    description = models.TextField(blank=True)
    postal_code = models.CharField(max_length=10,null=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)