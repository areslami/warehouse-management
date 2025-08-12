#!/usr/bin/env python
import os
import sys
import django

# Setup Django
sys.path.append('/Users/alihamedi/Desktop/shams-erp/back')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'erp_backend.settings')
django.setup()

from datetime import datetime, date, timedelta
from decimal import Decimal
from core.models import ProductCategory, ProductRegion, Product, Supplier, Customer, Receiver
from warehouse.models import Warehouse, ShippingCompany, WarehouseReceipt, WarehouseReceiptItem, DispatchIssue, DispatchIssueItem, DeliveryFulfillment, DeliveryItem
from finance.models import PurchaseProforma, PurchaseProformaLine, SalesProforma, SalesProformaLine
from b2b.models import B2BOffer

def create_dummy_data():
    print("Creating dummy data...")
    
    # Product Categories
    categories = [
        ProductCategory.objects.create(name="برنج", description="انواع برنج ایرانی و خارجی"),
        ProductCategory.objects.create(name="حبوبات", description="لوبیا، عدس، نخود و..."),
        ProductCategory.objects.create(name="روغن", description="روغن نباتی، زیتون و...")
    ]
    print("✓ Created product categories")

    # Product Regions  
    regions = [
        ProductRegion.objects.create(name="شمال", description="استان‌های شمالی"),
        ProductRegion.objects.create(name="مرکز", description="استان‌های مرکزی"),
        ProductRegion.objects.create(name="جنوب", description="استان‌های جنوبی")
    ]
    print("✓ Created product regions")

    # Products
    products = [
        Product.objects.create(name="برنج طارم", code="R001", b2bcode="B2B-R001", category=categories[0], b2bregion=regions[0]),
        Product.objects.create(name="برنج دمسیاه", code="R002", b2bcode="B2B-R002", category=categories[0], b2bregion=regions[0]),
        Product.objects.create(name="لوبیا قرمز", code="B001", b2bcode="B2B-B001", category=categories[1], b2bregion=regions[1]),
        Product.objects.create(name="عدس قرمز", code="L001", b2bcode="B2B-L001", category=categories[1], b2bregion=regions[1]),
        Product.objects.create(name="روغن آفتابگردان", code="O001", b2bcode="B2B-O001", category=categories[2], b2bregion=regions[2])
    ]
    print("✓ Created products")

    # Suppliers
    suppliers = [
        Supplier.objects.create(
            supplier_type='Corporate',
            company_name='شرکت کشاورزی شمال',
            national_id='14005678901',
            economic_code='EC001',
            phone='02133445566',
            address='تهران، خیابان ولیعصر، پلاک 123',
            description='تامین کننده برنج شمال'
        ),
        Supplier.objects.create(
            supplier_type='Individual',
            full_name='احمد رضایی',
            personal_code='0481234567',
            economic_code='EC002', 
            phone='09123456789',
            address='گیلان، رشت، خیابان امام خمینی',
            description='کشاورز برنج'
        ),
        Supplier.objects.create(
            supplier_type='Corporate',
            company_name='شرکت حبوبات ایران',
            national_id='14009876543',
            economic_code='EC003',
            phone='02144556677',
            address='تهران، بازار بزرگ، راسته حبوبات',
            description='عمده فروش حبوبات'
        )
    ]
    print("✓ Created suppliers")

    # Customers
    customers = [
        Customer.objects.create(
            customer_type='Corporate',
            company_name='فروشگاه زنجیره‌ای پارس',
            national_id='14001112223',
            economic_code='CU001',
            phone='02155667788',
            address='تهران، میدان تجریش',
            description='زنجیره فروشگاه‌های بزرگ',
            tags='زنجیره‌ای، عمده'
        ),
        Customer.objects.create(
            customer_type='Individual',
            full_name='فاطمه احمدی',
            personal_code='0480987654',
            economic_code='CU002',
            phone='09121234567',
            address='تهران، منطقه 2، خیابان شریعتی',
            description='مشتری خرده',
            tags='خرده، منظم'
        ),
        Customer.objects.create(
            customer_type='Corporate',
            company_name='رستوران‌های طلایی',
            national_id='14005555444',
            economic_code='CU003',
            phone='02166778899',
            address='تهران، سعادت آباد',
            description='زنجیره رستوران',
            tags='رستوران، تجاری'
        )
    ]
    print("✓ Created customers")

    # Receivers
    receivers = [
        Receiver.objects.create(
            receiver_type='Corporate',
            system_id='SYS001',
            unique_id='UNQ001',
            company_name='شرکت حمل و نقل سریع',
            national_id='14007778888',
            economic_code='RC001',
            phone='02177889900',
            address='تهران، اتوبان کرج، کیلومتر 15',
            postal_code='1234567890',
            description='شرکت حمل و نقل'
        ),
        Receiver.objects.create(
            receiver_type='Individual',
            system_id='SYS002',
            unique_id='UNQ002',
            full_name='علی محمدی',
            personal_code='0481111222',
            economic_code='RC002',
            phone='09131234567',
            address='اصفهان، خیابان چهارباغ',
            postal_code='8134567890',
            description='مشتری اصفهان'
        )
    ]
    print("✓ Created receivers")

    # Warehouses  
    warehouses = [
        Warehouse.objects.create(
            name='انبار مرکزی تهران',
            address='تهران، شهرک صنعتی پرند',
            manager='مهندس حسینی',
            phone='02133445577',
            description='انبار اصلی شرکت'
        ),
        Warehouse.objects.create(
            name='انبار شعبه اصفهان',
            address='اصفهان، شهرک صنعتی مجلسی',
            manager='آقای رحمانی',
            phone='03133445588',
            description='انبار منطقه مرکزی'
        )
    ]
    print("✓ Created warehouses")

    # Shipping Companies
    shipping_companies = [
        ShippingCompany.objects.create(
            name='باربری سریع',
            phone='02144556699',
            address='تهران، بازار بزرگ',
            description='حمل کالای سنگین'
        ),
        ShippingCompany.objects.create(
            name='حمل و نقل پیک',
            phone='09121122334',
            address='تهران، میدان انقلاب',
            description='حمل سریع'
        )
    ]
    print("✓ Created shipping companies")

    # Purchase Proformas
    purchase_proformas = []
    for i, supplier in enumerate(suppliers[:2]):
        proforma = PurchaseProforma.objects.create(
            serial_number=f'PP-2025-00{i+1}',
            supplier=supplier,
            date=date.today() - timedelta(days=i*10)
        )
        
        # Add lines to proforma
        PurchaseProformaLine.objects.create(
            proforma=proforma,
            product=products[i],
            weight=Decimal('1000.00'),
            unit_price=Decimal('25000.00'),
            tax=Decimal('2500.00'),
            discount=Decimal('500.00')
        )
        purchase_proformas.append(proforma)
    print("✓ Created purchase proformas")

    # Sales Proformas
    sales_proformas = []
    for i, customer in enumerate(customers[:2]):
        proforma = SalesProforma.objects.create(
            serial_number=f'SP-2025-00{i+1}',
            customer=customer,
            payment_type='cash' if i == 0 else 'credit',
            payment_description='پرداخت نقدی' if i == 0 else 'پرداخت 30 روزه',
            date=date.today() - timedelta(days=i*5)
        )
        
        # Add lines to proforma
        SalesProformaLine.objects.create(
            proforma=proforma,
            product=products[i],
            weight=Decimal('500.00'),
            unit_price=Decimal('30000.00'),
            tax=Decimal('3000.00'),
            discount=Decimal('1000.00')
        )
        sales_proformas.append(proforma)
    print("✓ Created sales proformas")

    # Warehouse Receipts
    warehouse_receipts = []
    for i, warehouse in enumerate(warehouses):
        receipt = WarehouseReceipt.objects.create(
            receipt_id=f'WR-2025-00{i+1}',
            receipt_type='purchase',
            date=datetime.now() - timedelta(days=i*7),
            warehouse=warehouse,
            proforma=purchase_proformas[i] if i < len(purchase_proformas) else None,
            description=f'رسید انبار شماره {i+1}',
            cottage_serial_number=f'COT-00{i+1}'
        )
        
        # Add items to receipt
        WarehouseReceiptItem.objects.create(
            warehouse_receipt=receipt,
            product=products[i],
            weight=Decimal('1000.00')
        )
        warehouse_receipts.append(receipt)
    print("✓ Created warehouse receipts")

    # B2B Offers
    for i, receipt in enumerate(warehouse_receipts):
        if i < len(products):
            B2BOffer.objects.create(
                offer_id=f'B2B-2025-00{i+1}',
                warehouse_receipt=receipt,
                product=products[i],
                offer_date=datetime.now() - timedelta(days=i*3),
                offer_exp_date=datetime.now() + timedelta(days=30-i*3),
                offer_weight=Decimal('500.00'),
                unit_price=Decimal('28000.00'),
                offer_type='cash',
                status='active' if i % 2 == 0 else 'pending',
                description=f'پیشنهاد فروش {products[i].name}'
            )
    print("✓ Created B2B offers")

    # Dispatch Issues
    for i, warehouse in enumerate(warehouses[:1]):  # Only create one
        dispatch = DispatchIssue.objects.create(
            dispatch_id=f'DI-2025-00{i+1}',
            warehouse=warehouse,
            issue_date=date.today() - timedelta(days=i*5),
            validity_date=date.today() + timedelta(days=30-i*5),
            receiver=receivers[i],
            description=f'حواله شماره {i+1}'
        )
        
        # Add items
        DispatchIssueItem.objects.create(
            dispatch_issue=dispatch,
            product=products[i],
            weight=Decimal('200.00')
        )
    print("✓ Created dispatch issues")

    # Delivery Fulfillments
    for i, warehouse in enumerate(warehouses[:1]):  # Only create one
        delivery = DeliveryFulfillment.objects.create(
            delivery_id=f'DF-2025-00{i+1}',
            warehouse=warehouse,
            issue_date=date.today() - timedelta(days=i*3),
            validity_date=date.today() + timedelta(days=15-i*3),
            shipping_company=shipping_companies[i],
            sales_proforma=sales_proformas[i] if i < len(sales_proformas) else None,
            description=f'تحویل شماره {i+1}'
        )
        
        # Add items
        DeliveryItem.objects.create(
            delivery_fulfillment=delivery,
            product=products[i],
            weight=Decimal('300.00')
        )
    print("✓ Created delivery fulfillments")

    print("\n🎉 Dummy data created successfully!")
    print("Summary:")
    print(f"- {len(categories)} Product Categories")
    print(f"- {len(regions)} Product Regions") 
    print(f"- {len(products)} Products")
    print(f"- {len(suppliers)} Suppliers")
    print(f"- {len(customers)} Customers")
    print(f"- {len(receivers)} Receivers")
    print(f"- {len(warehouses)} Warehouses")
    print(f"- {len(shipping_companies)} Shipping Companies")
    print(f"- {len(purchase_proformas)} Purchase Proformas")
    print(f"- {len(sales_proformas)} Sales Proformas")
    print(f"- {len(warehouse_receipts)} Warehouse Receipts")
    print(f"- {B2BOffer.objects.count()} B2B Offers")
    print(f"- {DispatchIssue.objects.count()} Dispatch Issues")
    print(f"- {DeliveryFulfillment.objects.count()} Delivery Fulfillments")

if __name__ == "__main__":
    create_dummy_data()