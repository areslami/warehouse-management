EXCEL_FIELD_MAPPING_DISTRIBUTION = {
    'purchase_id': 'شناسه خرید',
    'cottage_code': 'کد کوتاژ',
    'weight': 'وزن خرید',
    'date': 'تاریخ خرید',
    'total_amount': 'مبلغ پرداختی',
    'unit_price': 'مبلغ واحد',
    'product_title': 'عنوان کالا',
    'customer_name': 'نام خریدار',
    'payment_method': 'شیوه پرداخت',
    
}
EXCEL_FIELD_MAPPING_SALE = {
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
    EXCEL_FIELD_MAPPING_SALE[f'agreement_period_{i}'] = f'بازه {i} پرداخت توافقی (روز)'
    EXCEL_FIELD_MAPPING_SALE[f'agreement_amount{i}'] = f'مبلغ بازه {i} توافقی-ریال'
for i in range(1, 4):
    EXCEL_FIELD_MAPPING_DISTRIBUTION[f'credit_period_{i}'] = f'بازه پرداخت نسیه {i}'
    EXCEL_FIELD_MAPPING_DISTRIBUTION[f'credit_amount_{i}'] = f'مبلغ بازه پرداخت نسیه {i}'

FIELD_MAPPING_DISTRIBUTION_REVERSE = {v: k for k, v in EXCEL_FIELD_MAPPING_DISTRIBUTION.items()}
FIELD_MAPPING_SALE_REVERSE = {v: k for k, v in EXCEL_FIELD_MAPPING_SALE.items()}