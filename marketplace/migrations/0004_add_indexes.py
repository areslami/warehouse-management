# Generated migration for adding indexes and optimizations

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('marketplace', '0003_marketplace_sales'),
    ]

    operations = [
        # اضافه کردن indexes برای بهبود performance
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_marketplace_sale_cottage ON marketplace_sales(cottage_number);",
            reverse_sql="DROP INDEX IF EXISTS idx_marketplace_sale_cottage;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_marketplace_purchase_buyer ON marketplace_purchases(buyer_national_id);",
            reverse_sql="DROP INDEX IF EXISTS idx_marketplace_purchase_buyer;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_delivery_address_assignment ON marketplace_delivery_addresses(assignment_id);",
            reverse_sql="DROP INDEX IF EXISTS idx_delivery_address_assignment;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_delivery_address_recipient ON marketplace_delivery_addresses(recipient_unique_id);",
            reverse_sql="DROP INDEX IF EXISTS idx_delivery_address_recipient;"
        ),
        
        # اضافه کردن composite indexes
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_marketplace_sale_offer_status ON marketplace_sales(product_offer_id, offer_status);",
            reverse_sql="DROP INDEX IF EXISTS idx_marketplace_sale_offer_status;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_purchase_date_type ON marketplace_purchases(purchase_date, purchase_type);",
            reverse_sql="DROP INDEX IF EXISTS idx_purchase_date_type;"
        ),
        
        # Index برای جستجوی سریع آدرس‌ها
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_delivery_address_search ON marketplace_delivery_addresses(province, city, buyer_name);",
            reverse_sql="DROP INDEX IF EXISTS idx_delivery_address_search;"
        ),
    ]