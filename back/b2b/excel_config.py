EXCEL_FIELD_MAPPING = {
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

for i in range(1, 4):
    EXCEL_FIELD_MAPPING[f'credit_period_{i}'] = f'بازه پرداخت نسیه {i}'
    EXCEL_FIELD_MAPPING[f'credit_amount_{i}'] = f'مبلغ بازه پرداخت نسیه {i}'

FIELD_MAPPING_REVERSE = {v: k for k, v in EXCEL_FIELD_MAPPING.items()}