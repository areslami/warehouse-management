from decimal import Decimal
import re
import jdatetime
from datetime import datetime
from django.db import transaction
from b2b.models import B2BAddress, B2BSale
from .models import DeliveryFulfillment, DeliveryFulfillmentItem


def convert_to_english_numbers(text):
    """Convert Persian/Arabic digits to English digits"""
    if text is None:
        return ''
    s = str(text)
    persian_digits = '۰۱۲۳۴۵۶۷۸۹'
    arabic_digits = '٠١٢٣٤٥٦٧٨٩'
    for i, d in enumerate(persian_digits):
        s = s.replace(d, str(i))
    for i, d in enumerate(arabic_digits):
        s = s.replace(d, str(i))
    return s


def clean_number(value):
    """Clean and convert a value to Decimal"""
    if value is None or value == '':
        return Decimal('0')
    s = convert_to_english_numbers(value)
    cleaned = re.sub(r'[^0-9.]', '', str(s))
    return Decimal(cleaned) if cleaned else Decimal('0')


def persian_to_gregorian(date_str):
    """Convert Persian date string (YYYY/MM/DD) to Gregorian date string"""
    try:
        date_str = str(date_str).strip()
        if not date_str or date_str == '0':
            return datetime.now().strftime('%Y-%m-%d')

        # Handle different separators
        date_str = date_str.replace('-', '/').replace('.', '/')

        parts = date_str.split('/')
        if len(parts) != 3:
            return datetime.now().strftime('%Y-%m-%d')

        y, m, d = map(int, parts)
        gregorian_date = jdatetime.date(y, m, d).togregorian()
        return gregorian_date.strftime('%Y-%m-%d')
    except Exception as e:
        print(f"Error parsing date {date_str}: {e}")
        return datetime.now().strftime('%Y-%m-%d')


def find_b2b_address_by_allocation_id(allocation_id):
    """Find B2BAddress by allocation_id"""
    if not allocation_id:
        return None

    allocation_id_str = str(allocation_id).strip()
    if not allocation_id_str:
        return None

    return B2BAddress.objects.filter(allocation_id=allocation_id_str).first()


def get_product_from_b2b_address(b2b_address):
    """Extract product from B2B address"""
    if not b2b_address:
        return None
    return b2b_address.product


def get_customer_from_b2b_address(b2b_address):
    """Extract customer from B2B address"""
    if not b2b_address:
        return None
    return b2b_address.customer


def get_warehouse_receipt_from_b2b_address(b2b_address):
    """Find warehouse receipt from B2B address by matching cottage_code"""
    if not b2b_address:
        return None

    # Match by cottage_code → cottage_serial_number
    if b2b_address.cottage_code:
        from warehouse.models import WarehouseReceipt
        receipt = WarehouseReceipt.objects.filter(
            cottage_serial_number=b2b_address.cottage_code
        ).first()
        return receipt

    return None


def get_offer_and_distribution_from_b2b_address(b2b_address):
    """Get linked offer and distribution from B2B address"""
    offer = None
    distribution = None

    if not b2b_address:
        return None, None

    # Get offer from B2BAddress
    if b2b_address.product_offer:
        offer = b2b_address.product_offer

    # Try to find distribution through B2BSale
    try:
        sale = B2BSale.objects.filter(purchase_id=b2b_address.purchase_id).first()
        if sale and sale.b2b_distribution:
            distribution = sale.b2b_distribution
    except Exception as e:
        print(f"Error finding distribution: {e}")

    return offer, distribution


def map_row_data(row, column_mappings):
    """Map Excel row data according to column mappings"""
    mapped_data = {}

    for field_key, excel_column in column_mappings.items():
        if excel_column and excel_column in row:
            mapped_data[field_key] = row[excel_column]
        else:
            mapped_data[field_key] = None

    return mapped_data


def process_delivery_row(row, column_mappings, shipping_company_id):
    """Process a single delivery row from Excel

    Args:
        row: Dictionary containing Excel row data
        column_mappings: Dictionary mapping field keys to Excel column names
        shipping_company_id: ID of the shipping company selected by user

    Returns:
        Dictionary containing processed delivery data
    """
    # Map the row data according to column mappings
    mapped = map_row_data(row, column_mappings)

    # Extract and clean data
    allocation_id = mapped.get('allocation_id')
    delivery_id = str(mapped.get('delivery_id', '')).strip()
    waybill_serial = str(mapped.get('waybill_serial', '')).strip() or None
    issue_date = persian_to_gregorian(mapped.get('issue_date'))
    driver_name = str(mapped.get('driver_name', '')).strip()
    driver_phone = str(mapped.get('driver_phone', '')).strip()
    license_plate = str(mapped.get('license_plate', '')).strip()
    total_weight = clean_number(mapped.get('total_weight'))
    destination = str(mapped.get('destination', '')).strip() if mapped.get('destination') else None
    receiver_name = str(mapped.get('receiver', '')).strip()
    fare = clean_number(mapped.get('fare'))
    sale_id = str(mapped.get('sale_id', '')).strip() if mapped.get('sale_id') else None

    # Check if delivery_id already exists
    if delivery_id and DeliveryFulfillment.objects.filter(delivery_id=delivery_id).exists():
        return {
            'error': f'شناسه تحویل "{delivery_id}" قبلاً در سیستم ثبت شده است. شناسه تحویل باید یکتا باشد.',
            'delivery_id': delivery_id,
            'row_data': mapped
        }

    # Find related B2B address by allocation_id
    b2b_address = find_b2b_address_by_allocation_id(allocation_id)

    if not b2b_address:
        return {
            'error': f'شناسه تخصیص "{allocation_id}" در سیستم موجود نیست. لطفا ابتدا آدرس B2B مربوطه را ایجاد کنید.',
            'allocation_id': allocation_id,
            'row_data': mapped
        }

    # Validate sale_id if provided
    if sale_id:
        if not b2b_address.purchase_id:
            return {
                'error': f'آدرس B2B با شناسه تخصیص "{allocation_id}" فاقد شناسه خرید است.',
                'allocation_id': allocation_id,
                'sale_id': sale_id,
                'row_data': mapped
            }
        if b2b_address.purchase_id != sale_id:
            return {
                'error': f'شناسه خرید "{sale_id}" با شناسه خرید آدرس B2B "{b2b_address.purchase_id}" مطابقت ندارد. (شناسه تخصیص: {allocation_id})',
                'allocation_id': allocation_id,
                'sale_id': sale_id,
                'b2b_purchase_id': b2b_address.purchase_id,
                'row_data': mapped
            }

    # Get related entities
    warehouse_receipt = get_warehouse_receipt_from_b2b_address(b2b_address)
    product = get_product_from_b2b_address(b2b_address)
    customer = get_customer_from_b2b_address(b2b_address)
    offer, distribution = get_offer_and_distribution_from_b2b_address(b2b_address)

    if not warehouse_receipt:
        return {
            'error': f'رسید انبار برای آدرس B2B با شناسه خرید "{b2b_address.purchase_id}" یافت نشد. (شناسه تخصیص: {allocation_id})',
            'allocation_id': allocation_id,
            'b2b_address_id': b2b_address.id,
            'row_data': mapped
        }

    if not product:
        return {
            'error': f'محصول برای آدرس B2B با شناسه خرید "{b2b_address.purchase_id}" یافت نشد. (شناسه تخصیص: {allocation_id})',
            'allocation_id': allocation_id,
            'b2b_address_id': b2b_address.id,
            'row_data': mapped
        }

    # Prepare delivery data
    delivery_data = {
        'delivery_id': delivery_id,
        'waybill_serial': waybill_serial,
        'b2b_address_id': b2b_address.id,
        'warehouse_receipt_id': warehouse_receipt.id,
        'shipping_company_id': shipping_company_id,
        'issue_date': issue_date,
        'driver_name': driver_name,
        'driver_phone': driver_phone,
        'driver_license_plate': license_plate,
        'total_weight': total_weight,
        'offer_id': offer.id if offer else None,
        'distribution_id': distribution.id if distribution else None,
        'items': [{
            'product_id': product.id,
            'weight': total_weight,
            'destination': destination,
            'receiver': receiver_name,
            'customer_id': customer.id if customer else None,
            'fare': fare,
        }]
    }

    return {
        'success': True,
        'delivery_data': delivery_data,
        'allocation_id': allocation_id,
        'b2b_address_id': b2b_address.id,
        'warehouse_receipt_id': warehouse_receipt.id,
    }


def create_delivery_from_data(delivery_data):
    """Create a DeliveryFulfillment from processed data

    Args:
        delivery_data: Dictionary containing delivery information

    Returns:
        Tuple of (DeliveryFulfillment instance or None, error message or None)
    """
    try:
        with transaction.atomic():
            # Extract items data
            items_data = delivery_data.pop('items', [])

            # Create delivery
            delivery = DeliveryFulfillment.objects.create(**delivery_data)

            # Create delivery items
            for item_data in items_data:
                DeliveryFulfillmentItem.objects.create(
                    delivery=delivery,
                    **item_data
                )

            return delivery, None
    except Exception as e:
        error_msg = str(e)
        print(f"Error creating delivery: {error_msg}")
        import traceback
        traceback.print_exc()

        # Translate common Django errors to Persian
        if 'NOT NULL constraint failed' in error_msg:
            field_name = error_msg.split('.')[-1] if '.' in error_msg else 'unknown'
            return None, f'فیلد الزامی "{field_name}" خالی است'
        elif 'UNIQUE constraint failed' in error_msg or 'unique constraint' in error_msg.lower():
            if 'delivery_id' in error_msg:
                return None, 'شناسه تحویل تکراری است. این شناسه قبلاً ثبت شده است.'
            return None, f'مقدار تکراری: این رکورد قبلاً ثبت شده است'
        elif 'FOREIGN KEY constraint failed' in error_msg:
            return None, 'ارجاع به رکورد نامعتبر (Foreign Key خطا)'
        else:
            return None, f'خطا در ایجاد تحویل: {error_msg}'
