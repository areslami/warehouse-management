# Generated migration to link existing B2B sales to their sales proformas

from django.db import migrations


def link_sales_to_proformas(apps, schema_editor):
    """
    Link existing B2B sales (non-distributor) to their corresponding sales proformas.
    This is needed because the sales_proforma field was added after some sales were created.
    """
    B2BSale = apps.get_model('b2b', 'B2BSale')
    SalesProforma = apps.get_model('finance', 'SalesProforma')
    
    # Find all "your sales" (non-distributor) without a proforma link
    sales_without_proforma = B2BSale.objects.filter(
        is_distributor=False,
        sales_proforma__isnull=True
    )
    
    linked_count = 0
    
    for sale in sales_without_proforma:
        # Try to find a matching proforma by customer and total price
        matching_proformas = SalesProforma.objects.filter(
            customer=sale.customer,
            final_price=sale.total_price
        ).order_by('-created_at')
        
        if matching_proformas.exists():
            proforma = matching_proformas.first()
            
            # Check if this proforma is not already linked to another sale
            if not proforma.b2b_sales.exists():
                sale.sales_proforma = proforma
                sale.save(update_fields=['sales_proforma'])
                linked_count += 1
    
    if linked_count > 0:
        print(f"Linked {linked_count} existing B2B sales to their proformas")


def reverse_linking(apps, schema_editor):
    """Reverse the linking by setting sales_proforma to NULL for affected sales"""
    B2BSale = apps.get_model('b2b', 'B2BSale')
    
    # This is a data migration, reversing just clears the links
    B2BSale.objects.filter(
        is_distributor=False,
        sales_proforma__isnull=False
    ).update(sales_proforma=None)


class Migration(migrations.Migration):

    dependencies = [
        ('b2b', '0010_b2bsale_sales_proforma_alter_b2bsale_offer'),
        ('finance', '0001_initial'),  # Ensure finance app is migrated
    ]

    operations = [
        migrations.RunPython(link_sales_to_proformas, reverse_linking),
    ]
