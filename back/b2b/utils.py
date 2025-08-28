from bs4 import BeautifulSoup
from django.db import transaction
import jdatetime
from decimal import Decimal
from datetime import datetime
import re
from django.db.models import Q
from core.models.parties import  Receiver
from core.models import Product, Customer
from .models import B2BOffer
from .excel_config import EXCEL_FIELD_MAPPING_DISTRIBUTION, EXCEL_FIELD_MAPPING_SALE, EXCEL_FIELD_MAPPING_YOUR_SALE


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
        date_str = str(date_str)
        y, m, d = map(int, date_str.split('/'))
        gregorian_date = jdatetime.date(y, m, d).togregorian()
        return gregorian_date.strftime('%Y-%m-%d')
    except Exception as e:
        print(f"Error parsing date {date_str}: {e}")
        return datetime.now().strftime('%Y-%m-%d')


def clean_number(value):
    cleaned = re.sub(r'[^\d.]', '', str(value))
    return Decimal(cleaned) if cleaned else Decimal('0')


def extract_product_parts(product_str):
    product_str = str(product_str)
    match = re.match(r'(.+?)\s*/\s*(\d+)', product_str)
    if match:
        return match.group(1).strip(), match.group(2).strip()
    return product_str.strip(), None


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



def build_description(row, product_name, mapping, op_type='dist'):
    parts = []
    
    weight_key = 'weight' if op_type == 'dist' else 'total_weight_purchased'
    weight = row.get(mapping.get(weight_key, ''), '0')
    op_text = 'توزیع' if op_type == 'dist' else 'بازارگاه'
    
    if weight != '0':
        parts.append(f"{op_text}: {convert_to_persian_numbers(weight)} کیلوگرم {product_name}")
    else:
        parts.append(f"{op_text}: {product_name}")
    
    payment = row.get(mapping.get('payment_method', ''), '')
    if payment:
        parts.append(f"روش پرداخت: {payment}")
    
    credits = []
    for i in range(1, 4):
        prefix = 'credit' if op_type == 'dist' else 'agreement'
        period = str(row.get(mapping.get(f'{prefix}_period_{i}', ''), '0')).strip()
        amount = str(row.get(mapping.get(f'{prefix}_amount_{i}', ''), '0')).strip()
        
        # Clean and validate the values
        if period and period != '0' and period != '' and amount and amount != '0' and amount != '':
            try:
                amount_float = float(amount)
                amount_formatted = f"{int(amount_float):,}".replace(',', '،')
                credits.append(f"دوره {i}: {convert_to_persian_numbers(period)} روز × {convert_to_persian_numbers(amount_formatted)} ریال")
            except (ValueError, TypeError):
                # Skip if conversion fails
                pass
    
    if credits:
        parts.append("توافقی:")
        parts.extend(credits)
    
    if op_type == 'sale':
        desc = row.get(mapping.get('description', ''), '')
        if desc and desc.strip():
            parts.append(f"توضیحات: {desc}")
    
    return "\n".join(parts)

def build_description_your_sale(row, product_name):
    parts = []
    
    weight = row.get(EXCEL_FIELD_MAPPING_YOUR_SALE.get('total_weight_purchased', ''), '0')
    if weight != '0':
        parts.append(f"بازارگاه: {convert_to_persian_numbers(weight)} کیلوگرم {product_name}")
    else:
        parts.append(f"بازارگاه: {product_name}")
    
    payment = row.get(EXCEL_FIELD_MAPPING_YOUR_SALE.get('payment_method', ''), '')
    if payment:
        parts.append(f"روش پرداخت: {payment}")
    
    credits = []
    for i in range(1, 4):
        period = str(row.get(EXCEL_FIELD_MAPPING_YOUR_SALE.get(f'agreement_period_{i}', ''), '0')).strip()
        amount = str(row.get(EXCEL_FIELD_MAPPING_YOUR_SALE.get(f'agreement_amount_{i}', ''), '0')).strip()
        
        # Clean and validate the values
        if period and period != '0' and period != '' and amount and amount != '0' and amount != '':
            try:
                amount_float = float(amount)
                amount_formatted = f"{int(amount_float):,}".replace(',', '،')
                credits.append(f"دوره {i}: {convert_to_persian_numbers(period)} روز × {convert_to_persian_numbers(amount_formatted)} ریال")
            except (ValueError, TypeError):
                # Skip if conversion fails
                pass
    
    if credits:
        parts.append("توافقی:")
        parts.extend(credits)
    
    desc = row.get(EXCEL_FIELD_MAPPING_YOUR_SALE.get('description', ''), '')
    if desc and desc.strip():
        parts.append(f"توضیحات: {desc}")
    
    return "\n".join(parts)


def process_distribution_row(row):
    product_str = row.get(EXCEL_FIELD_MAPPING_DISTRIBUTION['product_title'], '')
    product_name, product_code = extract_product_parts(product_str)
    
    date_str = row.get(EXCEL_FIELD_MAPPING_DISTRIBUTION['date'], '')
    if not date_str:
        date_str = datetime.now().strftime('%Y/%m/%d')
    
    processed = {
        'purchase_id': row.get(EXCEL_FIELD_MAPPING_DISTRIBUTION['purchase_id']),
        'cottage_code': row.get(EXCEL_FIELD_MAPPING_DISTRIBUTION['cottage_code']),
        'distribution_weight': clean_number(row.get(EXCEL_FIELD_MAPPING_DISTRIBUTION['weight'], '0')),
        'distribution_date': persian_to_gregorian(date_str),
        'total_amount': clean_number(row.get(EXCEL_FIELD_MAPPING_DISTRIBUTION['total_amount'], '0')),
        'unit_price': clean_number(row.get(EXCEL_FIELD_MAPPING_DISTRIBUTION['unit_price'], '0')),
        'product_name': product_name,
        'product_code': product_code,
        'customer_name': row.get(EXCEL_FIELD_MAPPING_DISTRIBUTION['customer_name']),
        'payment_method': row.get(EXCEL_FIELD_MAPPING_DISTRIBUTION['payment_method']),
        'credit_description': build_description(row, product_name, EXCEL_FIELD_MAPPING_DISTRIBUTION, 'dist'),
        'unmapped': {},
    }
    
    product = find_product(product_name, product_code)
    customer = find_customer(row.get(EXCEL_FIELD_MAPPING_DISTRIBUTION['customer_name']))
    offer = find_offer(row.get(EXCEL_FIELD_MAPPING_DISTRIBUTION['cottage_code']))
    
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
    
    known = set(EXCEL_FIELD_MAPPING_DISTRIBUTION.values())
    for key, value in row.items():
        if key not in known and value and value != '0':
            processed['unmapped'][key] = value
    
    return processed



def process_sale_row(row):
    product_title = str(row.get(EXCEL_FIELD_MAPPING_SALE['product_title'], ''))
    product_name, product_code = extract_product_parts(product_title)
    
    date_str = str(row.get(EXCEL_FIELD_MAPPING_SALE['purchase_date'], ''))
    if not date_str:
        date_str = datetime.now().strftime('%Y/%m/%d')
    
    processed = {
        'purchase_id': row.get(EXCEL_FIELD_MAPPING_SALE['purchase_id']),
        'allocation_id': row.get(EXCEL_FIELD_MAPPING_SALE['allocation_id']),
        'cottage_code': row.get(EXCEL_FIELD_MAPPING_SALE['cottage_code']),
        'total_weight_purchased': clean_number(row.get(EXCEL_FIELD_MAPPING_SALE['total_weight_purchased'], '0')),
        'purchase_date': persian_to_gregorian(date_str),
        'unit_price': clean_number(row.get(EXCEL_FIELD_MAPPING_SALE['unit_price'], '0')),
        'payment_amount': clean_number(row.get(EXCEL_FIELD_MAPPING_SALE['payment_amount'], '0')),
        'product_name': product_name,
        'product_code': product_code,
        'customer_name': row.get(EXCEL_FIELD_MAPPING_SALE['customer_name']),
        'payment_method': row.get(EXCEL_FIELD_MAPPING_SALE['payment_method']),
        'credit_description': build_description(row, product_name, EXCEL_FIELD_MAPPING_SALE, 'sale'),
        'province': row.get(EXCEL_FIELD_MAPPING_SALE['province']),
        'city': row.get(EXCEL_FIELD_MAPPING_SALE['city']),
        'tracking_number': row.get(EXCEL_FIELD_MAPPING_SALE['tracking_number']),
    }
    
    customer, customerCreated = createOrUpdateCustomer(row)
    receiver, receiverCreated = createOrUpdateReceiver(row)
    
    offer_id = row.get(EXCEL_FIELD_MAPPING_SALE['offer_id'])
    cottage_code = row.get(EXCEL_FIELD_MAPPING_SALE['cottage_code'])
    offer = find_offer(offer_id) if offer_id else find_offer(cottage_code)
    product = find_product(product_name, product_code)
    
    if offer:
        processed['offer'] = {'id': offer.id, 'offer_id': offer.offer_id}
    else:
        processed['offer'] = None
        
    if product:
        processed['product'] = {'id': product.id, 'name': product.name}
    else:
        processed['product'] = None
        
    if customer:
        processed['customer'] = {'id': customer.id, 'name': getattr(customer, 'company_name', None) or customer.full_name}
    else:
        processed['customer'] = None
        
    if receiver:
        processed['receiver'] = {'id': receiver.id, 'name': getattr(receiver, 'company_name', None) or receiver.full_name}
    else:
        processed['receiver'] = None
    
    return processed,customerCreated,receiverCreated

def process_your_sale_row(row):
    product_title = str(row.get(EXCEL_FIELD_MAPPING_YOUR_SALE['product_title'], ''))
    product_name, product_code = extract_product_parts(product_title)
    
    date_str = str(row.get(EXCEL_FIELD_MAPPING_YOUR_SALE['purchase_date'], ''))
    if not date_str:
        date_str = datetime.now().strftime('%Y/%m/%d')
    
    processed = {
        'purchase_id': row.get(EXCEL_FIELD_MAPPING_YOUR_SALE['purchase_id']),
        'cottage_number': row.get(EXCEL_FIELD_MAPPING_YOUR_SALE['cottage_number']),
        'total_weight_purchased': clean_number(row.get(EXCEL_FIELD_MAPPING_YOUR_SALE['total_weight_purchased'], '0')),
        'purchase_date': persian_to_gregorian(date_str),
        'unit_price': clean_number(row.get(EXCEL_FIELD_MAPPING_YOUR_SALE['unit_price'], '0')),
        'payment_amount': clean_number(row.get(EXCEL_FIELD_MAPPING_YOUR_SALE['payment_amount'], '0')),
        'product_name': product_name,
        'product_code': product_code,
        'customer_name': row.get(EXCEL_FIELD_MAPPING_YOUR_SALE['customer_name']),
        'customer_phone': row.get(EXCEL_FIELD_MAPPING_YOUR_SALE['customer_phone']),
        'customer_national_code': row.get(EXCEL_FIELD_MAPPING_YOUR_SALE['customer_national_code']),
        'payment_method': row.get(EXCEL_FIELD_MAPPING_YOUR_SALE['payment_method']),
        'credit_description': build_description_your_sale(row, product_name),
        'province': row.get(EXCEL_FIELD_MAPPING_YOUR_SALE['province']),
        'tracking_number': row.get(EXCEL_FIELD_MAPPING_YOUR_SALE['tracking_number']),
        'offer_id': row.get(EXCEL_FIELD_MAPPING_YOUR_SALE['offer_id']),
    }
    
    customer = find_customer(row.get(EXCEL_FIELD_MAPPING_YOUR_SALE['customer_name']))
    offer_id = row.get(EXCEL_FIELD_MAPPING_YOUR_SALE['offer_id'])
    cottage_number = row.get(EXCEL_FIELD_MAPPING_YOUR_SALE['cottage_number'])
    offer = find_offer(offer_id) if offer_id else find_offer(cottage_number)
    product = find_product(product_name, product_code)
    
    if offer:
        processed['offer'] = {'id': offer.id, 'offer_id': offer.offer_id}
    else:
        processed['offer'] = None
        
    if product:
        processed['product'] = {'id': product.id, 'name': product.name}
    else:
        processed['product'] = None
        
    if customer:
        processed['customer'] = {'id': customer.id, 'name': getattr(customer, 'company_name', None) or customer.full_name}
    else:
        processed['customer'] = None
    
    processed['receiver'] = None
    
    return processed

def createOrUpdateReceiver(row):
    receiver_name = str(row.get(EXCEL_FIELD_MAPPING_SALE['receiver_name'], ''))
    receiver_economic_code = str(row.get(EXCEL_FIELD_MAPPING_SALE['receiver_economic_code'], ''))
    single = str(row.get(EXCEL_FIELD_MAPPING_SALE['single'], ''))
    double = str(row.get(EXCEL_FIELD_MAPPING_SALE['double'], ''))
    trailer = str(row.get(EXCEL_FIELD_MAPPING_SALE['trailer'], ''))
    receiver_address = str(row.get(EXCEL_FIELD_MAPPING_SALE['receiver_address'], ''))
    receiver_postal_code = str(row.get(EXCEL_FIELD_MAPPING_SALE['receiver_postal_code'], ''))
    receiver_phone = str(row.get(EXCEL_FIELD_MAPPING_SALE['receiver_phone'], ''))
    receiver_national_id = str(row.get(EXCEL_FIELD_MAPPING_SALE['receiver_national_id'], '')).strip()
    
    # Determine type based on national_id length or name content
    # 10 digits (or starts with 0) = individual, 11 digits = corporate
    if len(receiver_national_id) == 11 or 'شرکت' in receiver_name or 'خدمات' in receiver_name:
        receiver_type = 'corporate'
        full_name = ''
        company_name = receiver_name
        national_id = receiver_national_id[:11]  # Truncate to max 11 chars for safety
        personal_code = None
    else:
        receiver_type = 'individual'
        full_name = receiver_name
        company_name = ''
        national_id = None
        personal_code = receiver_national_id[:10]  # Truncate to max 10 chars for safety
    with transaction.atomic():
        receiver, created = Receiver.objects.update_or_create(
            economic_code=receiver_economic_code,
            defaults={
                'receiver_type': receiver_type,
                'company_name': company_name,
                'national_id': national_id,
                'full_name': full_name,
                'personal_code': personal_code,
                'phone': receiver_phone,
                'address': receiver_address,
                'receiver_veichle_type': 'single' if single else 'double' if double else 'trailer' if trailer else 'single',
                'postal_code': receiver_postal_code or '',
                'description': f'ایجاد شده از طریق بارگذاری فایل فروش بازارگاه ',
            }
        )
    return receiver,created
def createOrUpdateCustomer(row):
    
    customer_name = str(row.get(EXCEL_FIELD_MAPPING_SALE['customer_name'], ''))
    customer_national_code = str(row.get(EXCEL_FIELD_MAPPING_SALE['customer_national_code'], '')).strip()
    customer_postal_code = str(row.get(EXCEL_FIELD_MAPPING_SALE['customer_postal_code'], ''))
    customer_address = str(row.get(EXCEL_FIELD_MAPPING_SALE['customer_address'], ''))
    customer_phone = str(row.get(EXCEL_FIELD_MAPPING_SALE['customer_phone'], ''))
    customer_economic_code = str(row.get(EXCEL_FIELD_MAPPING_SALE['customer_economic_code'], ''))
    customer_type = str(row.get(EXCEL_FIELD_MAPPING_SALE['customer_type'], ''))
    
    # Determine type based on national_code length, customer_type, or defaults
    # 10 digits (or starts with 0) = individual, 11 digits = corporate
    if len(customer_national_code) == 11 or (customer_type and not customer_type.startswith('خریداران')):
        cust_type = 'corporate'
        full_name = ''
        company_name = customer_name
        national_id = customer_national_code[:11]  # Truncate to max 11 chars for safety
        personal_code = None
    else:
        cust_type = 'individual'
        full_name = customer_name
        company_name = ''
        national_id = None
        personal_code = customer_national_code[:10]  # Truncate to max 10 chars for safety
    with transaction.atomic():
        customer, created = Customer.objects.update_or_create(
            economic_code=customer_economic_code,
            defaults={
                'customer_type': cust_type,
                'company_name': company_name,
                'national_id': national_id,
                'full_name': full_name,
                'personal_code': personal_code,
                'phone': customer_phone,
                'address': customer_address,
                'postal_code': customer_postal_code or '',
                'description': f'ایجاد شده از طریق بارگذاری فایل فروش بازارگاه ',
            }
        )
    return customer,created
# ------------------ FINDs ------------------

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

