# marketplace/views/address_management_new.py
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib import messages
from django.http import JsonResponse
from django.db import transaction, models
from django.utils import timezone
from django.core.paginator import Paginator
from ..models import DeliveryAddress, MarketplacePurchaseDetail
from warehouse.models import WarehouseDeliveryOrder, WarehouseDeliveryOrderItem, Product, Warehouse, Receiver
from warehouse.models import SalesProforma, Customer
import jdatetime
from decimal import Decimal


@staff_member_required
def bulk_send_to_delivery_new(request):
    """ارسال گروهی آدرس‌ها برای ایجاد حواله - نسخه جدید"""
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Method not allowed'})
    
    try:
        address_ids = request.POST.getlist('address_ids[]')
        if not address_ids:
            return JsonResponse({'success': False, 'error': 'هیچ آدرسی انتخاب نشده است'})
        
        # بررسی وجود آدرس‌ها
        addresses = DeliveryAddress.objects.filter(
            id__in=address_ids, 
            status='pending'
        ).select_related('purchase_detail__purchase__marketplace_sale__product_offer')
        
        if not addresses.exists():
            return JsonResponse({'success': False, 'error': 'آدرس‌های معتبر یافت نشد'})
        
        # گروه‌بندی بر اساس عرضه (انبار)
        grouped_addresses = {}
        for address in addresses:
            offer = address.purchase_detail.purchase.marketplace_sale.product_offer
            warehouse_id = offer.warehouse_receipt.warehouse.id if offer.warehouse_receipt else None
            
            if warehouse_id:
                if warehouse_id not in grouped_addresses:
                    grouped_addresses[warehouse_id] = {
                        'warehouse': offer.warehouse_receipt.warehouse,
                        'offer': offer,
                        'addresses': []
                    }
                grouped_addresses[warehouse_id]['addresses'].append(address)
        
        created_orders = []
        
        with transaction.atomic():
            for warehouse_id, group_data in grouped_addresses.items():
                warehouse = group_data['warehouse']
                offer = group_data['offer']
                group_addresses = group_data['addresses']
                
                try:
                    # ایجاد حواله خروج برای هر گروه
                    delivery_order = create_delivery_order_for_addresses_new(
                        warehouse, offer, group_addresses
                    )
                    created_orders.append(delivery_order)
                except Exception as e:
                    import traceback
                    error_details = traceback.format_exc()
                    return JsonResponse({
                        'success': False, 
                        'error': f'خطا در ایجاد حواله: {str(e)}',
                        'details': error_details
                    })
                
                # به‌روزرسانی وضعیت آدرس‌ها
                for address in group_addresses:
                    address.status = 'delivery_created'
                    address.delivery_order_number = delivery_order.number
                    address.save()
        
        return JsonResponse({
            'success': True,
            'message': f'تعداد {len(created_orders)} حواله خروج ایجاد شد',
            'delivery_orders': [order.number for order in created_orders]
        })
        
    except Exception as e:
        import traceback
        return JsonResponse({
            'success': False, 
            'error': str(e),
            'traceback': traceback.format_exc()
        })


def create_delivery_order_for_addresses_new(warehouse, offer, addresses):
    """ایجاد حواله خروج از آدرس‌های انتخابی - نسخه جدید"""
    
    # ایجاد یا دریافت مشتری بازارگاه
    company_name = f"بازارگاه - {offer.offer_id}"
    marketplace_customer, created = Customer.objects.get_or_create(
        company_name=company_name,
        customer_type='legal',
        defaults={
            'address': "بازارگاه",
            'phone': "",
            'national_id': "99999999999",  # شناسه موقت برای بازارگاه
            'tags': "بازارگاه",
        }
    )
    
    # ایجاد پیش‌فاکتور فروش موقت برای حواله
    import time
    unique_number = f"MP-{offer.offer_id}-{int(time.time())}"
    sales_proforma = SalesProforma.objects.create(
        number=unique_number,
        date=timezone.now().date(),
        customer=marketplace_customer,
        description=f"فروش بازارگاه - عرضه {offer.offer_id}",
    )
    
    # تولید شماره حواله
    from warehouse.models.warehouse_ops import generate_delivery_order_number
    delivery_number = generate_delivery_order_number()
    
    # ایجاد حواله خروج
    delivery_order = WarehouseDeliveryOrder.objects.create(
        number=delivery_number,
        issue_date=timezone.now().date(),
        validity_date=timezone.now().date() + timezone.timedelta(days=30),
        warehouse=warehouse,
        description=f"حواله خروج بازارگاه - عرضه {offer.offer_id}",
        sales_proforma=sales_proforma,
        # shipping_company خالی می‌ماند تا بعداً انتخاب شود
    )
    
    # محصول پیش‌فرض
    default_product = Product.objects.first()
    if not default_product:
        default_product = Product.objects.create(
            code="MARKETPLACE-DEFAULT",
            name="محصول بازارگاه",
            unit="کیلوگرم"
        )
    
    # محاسبه مجموع وزن
    total_weight = sum(Decimal(str(addr.order_weight or 0)) for addr in addresses)
    
    # ایجاد آیتم حواله
    WarehouseDeliveryOrderItem.objects.create(
        delivery_order=delivery_order,
        row_number=1,
        product=default_product,
        quantity=total_weight,
        unit_price=Decimal('0'),  # قیمت واحد صفر
        total_price=Decimal('0')  # قیمت کل صفر
    )
    
    # ایجاد گیرندگان برای هر آدرس
    for i, address in enumerate(addresses, 1):
        receiver_unique_id = f"MP-{address.assignment_id}-{i}"
        
        receiver, created = Receiver.objects.get_or_create(
            unique_id=receiver_unique_id,
            defaults={
                'receiver_type': 'natural',
                'full_name': address.recipient_name or address.buyer_name or 'نامشخص',
                'phone': address.coordination_phone or address.buyer_mobile or '',
                'address': address.delivery_address or 'آدرس نامشخص',
                'postal_code': address.delivery_postal_code or '0000000000',
                'personal_code': address.delivery_national_id or '0000000000',
            }
        )
        
        # اتصال گیرنده به حواله
        delivery_order.receivers.add(receiver)
    
    return delivery_order