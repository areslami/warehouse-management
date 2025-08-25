from bs4 import BeautifulSoup
import jdatetime
from decimal import Decimal
from datetime import datetime
import re
from django.db.models import Q
from core.models import Product, Customer
from .models import B2BOffer
from .excel_config import EXCEL_FIELD_MAPPING


def parse_html_table(content):
    soup = BeautifulSoup(content, 'html.parser')
    table = soup.find('table')
    if not table:
        raise ValueError("No table found")
    
    headers = [th.text.strip() for th in table.find_all('th')]
    rows = []
    
    for tr in table.find_all('tr')[1:]:
        cells = [td.text.strip() for td in tr.find_all('td')]
        if cells:
            rows.append(dict(zip(headers, cells)))
    
    return rows


def persian_to_gregorian(date_str):
    try:
        y, m, d = map(int, date_str.split('/'))
        gregorian_date = jdatetime.date(y, m, d).togregorian()
        return gregorian_date.strftime('%Y-%m-%d')
    except Exception as e:
        print(f"Error parsing date {date_str}: {e}")
        return datetime.now().strftime('%Y-%m-%d')


def clean_number(value):
    cleaned = re.sub(r'[^\d.]', '', value)
    return Decimal(cleaned) if cleaned else Decimal('0')


def extract_product_parts(product_str):
    match = re.match(r'(.+?)\s*/\s*(\d+)', product_str)
    if match:
        return match.group(1).strip(), match.group(2).strip()
    return product_str.strip(), None


def find_product(name, code=None):
    if code:
        product = Product.objects.filter(code=code).first()
        if product:
            return product
    
    return Product.objects.filter(
        Q(name__icontains=name) | 
        Q(name__icontains=name.replace(' ', ''))
    ).first()


def find_customer(name):
    return Customer.objects.filter(
        Q(full_name__icontains=name) |
        Q(company_name__icontains=name)
    ).first()


def find_offer(cottage_code):
    return B2BOffer.objects.filter(
        Q(offer_id=cottage_code) |
        Q(cottage_number=cottage_code)
    ).first()


def build_credit_info(row):
    parts = []
    for i in range(1, 4):
        period = row.get(EXCEL_FIELD_MAPPING.get(f'credit_period_{i}'), '0')
        amount = row.get(EXCEL_FIELD_MAPPING.get(f'credit_amount_{i}'), '0')
        
        if period != '0' and amount != '0':
            parts.append(f"بازه {convert_to_persian_numbers(str(i))}: {convert_to_persian_numbers(period)} روز، مبلغ: {convert_to_persian_numbers(amount)} تومان")
    
    if parts:
        return f"شرایط پرداخت اعتباری: {' • '.join(parts)}"
    
    payment_method = row.get(EXCEL_FIELD_MAPPING.get('payment_method', ''), '')
    return f"نوع پرداخت: {payment_method}" if payment_method else "پرداخت نقدی"


def convert_to_persian_numbers(text):
    """Convert English/Arabic numbers to Persian numbers"""
    if not text:
        return text
    
    persian_digits = '۰۱۲۳۴۵۶۷۸۹'
    english_digits = '0123456789'
    arabic_digits = '٠١٢٣٤٥٦٧٨٩'
    
    # Convert English digits
    for i, digit in enumerate(english_digits):
        text = str(text).replace(digit, persian_digits[i])
    
    # Convert Arabic digits  
    for i, digit in enumerate(arabic_digits):
        text = str(text).replace(digit, persian_digits[i])
    
    return text


def build_beautiful_description(row, product_name):
    parts = []
    
    weight = row.get(EXCEL_FIELD_MAPPING.get('weight', ''), '0')
    if weight and weight != '0':
        parts.append(f"توزیع {convert_to_persian_numbers(weight)} کیلوگرم {product_name}")
    else:
        parts.append(f"توزیع محصول {product_name}")
    
    customer_name = row.get(EXCEL_FIELD_MAPPING.get('customer_name', ''), '')
    if customer_name:
        parts.append(f"به مشتری: {customer_name}")
    
    total_amount = row.get(EXCEL_FIELD_MAPPING.get('total_amount', ''), '0')
    if total_amount and total_amount != '0':
        parts.append(f"مبلغ کل: {convert_to_persian_numbers(total_amount)} تومان")
    
    unit_price = row.get(EXCEL_FIELD_MAPPING.get('unit_price', ''), '0')
    if unit_price and unit_price != '0':
        parts.append(f"قیمت واحد: {convert_to_persian_numbers(unit_price)} تومان")
    
    credit_info = build_credit_info(row)
    if credit_info:
        parts.append(credit_info)
    
    purchase_id = row.get(EXCEL_FIELD_MAPPING.get('purchase_id', ''), '')
    if purchase_id:
        parts.append(f"شناسه خرید: {convert_to_persian_numbers(purchase_id)}")
    
    date_str = row.get(EXCEL_FIELD_MAPPING.get('date', ''), '')
    if date_str:
        parts.append(f"تاریخ: {date_str}")

    known = set(EXCEL_FIELD_MAPPING.values())
    unmapped_parts = []
    for key, value in row.items():
        if key not in known and value and value != '0':
            unmapped_parts.append(f"{key}: {convert_to_persian_numbers(str(value))}")
    
    if unmapped_parts:
        parts.append(f"اطلاعات اضافی - {' • '.join(unmapped_parts)}")
    
    return " • ".join(parts)


def process_row(row):
    product_str = row.get(EXCEL_FIELD_MAPPING['product_title'], '')
    product_name, product_code = extract_product_parts(product_str)
    
    date_str = row.get(EXCEL_FIELD_MAPPING['date'], '')
    if not date_str:
        date_str = datetime.now().strftime('%Y/%m/%d')
    
    processed = {
        'purchase_id': row.get(EXCEL_FIELD_MAPPING['purchase_id']),
        'cottage_code': row.get(EXCEL_FIELD_MAPPING['cottage_code']),
        'distribution_weight': clean_number(row.get(EXCEL_FIELD_MAPPING['weight'], '0')),
        'distribution_date': persian_to_gregorian(date_str),
        'total_amount': clean_number(row.get(EXCEL_FIELD_MAPPING['total_amount'], '0')),
        'unit_price': clean_number(row.get(EXCEL_FIELD_MAPPING['unit_price'], '0')),
        'product_name': product_name,
        'product_code': product_code,
        'customer_name': row.get(EXCEL_FIELD_MAPPING['customer_name']),
        'payment_method': row.get(EXCEL_FIELD_MAPPING['payment_method']),
        'credit_description': build_beautiful_description(row, product_name),
        'unmapped': {},
    }
    
    product = find_product(product_name, product_code)
    customer = find_customer(row.get(EXCEL_FIELD_MAPPING['customer_name']))
    offer = find_offer(row.get(EXCEL_FIELD_MAPPING['cottage_code']))
    
    if product:
        processed['product'] = {'id': product.id, 'name': product.name}
    else:
        processed['product'] = None
        
    if customer:
        processed['customer'] = {'id': customer.id, 'name': getattr(customer, 'company_name', None) or customer.full_name}
    else:
        processed['customer'] = None
        
    if offer:
        processed['offer'] = {'id': offer.id, 'offer_id': offer.offer_id}
    else:
        processed['offer'] = None
    
    known = set(EXCEL_FIELD_MAPPING.values())
    for key, value in row.items():
        if key not in known and value and value != '0':
            processed['unmapped'][key] = value
    
    return processed