#!/usr/bin/env python
"""
Create authentic test data for Shams TK agricultural commodity trading ERP
Based on shamstk.com business model: Import/Export of agricultural products, legumes, oil seeds, animal feed
"""

import os
import django
from datetime import datetime, timedelta
import random
from decimal import Decimal

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'shams_erp.settings')
django.setup()

from core.models import ProductCategory, ProductRegion, Product, Supplier, Customer, Receiver
from warehouse.models import Warehouse, ShippingCompany, WarehouseReceipt, DispatchIssue, DeliveryFulfillment
from warehouse.models import WarehouseReceiptItem, DispatchIssueItem, DeliveryFulfillmentItem
from finance.models import PurchaseProforma, SalesProforma, PurchaseProformaLine, SalesProformaLine
from b2b.models import B2BOffer, B2BSale, B2BDistribution

print("🌾 Creating authentic agricultural commodity trading data...")

# === 1. PRODUCT CATEGORIES ===
print("📦 Creating product categories...")

categories = [
    {"name": "حبوبات", "description": "عدس، لوبیا، نخود و سایر حبوبات"},
    {"name": "دانه‌های روغنی", "description": "سویا، کلزا، آفتابگردان"},
    {"name": "غلات", "description": "ذرت، جو، گندم"},
    {"name": "خوراک دام", "description": "کنجاله سویا، ذرت علوفه‌ای، جو دامی"},
    {"name": "روغن‌ها", "description": "روغن آفتابگردان، سویا، کلزا"},
    {"name": "محصولات فرآوری شده", "description": "آرد، کنسانتره، مکمل‌های غذایی"}
]

category_objects = {}
for cat_data in categories:
    category = ProductCategory.objects.create(**cat_data)
    category_objects[cat_data["name"]] = category

# === 2. PRODUCT REGIONS ===
print("🌍 Creating product regions...")

regions = [
    {"name": "برزیل", "description": "تولیدکننده اصلی سویا و ذرت"},
    {"name": "آرژانتین", "description": "صادرکننده عمده غلات و حبوبات"},
    {"name": "اوکراین", "description": "تولیدکننده آفتابگردان و جو"},
    {"name": "کانادا", "description": "کلزا و عدس درجه یک"},
    {"name": "آمریکا", "description": "سویا و ذرت غیرتراریخته"},
    {"name": "هند", "description": "حبوبات و دانه‌های روغنی"},
    {"name": "ترکیه", "description": "آفتابگردان و کلزا"},
    {"name": "ایران", "description": "تولیدات داخلی و بسته‌بندی"}
]

region_objects = {}
for reg_data in regions:
    region = ProductRegion.objects.create(**reg_data)
    region_objects[reg_data["name"]] = region

# === 3. AUTHENTIC PRODUCTS ===
print("🌱 Creating agricultural products...")

products = [
    # حبوبات
    {"name": "عدس قرمز کانادایی", "code": "LR-CAN-001", "b2b_code": "LENTIL-RED-CA", "category": "حبوبات", "region": "کانادا", "description": "عدس قرمز درجه یک کانادایی، مناسب صادرات"},
    {"name": "عدس سبز فرانسوی", "code": "LG-FRA-002", "b2b_code": "LENTIL-GREEN-FR", "category": "حبوبات", "region": "کانادا", "description": "عدس سبز کیفیت بالا از فرانسه"},
    {"name": "لوبیا چیتی آرژانتینی", "code": "BP-ARG-003", "b2b_code": "BEAN-PINTO-AR", "category": "حبوبات", "region": "آرژانتین", "description": "لوبیا چیتی درجه A آرژانتین"},
    {"name": "نخود کابلی", "code": "CK-IND-004", "b2b_code": "CHICKPEA-KABULI", "category": "حبوبات", "region": "هند", "description": "نخود کابلی سایز 7-8 میلی‌متر"},
    
    # دانه‌های روغنی
    {"name": "سویای برزیلی غیرتراریخته", "code": "SB-BRA-005", "b2b_code": "SOYBEAN-NONGMO-BR", "category": "دانه‌های روغنی", "region": "برزیل", "description": "سویای غیرتراریخته برزیل، پروتئین بالای 38%"},
    {"name": "کلزای کانادایی", "code": "RC-CAN-006", "b2b_code": "RAPESEED-CANOLA-CA", "category": "دانه‌های روغنی", "region": "کانادا", "description": "دانه کلزا کانولا کیفیت صادراتی"},
    {"name": "آفتابگردان اوکراینی", "code": "SF-UKR-007", "b2b_code": "SUNFLOWER-SEED-UA", "category": "دانه‌های روغنی", "region": "اوکراین", "description": "دانه آفتابگردان روغنی درجه یک"},
    
    # غلات
    {"name": "ذرت دامی برزیلی", "code": "CF-BRA-008", "b2b_code": "CORN-FEED-BR", "category": "غلات", "region": "برزیل", "description": "ذرت علوفه‌ای کیفیت بالا برای دام"},
    {"name": "جو دوردانه اوکراینی", "code": "BD-UKR-009", "b2b_code": "BARLEY-2ROW-UA", "category": "غلات", "region": "اوکراین", "description": "جو دوردانه مناسب آبجوسازی و دام"},
    {"name": "گندم سخت آمریکایی", "code": "WH-USA-010", "b2b_code": "WHEAT-HARD-US", "category": "غلات", "region": "آمریکا", "description": "گندم سخت پروتئین بالا"},
    
    # خوراک دام
    {"name": "کنجاله سویا آرژانتینی", "code": "SM-ARG-011", "b2b_code": "SOYBEAN-MEAL-AR", "category": "خوراک دام", "region": "آرژانتین", "description": "کنجاله سویا 46% پروتئین"},
    {"name": "کنجاله آفتابگردان", "code": "SFM-UKR-012", "b2b_code": "SUNFLOWER-MEAL-UA", "category": "خوراک دام", "region": "اوکراین", "description": "کنجاله آفتابگردان 36% پروتئین"},
    
    # روغن‌ها
    {"name": "روغن سویای خام", "code": "SO-BRA-013", "b2b_code": "SOYBEAN-OIL-CRUDE", "category": "روغن‌ها", "region": "برزیل", "description": "روغن سویای خام صنعتی"},
    {"name": "روغن آفتابگردان تصفیه شده", "code": "SFO-UKR-014", "b2b_code": "SUNFLOWER-OIL-REF", "category": "روغن‌ها", "region": "اوکراین", "description": "روغن آفتابگردان تصفیه شده بسته‌بندی شده"},
    
    # محصولات فرآوری شده
    {"name": "آرد سویا کامل چرب", "code": "SFF-USA-015", "b2b_code": "SOY-FLOUR-FULL-FAT", "category": "محصولات فرآوری شده", "region": "آمریکا", "description": "آرد سویای کامل چرب برای تغذیه دام"},
    {"name": "مکمل پروتئینی دام", "code": "PS-IRN-016", "b2b_code": "PROTEIN-SUPPLEMENT", "category": "محصولات فرآوری شده", "region": "ایران", "description": "مکمل پروتئینی تولید داخل"}
]

product_objects = {}
for prod_data in products:
    category = category_objects[prod_data.pop("category")]
    region = region_objects[prod_data.pop("region")]
    product = Product.objects.create(
        category=category,
        b2b_region=region,
        **prod_data
    )
    product_objects[prod_data["name"]] = product

# === 4. SUPPLIERS (International) ===
print("🚢 Creating international suppliers...")

suppliers = [
    {
        "party_type": "Corporate",
        "company_name": "Cargill Trading Brazil",
        "national_id": "BR-CARGILL-001",
        "economic_code": "33.444.555/0001-66",
        "phone": "+55-11-3045-8000",
        "address": "São Paulo, Brazil, Av. Paulista 1234",
        "description": "بزرگترین تامین‌کننده سویا و ذرت برزیل"
    },
    {
        "party_type": "Corporate", 
        "company_name": "ADM Argentina S.A.",
        "national_id": "AR-ADM-002",
        "economic_code": "30-12345678-9",
        "phone": "+54-11-4000-3000",
        "address": "Buenos Aires, Argentina, Puerto Madero",
        "description": "صادرکننده حبوبات و غلات آرژانتین"
    },
    {
        "party_type": "Corporate",
        "company_name": "Bunge Ukraine Limited",
        "national_id": "UA-BUNGE-003", 
        "economic_code": "UA-31234567",
        "phone": "+380-44-590-7000",
        "address": "Kyiv, Ukraine, Podil District",
        "description": "تامین‌کننده آفتابگردان و جو اوکراین"
    },
    {
        "party_type": "Corporate",
        "company_name": "Richardson Pioneer Ltd",
        "national_id": "CA-RICH-004",
        "economic_code": "123456789RC0001", 
        "phone": "+1-204-934-5961",
        "address": "Winnipeg, Manitoba, Canada",
        "description": "صادرکننده کلزا و عدس کانادا"
    },
    {
        "party_type": "Corporate",
        "company_name": "Louis Dreyfus Company",
        "national_id": "US-LDC-005",
        "economic_code": "13-1234567",
        "phone": "+1-203-761-2000", 
        "address": "Wilton, Connecticut, USA",
        "description": "تاجر بزرگ کالاهای کشاورزی جهان"
    },
    {
        "party_type": "Individual",
        "full_name": "احمد حسینی",
        "personal_code": "0123456789",
        "economic_code": "1234567890",
        "phone": "09123456789",
        "address": "تهران، خیابان آزادی، پلاک 123",
        "description": "تامین‌کننده محلی محصولات کشاورزی"
    }
]

supplier_objects = []
for sup_data in suppliers:
    supplier = Supplier.objects.create(**sup_data)
    supplier_objects.append(supplier)

# === 5. CUSTOMERS (Domestic and Regional) ===
print("🏭 Creating customers...")

customers = [
    {
        "party_type": "Corporate",
        "company_name": "کارخانه خوراک دام البرز",
        "national_id": "14001234567",
        "economic_code": "1400123456789",
        "phone": "026-33445566",
        "address": "البرز، کرج، شهرک صنعتی کرج",
        "description": "تولیدکننده خوراک دام و طیور",
        "tags": "خوراک-دام,تولید,کارخانه"
    },
    {
        "party_type": "Corporate", 
        "company_name": "شرکت روغن‌سازی نیکان",
        "national_id": "14001234568",
        "economic_code": "1400123456790",
        "phone": "021-77889900",
        "address": "تهران، جنوب تهران، ناحیه صنعتی",
        "description": "تولید و تصفیه روغن‌های خوراکی",
        "tags": "روغن,تصفیه,خوراکی"
    },
    {
        "party_type": "Corporate",
        "company_name": "کمپانی تجاری بازرگان آسیا", 
        "national_id": "14001234569",
        "economic_code": "1400123456791",
        "phone": "021-44556677",
        "address": "تهران، میدان تجریش، برج تجارت",
        "description": "صادرکننده محصولات کشاورزی به عراق و افغانستان",
        "tags": "صادرات,بازرگانی,منطقه‌ای"
    },
    {
        "party_type": "Corporate",
        "company_name": "مجتمع کشاورزی گلستان",
        "national_id": "14001234570", 
        "economic_code": "1400123456792",
        "phone": "0173-3221100",
        "address": "گلستان، گنبد کاووس، کیلومتر 15 جاده آق‌قلا",
        "description": "مجتمع بزرگ کشاورزی و دامداری",
        "tags": "کشاورزی,دامداری,تولید"
    },
    {
        "party_type": "Individual",
        "full_name": "حسن کریمی",
        "personal_code": "0987654321", 
        "economic_code": "0987654321098",
        "phone": "09121234567",
        "address": "اصفهان، چهارباغ عباسی، پلاک 456",
        "description": "تاجر محلی حبوبات",
        "tags": "حبوبات,محلی"
    },
    {
        "party_type": "Corporate",
        "company_name": "Baghdad Trading LLC",
        "national_id": "IQ-BT-001",
        "economic_code": "IQ-123456789",
        "phone": "+964-1-7123456",
        "address": "Baghdad, Iraq, Al-Mansour District",
        "description": "واردکننده محصولات غذایی در عراق",
        "tags": "عراق,واردات,غذایی"
    }
]

customer_objects = []
for cust_data in customers:
    customer = Customer.objects.create(**cust_data)
    customer_objects.append(customer)

# === 6. RECEIVERS ===
print("📦 Creating receivers...")

receivers = [
    {
        "party_type": "Corporate",
        "system_id": "REC-001",
        "unique_id": "ALBORZ-FEED-001",
        "company_name": "کارخانه خوراک دام البرز",
        "national_id": "14001234567", 
        "economic_code": "1400123456789",
        "phone": "026-33445566",
        "address": "البرز، کرج، شهرک صنعتی کرج، واحد 15",
        "postal_code": "3144811111",
        "description": "انبار دریافت خوراک دام"
    },
    {
        "party_type": "Corporate",
        "system_id": "REC-002", 
        "unique_id": "NIKAN-OIL-002",
        "company_name": "شرکت روغن‌سازی نیکان",
        "national_id": "14001234568",
        "economic_code": "1400123456790", 
        "phone": "021-77889900",
        "address": "تهران، جنوب تهران، ناحیه صنعتی، کارخانه شماره 3",
        "postal_code": "1234567890",
        "description": "واحد دریافت مواد اولیه روغن"
    },
    {
        "party_type": "Individual",
        "system_id": "REC-003",
        "unique_id": "HASSAN-KARIMI",
        "full_name": "حسن کریمی",
        "personal_code": "0987654321",
        "economic_code": "0987654321098",
        "phone": "09121234567",
        "address": "اصفهان، چهارباغ عباسی، انبار شخصی پلاک 456",
        "postal_code": "8144711111", 
        "description": "انبار شخصی تاجر حبوبات"
    }
]

receiver_objects = []
for rec_data in receivers:
    receiver = Receiver.objects.create(**rec_data)
    receiver_objects.append(receiver)

# === 7. WAREHOUSES ===
print("🏢 Creating warehouses...")

warehouses = [
    {
        "name": "انبار مرکزی تهران",
        "address": "تهران، شهرک صنعتی شمس آباد، خیابان صنعت، پلاک 25",
        "manager": "علی احمدی",
        "phone": "021-55667788",
        "description": "انبار اصلی شرکت با ظرفیت 10000 تن"
    },
    {
        "name": "انبار بندر امام خمینی",
        "address": "خوزستان، بندر امام خمینی، منطقه ویژه اقتصادی، انبار 15",
        "manager": "محمد رضایی", 
        "phone": "061-52334455",
        "description": "انبار دریافت کالاهای وارداتی از بندر"
    },
    {
        "name": "انبار توزیع مشهد",
        "address": "خراسان رضوی، مشهد، شهرک صنعتی توس، واحد 8",
        "manager": "رضا موسوی",
        "phone": "051-37889900", 
        "description": "انبار توزیع منطقه شمال شرق کشور"
    },
    {
        "name": "انبار اصفهان",
        "address": "اصفهان، نجف آباد، شهرک صنعتی، بلوار صنعت، پلاک 120",
        "manager": "حسین کریمی",
        "phone": "031-42556677",
        "description": "انبار توزیع منطقه مرکزی ایران"
    }
]

warehouse_objects = []
for ware_data in warehouses:
    warehouse = Warehouse.objects.create(**ware_data)
    warehouse_objects.append(warehouse)

# === 8. SHIPPING COMPANIES ===
print("🚚 Creating shipping companies...")

shipping_companies = [
    {
        "name": "شرکت حمل‌ونقل پیشرو",
        "contact_person": "احمد نوری",
        "phone": "021-44332211",
        "email": "info@pishro-transport.com",
        "address": "تهران، اتوبان کرج، کیلومتر 15، ترمینال باری",
        "description": "متخصص در حمل محصولات کشاورزی"
    },
    {
        "name": "باربری سریع شرق",
        "contact_person": "علی زارعی", 
        "phone": "051-36778899",
        "email": "contact@shargh-express.ir",
        "address": "مشهد، بلوار وکیل آباد، مجتمع باربری شرق",
        "description": "حمل‌ونقل سریع به شرق کشور"
    },
    {
        "name": "حمل دریایی خلیج فارس",
        "contact_person": "محسن بحری",
        "phone": "061-33445566", 
        "email": "info@persian-gulf-shipping.com",
        "address": "اهواز، بندر امام، منطقه بندری، ساختمان 12",
        "description": "حمل‌ونقل دریایی و ترانزیت"
    }
]

shipping_company_objects = []
for ship_data in shipping_companies:
    shipping_company = ShippingCompany.objects.create(**ship_data)
    shipping_company_objects.append(shipping_company)

# === 9. PURCHASE PROFORMAS ===
print("💰 Creating purchase proformas...")

purchase_proformas = []
for i in range(6):
    date = datetime.now().date() - timedelta(days=random.randint(1, 90))
    supplier = random.choice(supplier_objects)
    
    proforma = PurchaseProforma.objects.create(
        serial_number=f"PP-{1400 + i}-{random.randint(1000, 9999):04d}",
        date=date,
        supplier=supplier,
        subtotal=Decimal("0"),
        tax=Decimal("0.09"),  # 9% tax
        discount=Decimal("0"),
        final_price=Decimal("0")
    )
    
    # Add lines to proforma
    num_lines = random.randint(1, 4)
    subtotal = Decimal("0")
    
    for j in range(num_lines):
        product = random.choice(list(product_objects.values()))
        weight = Decimal(random.randint(100, 2000))
        unit_price = Decimal(random.randint(500, 5000))
        total_price = weight * unit_price
        
        PurchaseProformaLine.objects.create(
            proforma=proforma,
            product=product,
            weight=weight,
            unit_price=unit_price,
            total_price=total_price
        )
        
        subtotal += total_price
    
    # Update proforma totals
    proforma.subtotal = subtotal
    proforma.final_price = subtotal * (Decimal("1") + proforma.tax)
    proforma.save()
    
    purchase_proformas.append(proforma)

# === 10. SALES PROFORMAS ===
print("💵 Creating sales proformas...")

sales_proformas = []
for i in range(8):
    date = datetime.now().date() - timedelta(days=random.randint(1, 60))
    customer = random.choice(customer_objects)
    
    payment_types = ["cash", "credit", "other"]
    payment_type = random.choice(payment_types)
    
    proforma = SalesProforma.objects.create(
        serial_number=f"SP-{1400 + i}-{random.randint(1000, 9999):04d}",
        date=date,
        customer=customer,
        payment_type=payment_type,
        payment_description=f"پرداخت {payment_type} برای {customer.company_name or customer.full_name}",
        subtotal=Decimal("0"),
        tax=Decimal("0.09"),
        discount=Decimal(random.randint(0, 500000)),
        final_price=Decimal("0")
    )
    
    # Add lines to proforma
    num_lines = random.randint(1, 3)
    subtotal = Decimal("0")
    
    for j in range(num_lines):
        product = random.choice(list(product_objects.values()))
        weight = Decimal(random.randint(50, 1000))
        unit_price = Decimal(random.randint(600, 8000))  # Higher selling price
        total_price = weight * unit_price
        
        SalesProformaLine.objects.create(
            proforma=proforma,
            product=product,
            weight=weight,
            unit_price=unit_price,
            total_price=total_price
        )
        
        subtotal += total_price
    
    # Update proforma totals
    proforma.subtotal = subtotal
    final_before_tax = subtotal - proforma.discount
    proforma.final_price = final_before_tax * (Decimal("1") + proforma.tax)
    proforma.save()
    
    sales_proformas.append(proforma)

# === 11. WAREHOUSE RECEIPTS ===
print("📋 Creating warehouse receipts...")

receipt_types = ["purchase", "import", "distribution"]
for i in range(12):
    date = datetime.now().date() - timedelta(days=random.randint(1, 45))
    warehouse = random.choice(warehouse_objects)
    receipt_type = random.choice(receipt_types)
    proforma = random.choice(purchase_proformas) if random.choice([True, False]) else None
    
    receipt = WarehouseReceipt.objects.create(
        receipt_id=f"WR-{date.strftime('%Y%m%d')}-{random.randint(100, 999):03d}",
        receipt_type=receipt_type,
        date=date,
        warehouse=warehouse,
        description=f"دریافت {receipt_type} - {warehouse.name}",
        cottage_serial_number=f"CS-{random.randint(10000, 99999)}" if receipt_type == "import" else None,
        proforma=proforma,
        total_weight=Decimal("0")
    )
    
    # Add items
    num_items = random.randint(1, 4)
    total_weight = Decimal("0")
    
    for j in range(num_items):
        product = random.choice(list(product_objects.values()))
        weight = Decimal(random.randint(100, 2000))
        
        WarehouseReceiptItem.objects.create(
            receipt=receipt,
            product=product,
            weight=weight
        )
        
        total_weight += weight
    
    receipt.total_weight = total_weight
    receipt.save()

# === 12. DISPATCH ISSUES ===
print("🚛 Creating dispatch issues...")

for i in range(10):
    issue_date = datetime.now().date() - timedelta(days=random.randint(1, 30))
    validity_date = issue_date + timedelta(days=random.randint(7, 30))
    warehouse = random.choice(warehouse_objects)
    sales_proforma = random.choice(sales_proformas)
    shipping_company = random.choice(shipping_company_objects)
    
    dispatch = DispatchIssue.objects.create(
        dispatch_id=f"DI-{issue_date.strftime('%Y%m%d')}-{random.randint(100, 999):03d}",
        issue_date=issue_date,
        validity_date=validity_date,
        warehouse=warehouse,
        sales_proforma=sales_proforma,
        shipping_company=shipping_company,
        description=f"حواله برای {sales_proforma.customer.company_name or sales_proforma.customer.full_name}",
        total_weight=Decimal("0")
    )
    
    # Add items
    num_items = random.randint(1, 3)
    total_weight = Decimal("0")
    
    for j in range(num_items):
        product = random.choice(list(product_objects.values()))
        weight = Decimal(random.randint(50, 1500))
        receiver = random.choice(receiver_objects)
        vehicle_types = ["truck", "pickup", "van", "container", "other"]
        
        DispatchIssueItem.objects.create(
            dispatch=dispatch,
            product=product,
            weight=weight,
            vehicle_type=random.choice(vehicle_types),
            receiver=receiver
        )
        
        total_weight += weight
    
    dispatch.total_weight = total_weight
    dispatch.save()

# === 13. DELIVERY FULFILLMENTS ===
print("🚚 Creating delivery fulfillments...")

for i in range(8):
    issue_date = datetime.now().date() - timedelta(days=random.randint(1, 20))
    validity_date = issue_date + timedelta(days=random.randint(5, 15))
    warehouse = random.choice(warehouse_objects)
    sales_proforma = random.choice(sales_proformas)
    shipping_company = random.choice(shipping_company_objects)
    
    delivery = DeliveryFulfillment.objects.create(
        delivery_id=f"DF-{issue_date.strftime('%Y%m%d')}-{random.randint(100, 999):03d}",
        issue_date=issue_date,
        validity_date=validity_date,
        warehouse=warehouse,
        sales_proforma=sales_proforma,
        shipping_company=shipping_company,
        description=f"تحویل کالا برای {sales_proforma.customer.company_name or sales_proforma.customer.full_name}",
        total_weight=Decimal("0")
    )
    
    # Add items
    num_items = random.randint(1, 3)
    total_weight = Decimal("0")
    
    for j in range(num_items):
        product = random.choice(list(product_objects.values()))
        weight = Decimal(random.randint(50, 1000))
        receiver = random.choice(receiver_objects)
        vehicle_types = ["truck", "pickup", "van", "container", "other"]
        
        DeliveryFulfillmentItem.objects.create(
            delivery=delivery,
            shipment_id=f"SH-{random.randint(1000, 9999)}",
            shipment_price=Decimal(random.randint(500000, 2000000)),
            product=product,
            weight=weight,
            vehicle_type=random.choice(vehicle_types),
            receiver=receiver
        )
        
        total_weight += weight
    
    delivery.total_weight = total_weight
    delivery.save()

# === 14. B2B DATA ===
print("🌐 Creating B2B data...")

# B2B Offers
for i in range(6):
    product = random.choice(list(product_objects.values()))
    warehouse_receipt = WarehouseReceipt.objects.order_by('?').first()
    
    offer = B2BOffer.objects.create(
        offer_id=f"B2B-OFFER-{random.randint(10000, 99999)}",
        product=product,
        warehouse_receipt=warehouse_receipt,
        offer_weight=Decimal(random.randint(100, 1000)),
        offer_price=Decimal(random.randint(5000000, 50000000)),
        status=random.choice(["Active", "Pending", "Sold", "Expired"]),
        description=f"عرضه {product.name} در بازارگاه B2B"
    )

# B2B Sales  
for i in range(4):
    customer = random.choice(customer_objects)
    sales_proforma = random.choice(sales_proformas)
    
    sale = B2BSale.objects.create(
        sale_id=f"B2B-SALE-{random.randint(10000, 99999)}",
        customer=customer,
        sales_proforma=sales_proforma,
        sale_weight=Decimal(random.randint(50, 500)),
        sale_price=Decimal(random.randint(3000000, 30000000)),
        status=random.choice(["pending", "confirmed", "shipped", "delivered"]),
        description=f"فروش B2B به {customer.company_name or customer.full_name}"
    )

# B2B Distributions
for i in range(5):
    customer = random.choice(customer_objects)
    
    distribution = B2BDistribution.objects.create(
        distribution_id=f"B2B-DIST-{random.randint(10000, 99999)}",
        customer=customer,
        distribution_weight=Decimal(random.randint(200, 2000)),
        distribution_price=Decimal(random.randint(10000000, 100000000)),
        status=random.choice(["active", "processing", "shipped", "completed"]),
        description=f"توزیع از طریق عامل {customer.company_name or customer.full_name}"
    )

print("✅ Authentic agricultural commodity trading data created successfully!")
print(f"""
📊 DATA SUMMARY:
🏷️  Product Categories: {ProductCategory.objects.count()}
🌍 Product Regions: {ProductRegion.objects.count()}
🌱 Products: {Product.objects.count()}
🚢 Suppliers: {Supplier.objects.count()}
🏭 Customers: {Customer.objects.count()}
📦 Receivers: {Receiver.objects.count()}
🏢 Warehouses: {Warehouse.objects.count()}
🚚 Shipping Companies: {ShippingCompany.objects.count()}
💰 Purchase Proformas: {PurchaseProforma.objects.count()}
💵 Sales Proformas: {SalesProforma.objects.count()}
📋 Warehouse Receipts: {WarehouseReceipt.objects.count()}
🚛 Dispatch Issues: {DispatchIssue.objects.count()}
🚚 Delivery Fulfillments: {DeliveryFulfillment.objects.count()}
🌐 B2B Offers: {B2BOffer.objects.count()}
🌐 B2B Sales: {B2BSale.objects.count()}
🌐 B2B Distributions: {B2BDistribution.objects.count()}

🎉 Ready for authentic agricultural commodity trading operations!
""")