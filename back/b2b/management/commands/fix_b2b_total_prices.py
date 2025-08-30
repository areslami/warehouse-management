from django.core.management.base import BaseCommand
from b2b.models.base import B2BSale, B2BAddress


class Command(BaseCommand):
    help = 'Fix B2B sales and addresses with total_price/unit_price = 0'

    def handle(self, *args, **options):
        # Fix B2B Sales with total_price = 0
        sales_updated = 0
        sales = B2BSale.objects.filter(total_price=0).exclude(weight=0).exclude(unit_price=0)
        
        for sale in sales:
            if sale.weight and sale.unit_price:
                sale.total_price = sale.weight * sale.unit_price
                sale.save()
                sales_updated += 1
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully updated {sales_updated} B2B sales with calculated total_price')
        )
        
        # Fix B2B Addresses with unit_price = 0
        addresses_updated = 0
        addresses = B2BAddress.objects.filter(unit_price=0).exclude(payment_amount=0).exclude(total_weight_purchased=0)
        
        for address in addresses:
            if address.payment_amount and address.total_weight_purchased:
                address.unit_price = address.payment_amount / address.total_weight_purchased
                address.save()
                addresses_updated += 1
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully updated {addresses_updated} B2B addresses with calculated unit_price')
        )