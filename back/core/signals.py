from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache
from .models import ProductCategory, ProductReigon, Product, Supplier, Customer, Reciever

@receiver(post_save, sender=ProductCategory)
@receiver(post_delete, sender=ProductCategory)
def clear_productcategory_cache(sender, instance, **kwargs):
    cache.delete('product_categories')
    cache.delete(f'product_category_{instance.pk}')

@receiver(post_save, sender=ProductReigon)
@receiver(post_delete, sender=ProductReigon)
def clear_productregion_cache(sender, instance, **kwargs):
    cache.delete('product_regions')
    cache.delete(f'product_region_{instance.pk}')

@receiver(post_save, sender=Product)
@receiver(post_delete, sender=Product)
def clear_product_cache(sender, instance, **kwargs):
    cache.delete('products')
    cache.delete(f'product_{instance.pk}')

@receiver(post_save, sender=Supplier)
@receiver(post_delete, sender=Supplier)
def clear_supplier_cache(sender, instance, **kwargs):
    cache.delete('suppliers')
    cache.delete(f'supplier_{instance.pk}')

@receiver(post_save, sender=Customer)
@receiver(post_delete, sender=Customer)
def clear_customer_cache(sender, instance, **kwargs):
    cache.delete('customers')
    cache.delete(f'customer_{instance.pk}')

@receiver(post_save, sender=Reciever)
@receiver(post_delete, sender=Reciever)
def clear_reciever_cache(sender, instance, **kwargs):
    cache.delete('recievers')
    cache.delete(f'reciever_{instance.pk}')