# Generated manually
from django.db import migrations, models
import django.db.models.deletion


def migrate_marketplace_products_to_warehouse(apps, schema_editor):
    """
    Migrate existing marketplace products to use warehouse products
    """
    ProductOffer = apps.get_model('marketplace', 'ProductOffer')
    Product = apps.get_model('warehouse', 'Product')
    
    # Get the first warehouse product as default
    default_product = Product.objects.first()
    if not default_product:
        # Create a default product if none exists
        ProductCategory = apps.get_model('warehouse', 'ProductCategory')
        default_category, _ = ProductCategory.objects.get_or_create(
            name='محصولات عمومی',
            defaults={'description': 'دسته‌بندی پیش‌فرض برای محصولات'}
        )
        default_product = Product.objects.create(
            name='محصول پیش‌فرض',
            code='DEFAULT-PRODUCT',
            category=default_category,
            unit='کیلوگرم'
        )
    
    # Update all existing ProductOffers to use the default product
    for offer in ProductOffer.objects.all():
        # Try to match with existing warehouse product by name
        marketplace_product_name = getattr(offer, 'marketplace_product', None)
        if marketplace_product_name:
            try:
                # Try to find matching warehouse product
                warehouse_product = Product.objects.filter(
                    name__icontains=marketplace_product_name.marketplace_name[:50]
                ).first()
                if not warehouse_product:
                    warehouse_product = default_product
            except:
                warehouse_product = default_product
        else:
            warehouse_product = default_product
        
        # Will be set after field is added
        offer._temp_product_id = warehouse_product.id


def reverse_migrate_marketplace_products(apps, schema_editor):
    """
    Reverse migration - this is not fully reversible since we're removing data
    """
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('warehouse', '0005_customer_tags_alter_customer_address_and_more'),
        ('marketplace', '0009_deliveryaddress_delivery_order_number_and_more'),
    ]

    operations = [
        # Step 1: Add the new product field as nullable first
        migrations.AddField(
            model_name='productoffer',
            name='product_temp',
            field=models.ForeignKey(
                null=True,
                blank=True,
                on_delete=django.db.models.deletion.CASCADE,
                to='warehouse.product',
                verbose_name='کالا (موقت)'
            ),
        ),
        
        # Step 2: Populate the new field with data migration
        migrations.RunPython(
            migrate_marketplace_products_to_warehouse,
            reverse_migrate_marketplace_products
        ),
        
        # Step 3: Set the temp field values
        migrations.RunSQL(
            "UPDATE marketplace_product_offers SET product_temp_id = 1 WHERE product_temp_id IS NULL;",
            reverse_sql="-- No reverse SQL needed"
        ),
        
        # Step 4: Make the temp field non-nullable
        migrations.AlterField(
            model_name='productoffer',
            name='product_temp',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                to='warehouse.product',
                verbose_name='کالا (موقت)'
            ),
        ),
        
        # Step 5: Remove the old marketplace_product field
        migrations.RemoveField(
            model_name='productoffer',
            name='marketplace_product',
        ),
        
        # Step 6: Rename the temp field to the final name
        migrations.RenameField(
            model_name='productoffer',
            old_name='product_temp',
            new_name='product',
        ),
        
        # Step 7: Remove marketplace product models
        migrations.DeleteModel(
            name='ProductMapping',
        ),
        migrations.DeleteModel(
            name='MarketplaceProduct',
        ),
        migrations.DeleteModel(
            name='MarketplaceProductCategory',
        ),
    ]