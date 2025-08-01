# marketplace/views/address_management.py
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib import messages
from django.http import JsonResponse
from django.db import transaction, models
from django.utils import timezone
from django.core.paginator import Paginator
from ..models import DeliveryAddress, MarketplacePurchaseDetail
from warehouse.models import WarehouseDeliveryOrder, WarehouseDeliveryOrderItem, Product, Warehouse, Receiver
from warehouse.models import SalesProforma
import jdatetime
from decimal import Decimal


@staff_member_required
def delivery_address_list(request):
    """صفحه مدیریت آدرس‌های تحویل"""
    
    # فیلترها
    status_filter = request.GET.get('status', '')
    search_query = request.GET.get('search', '')
    purchase_detail_id = request.GET.get('purchase_detail', '')
    
    # کوئری پایه
    addresses = DeliveryAddress.objects.select_related(
        'purchase_detail__purchase__marketplace_sale__product_offer'
    ).order_by('-created_at')
    
    # اعمال فیلترها
    if status_filter:
        addresses = addresses.filter(status=status_filter)
    
    if search_query:
        addresses = addresses.filter(
            models.Q(assignment_id__icontains=search_query) |
            models.Q(buyer_name__icontains=search_query) |
            models.Q(recipient_name__icontains=search_query) |
            models.Q(province__icontains=search_query) |
            models.Q(city__icontains=search_query)
        )
    
    if purchase_detail_id:
        addresses = addresses.filter(purchase_detail_id=purchase_detail_id)
    
    # صفحه‌بندی
    paginator = Paginator(addresses, 25)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    # آمار
    stats = {
        'total': DeliveryAddress.objects.count(),
        'pending': DeliveryAddress.objects.filter(status='pending').count(),
        'sent_to_delivery': DeliveryAddress.objects.filter(status='sent_to_delivery').count(),
        'delivery_created': DeliveryAddress.objects.filter(status='delivery_created').count(),
        'completed': DeliveryAddress.objects.filter(status='completed').count(),
    }
    
    # لیست خریدهای موجود برای فیلتر
    purchase_details = MarketplacePurchaseDetail.objects.select_related(
        'purchase'
    ).order_by('-created_at')[:50]
    
    context = {
        'page_obj': page_obj,
        'stats': stats,
        'status_filter': status_filter,
        'search_query': search_query,
        'purchase_detail_id': purchase_detail_id,
        'purchase_details': purchase_details,
        'status_choices': DeliveryAddress.STATUS_CHOICES,
    }
    
    return render(request, 'marketplace/address_management.html', context)


@staff_member_required
def bulk_send_to_delivery(request):
    """ارسال گروهی آدرس‌ها برای ایجاد حواله"""
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
                    delivery_order = create_delivery_order_for_addresses(
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
        return JsonResponse({'success': False, 'error': str(e)})


def create_delivery_order_for_addresses(warehouse, offer, addresses):
    """ایجاد حواله خروج از آدرس‌های انتخابی"""
    
    # ایجاد یا دریافت مشتری بازارگاه
    from warehouse.models import Customer
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
    try:
        sales_proforma = SalesProforma.objects.create(
            number=f"MP-{offer.offer_id}-{timezone.now().strftime('%Y%m%d%H%M%S')}",
            date=timezone.now().date(),
            customer=marketplace_customer,
            description=f"فروش بازارگاه - عرضه {offer.offer_id}",
        )
    except Exception as e:
        raise Exception(f"خطا در ایجاد پیش فاکتور فروش: {str(e)}")
    
    # تولید شماره حواله
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
    
    # محصول پیش‌فرض (اولین محصول موجود یا ایجاد محصول عمومی)
    product = get_or_create_default_product(offer)
    
    # ایجاد آیتم‌های حواله
    for idx, address in enumerate(addresses, 1):
        # ایجاد یا پیدا کردن گیرنده
        receiver = get_or_create_receiver_from_address(address)
        
        # تعیین نوع وسیله حمل
        vehicle_type = determine_vehicle_type(address)
        
        WarehouseDeliveryOrderItem.objects.create(
            delivery_order=delivery_order,
            row_number=idx,
            product=product,
            quantity=address.order_weight,
            vehicle_type=vehicle_type,
            receiver=receiver,
            receiver_address=address.delivery_address,
            receiver_postal_code=address.delivery_postal_code or '',
            receiver_phone=address.coordination_phone or '',
            receiver_unique_id=address.recipient_unique_id or address.assignment_id,
        )
    
    return delivery_order


def generate_delivery_order_number():
    """تولید شماره حواله خروج"""
    today = jdatetime.date.today()
    year_month = today.strftime('%y%m')
    prefix = f"DLV{year_month}"
    
    # پیدا کردن آخرین شماره
    from django.db.models import Max
    last_order = WarehouseDeliveryOrder.objects.filter(
        number__startswith=prefix
    ).aggregate(Max('number'))['number__max']
    
    if last_order:
        try:
            last_num = int(last_order[-4:])
            new_num = last_num + 1
        except:
            new_num = 1
    else:
        new_num = 1
    
    return f"{prefix}{new_num:04d}"


def get_or_create_default_product(offer):
    """پیدا کردن یا ایجاد محصول پیش‌فرض"""
    try:
        # اگر محصول مشخصی در عرضه وجود دارد
        if hasattr(offer, 'marketplace_product') and offer.marketplace_product:
            product_name = offer.marketplace_product.marketplace_name
        else:
            product_name = "محصول بازارگاه"
        
        product, created = Product.objects.get_or_create(
            name=product_name,
            defaults={
                'description': f'محصول ایجاد شده از بازارگاه - عرضه {offer.offer_id}',
                'unit': 'کیلو'
            }
        )
        return product
    except:
        # محصول پیش‌فرض
        product, created = Product.objects.get_or_create(
            name="محصول بازارگاه",
            defaults={
                'description': 'محصول پیش‌فرض برای بازارگاه',
                'unit': 'کیلو'
            }
        )
        return product


def get_or_create_receiver_from_address(address):
    """ایجاد یا پیدا کردن گیرنده از آدرس"""
    
    # استفاده از شناسه یکتای تحویل به عنوان unique_id
    unique_id = address.recipient_unique_id or f"MP-{address.assignment_id}"
    
    receiver, created = Receiver.objects.get_or_create(
        unique_id=unique_id,
        defaults={
            'receiver_type': 'individual' if address.buyer_user_type == 'individual' else 'legal',
            'full_name': address.recipient_name or address.buyer_name,
            'company_name': address.recipient_name if address.buyer_user_type == 'company' else '',
            'personal_code': address.delivery_national_id[:10] if address.delivery_national_id and len(address.delivery_national_id) <= 10 else '',
            'national_id': address.delivery_national_id if address.delivery_national_id and len(address.delivery_national_id) > 10 else '',
            'phone': address.coordination_phone or address.buyer_mobile,
            'address': address.delivery_address,
            'postal_code': address.delivery_postal_code or '',
            'description': f'گیرنده ایجاد شده از بازارگاه - آدرس {address.assignment_id}'
        }
    )
    
    return receiver


def determine_vehicle_type(address):
    """تعیین نوع وسیله حمل از آدرس"""
    if address.vehicle_trailer:
        return 'container'  # تریلی به کانتینر
    elif address.vehicle_double:
        return 'truck'  # جفت به کامیون
    elif address.vehicle_single:
        return 'pickup'  # تک به وانت
    else:
        return 'other'  # پیش‌فرض


@staff_member_required
def address_detail(request, address_id):
    """جزئیات آدرس"""
    address = get_object_or_404(DeliveryAddress, id=address_id)
    
    context = {
        'address': address,
    }
    
    return render(request, 'marketplace/address_detail.html', context)


@staff_member_required 
def single_send_to_delivery(request, address_id):
    """ارسال تکی آدرس برای ایجاد حواله"""
    if request.method != 'POST':
        return redirect('marketplace:address_list')
    
    try:
        address = get_object_or_404(DeliveryAddress, id=address_id, status='pending')
        
        with transaction.atomic():
            offer = address.purchase_detail.purchase.marketplace_sale.product_offer
            warehouse = offer.warehouse_receipt.warehouse if offer.warehouse_receipt else None
            
            if not warehouse:
                messages.error(request, 'انبار برای این عرضه تعیین نشده است')
                return redirect('marketplace:address_list')
            
            # ایجاد حواله
            delivery_order = create_delivery_order_for_addresses(warehouse, offer, [address])
            
            # به‌روزرسانی وضعیت
            address.status = 'delivery_created'
            address.delivery_order_number = delivery_order.number
            address.save()
            
            messages.success(request, f'حواله خروج {delivery_order.number} ایجاد شد')
            
    except Exception as e:
        messages.error(request, f'خطا در ایجاد حواله: {str(e)}')
    
    return redirect('marketplace:address_list')