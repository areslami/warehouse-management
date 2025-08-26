from django.db import models

class PartyType(models.TextChoices):
    INDIVIDUAL = 'Individual', 'Individual'
    CORPORATE = 'Corporate', 'Corporate'

    
class Supplier(models.Model):
    supplier_type = models.CharField(max_length=10, choices=PartyType.choices,null=False)
    
    # corporate
    company_name = models.CharField(max_length=200, blank=True)
    national_id = models.CharField(max_length=11, blank=True, null=True, unique=True)
    
    # indicidual
    full_name = models.CharField(max_length=100, blank=True)
    personal_code = models.CharField(max_length=11, blank=True, null=True, unique=True)
    
    
    economic_code = models.CharField(max_length=20, unique=True)
    phone = models.CharField(max_length=20)
    address = models.TextField(blank=False)
    description = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        if self.supplier_type == PartyType.CORPORATE:
            return f"{self.company_name} ({self.economic_code})"
        return f"{self.full_name} ({self.economic_code})"

class Customer(models.Model):
    customer_type = models.CharField(max_length=10, choices=PartyType.choices,null=False)
    
    # corporate
    company_name = models.CharField(max_length=200, blank=True)
    national_id = models.CharField(max_length=11, blank=True, null=True, unique=True)
    
    # indicidual
    full_name = models.CharField(max_length=100, blank=True)
    personal_code = models.CharField(max_length=11, blank=True, null=True, unique=True)
    
    
    economic_code = models.CharField(max_length=20, unique=True)
    phone = models.CharField(max_length=20)
    address = models.TextField(blank=False)
    postal_code = models.CharField(max_length=10,null=False)
    description = models.TextField(blank=True)
    tags = models.CharField(max_length=200, blank=True)
    
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        if self.customer_type == PartyType.CORPORATE:
            return f"{self.company_name} ({self.economic_code})"
        return f"{self.full_name} ({self.economic_code})"


RECEIVER_VEICHLE_TYPES = [
    ('single', 'single'),
    ('double', 'double'),
    ('trailer', 'trailer'),
]
    
class Receiver(models.Model):
    receiver_type = models.CharField(max_length=10, choices=PartyType.choices,null=False)
    receiver_veichle_type = models.CharField(max_length =20,choices=RECEIVER_VEICHLE_TYPES,null=False)
    unique_id = models.CharField(max_length=50)
    
    # corporate
    company_name = models.CharField(max_length=200, blank=True)
    national_id = models.CharField(max_length=11, blank=True, null=True, unique=True)
    
    # indicidual
    full_name = models.CharField(max_length=100, blank=True)
    personal_code = models.CharField(max_length=11, blank=True, null=True, unique=True)
    
    
    economic_code = models.CharField(max_length=20, unique=True)
    phone = models.CharField(max_length=20)
    address = models.TextField(blank=False)
    description = models.TextField(blank=True)
    postal_code = models.CharField(max_length=10,null=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        if self.receiver_type == PartyType.CORPORATE:
            return f"{self.company_name} ({self.economic_code})"
        return f"{self.full_name} ({self.economic_code})"