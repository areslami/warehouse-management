# Excel field mappings for B2B Distribution
EXCEL_FIELD_MAPPING_DISTRIBUTION = {
    'transfer_id': 'شناسه انتقال',
    'customer_name': 'نام توزیع کننده',
    'warehouse_receipt_id': 'شماره رسید انبار',
    'sales_proforma_serial': 'سریال پیش فاکتور فروش',
    'agency_weight': 'وزن نمایندگی',
    'unit_price': 'قیمت واحد',
    'agency_date': 'تاریخ نمایندگی',
    'description': 'توضیحات',
}

# Excel field mappings for B2B Offer
EXCEL_FIELD_MAPPING_OFFER = {
    'offer_id': 'شناسه عرضه',
    'warehouse_receipt_id': 'شماره رسید انبار',
    'offer_weight': 'وزن عرضه',
    'unit_price': 'قیمت واحد',
    'status': 'وضعیت',
    'offer_type': 'نوع عرضه',
    'offer_date': 'تاریخ عرضه',
    'offer_exp_date': 'تاریخ انقضای عرضه',
    'description': 'توضیحات',
}

# Excel field mappings for B2B Sale
EXCEL_FIELD_MAPPING_SALE = {
    'purchase_id': 'شناسه خرید',
    'is_distributor': 'فروش توزیع کننده',
    'offer_id': 'شناسه عرضه',
    'distribution_id': 'شناسه توزیع',
    'product_name': 'عنوان کالا',
    'customer_name': 'نام خریدار',
    'weight': 'وزن',
    'unit_price': 'قیمت واحد',
    'total_price': 'مبلغ کل',
    'sale_date': 'تاریخ فروش',
    'purchase_type': 'نوع پرداخت',
    'description': 'توضیحات',
}
EXCEL_FIELD_MAPPING_ADDRESS = {
    "purchase_id": "کد",
    "total_weight_purchased": "وزن کل خرید",
    "purchase_date": "تاریخ خرید",
    "unit_price": "قیمت هر واحد",
    "tracking_number": "شماره پیگیری",
    "province": "استان",
    "city": "شهرستان",
    "payment_amount": "مبلغ پرداختی",
    "customoer_account_number": "شماره حساب خریدار",
    "cottage_code": "کد کوتاژ",
    "product_title": "عنوان کالا",
    "description": "توضیحات",
    "payment_method": "شیوه پرداخت",
    "offer_id": "شناسه عرضه",
    "address_register_date": "تاریخ ثبت آدرس",
    "allocation_id": "شناسه تخصیص",
    "customer_name": "نام خریدار",
    "customer_national_code": "شناسه ملی خریدار",
    "customer_postal_code": "کدپستی خریدار",
    "customer_address": "آدرس خریدار",
    "deposit_id": "شناسه واریز",
    "customer_phone": "شماره همراه خریدار",
    "customer_economic_code": "شناسه یکتا خریدار",
    "customer_type": "نوع کاربری خریدار",
    "receiver_name": "نام تحویل گیرنده",
    "receiver_economic_code": "شناسه یکتای تحویل",
    "single": "تک",
    "double": "جفت",
    "trailer": "تریلی",
    "receiver_address": "آدرس تحویل",
    "receiver_postal_code": "کد پستی تحویل",
    "receiver_phone": "شماره هماهنگی تحویل",
    "receiver_national_id": "کد ملی تحویل",
    "purchase_weight": "وزن سفارش",
    "waybilled_weight": "وزن بارنامه شده",
    "non_waybilled_weight": "وزن بارنامه نشده",
}

for i in range(1, 4):
    EXCEL_FIELD_MAPPING_ADDRESS[
        f'agreement_period_{i}'] = f'بازه {i} پرداخت توافقی (روز)'
    EXCEL_FIELD_MAPPING_ADDRESS[f'agreement_amount_{i}'] = f'مبلغ بازه {i} توافقی-ریال'
for i in range(1, 4):
    EXCEL_FIELD_MAPPING_SALE[f'credit_period_{i}'] = f'بازه پرداخت نسیه {i}'
    EXCEL_FIELD_MAPPING_SALE[f'credit_amount_{i}'] = f'مبلغ بازه پرداخت نسیه {i}'

EXCEL_FIELD_MAPPING_YOUR_SALE = {
    "purchase_id": "شناسه خرید",
    "cottage_number": "شماره کوتاژ",
    "description": "توضیحات",
    "total_weight_purchased": "وزن خرید شده-Kg",
    "province": "استان",
    "purchase_date": "تاریخ خرید",
    "payment_amount": "مبلغ پرداختی-ریال",
    "unit_price": "قیمت هر واحد-ریال",
    "delivery_date": "تاریخ تحویل",
    "tracking_number": "شماره پیگیری",
    "document_date": "تاریخ ثبت سند",
    "product_title": "عنوان کالا",
    "customer_national_code": "کد ملی خریدار",
    "customer_account_number": "شماره حساب خریدار",
    "customer_phone": "شماره همراه خریدار",
    "customer_name": "نام خریدار",
    "payment_method": "شیوه پرداخت",
    "offer_id": "شناسه عرضه",
}

for i in range(1, 4):
    EXCEL_FIELD_MAPPING_YOUR_SALE[
        f'agreement_period_{i}'] = f'بازه {i} پرداخت توافقی (روز)'
    EXCEL_FIELD_MAPPING_YOUR_SALE[f'agreement_amount_{i}'] = f'مبلغ بازه {i} توافقی-ریال'

FIELD_MAPPING_DISTRIBUTION_REVERSE = {v: k for k, v in EXCEL_FIELD_MAPPING_DISTRIBUTION.items()}
FIELD_MAPPING_OFFER_REVERSE = {v: k for k, v in EXCEL_FIELD_MAPPING_OFFER.items()}
FIELD_MAPPING_SALE_REVERSE = {v: k for k, v in EXCEL_FIELD_MAPPING_SALE.items()}
FIELD_MAPPING_ADDRESS_REVERSE = {v: k for k, v in EXCEL_FIELD_MAPPING_ADDRESS.items()}
FIELD_MAPPING_YOUR_SALE_REVERSE = {v: k for k, v in EXCEL_FIELD_MAPPING_YOUR_SALE.items()}
