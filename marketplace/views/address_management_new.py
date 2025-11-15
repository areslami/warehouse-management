# marketplace/views/address_management_new.py
from django.http import JsonResponse
from ..models.delivery_logistics import DeliveryAddress


def bulk_send_to_delivery_new(request):
    """ارسال بالک آدرس‌های تحویل به حواله خروج انبار - گروه‌بندی بر اساس شناسه خرید"""
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'فقط درخواست POST پذیرفته می‌شود'})
    
    address_ids = request.POST.getlist('address_ids')
    
    if not address_ids:
        return JsonResponse({'success': False, 'message': 'هیچ آدرسی انتخاب نشده است'})
    
    try:
        addresses = DeliveryAddress.objects.filter(id__in=address_ids)
        
        if not addresses.exists():
            return JsonResponse({'success': False, 'message': 'آدرس‌های انتخاب شده یافت نشد'})
        
        # گروه‌بندی آدرس‌ها بر اساس شناسه خرید
        addresses_by_purchase = group_addresses_by_purchase_id(addresses)
        
        created_orders = []
        
        # ایجاد پیش‌فاکتور و حواله برای هر شناسه خرید
        for purchase_id, address_group in addresses_by_purchase.items():
            try:
                # ایجاد پیش‌فاکتور فروش برای این شناسه خرید
                sales_proforma = create_sales_proforma_for_purchase(purchase_id, address_group)
                
                # ایجاد حواله خروج برای این شناسه خرید
                delivery_order = create_delivery_order_for_purchase(purchase_id, address_group, sales_proforma)
                
                created_orders.append(delivery_order.number)
                
                # به‌روزرسانی وضعیت آدرس‌ها
                DeliveryAddress.objects.filter(id__in=[addr.id for addr in address_group]).update(
                    status='sent_to_delivery',
                    delivery_order_number=delivery_order.number
                )
                
            except Exception as e:
                # در صورت خطا در یک گروه، ادامه دهیم
                print(f"خطا در ایجاد حواله برای شناسه خرید {purchase_id}: {str(e)}")
                continue
        
        if created_orders:
            return JsonResponse({
                'success': True,
                'message': f'{len(created_orders)} حواله خروج ایجاد شد: {", ".join(created_orders)}',
                'delivery_orders': created_orders
            })
        else:
            return JsonResponse({
                'success': False,
                'message': 'هیچ حواله‌ای ایجاد نشد'
            })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'خطا در ایجاد حواله: {str(e)}'
        })


def group_addresses_by_purchase_id(addresses):
    """گروه‌بندی آدرس‌ها بر اساس شناسه خرید"""
    grouped = {}
    
    for address in addresses:
        try:
            # دریافت شناسه خرید از آدرس
            purchase_id = address.code  # فیلد code همان شناسه خرید است
            
            if purchase_id not in grouped:
                grouped[purchase_id] = []
            
            grouped[purchase_id].append(address)
            
        except Exception as e:
            print(f"خطا در گروه‌بندی آدرس {address.id}: {str(e)}")
            continue
    
    return grouped


def create_sales_proforma_for_purchase(purchase_id, addresses):
    """ایجاد پیش‌فاکتور فروش برای یک شناسه خرید"""
    from django.utils import timezone
    from decimal import Decimal
    from warehouse.models.proformas import SalesProforma, SalesProformaItem
    from warehouse.models.parties import Customer
    from warehouse.models.base import Product
    from marketplace.models.sales_purchase import MarketplacePurchase
    
    try:
        # پیدا کردن خرید بازارگاه
        marketplace_purchase = MarketplacePurchase.objects.get(purchase_id=purchase_id)
        
        # ایجاد یا پیدا کردن مشتری بر اساس اطلاعات خرید
        customer = marketplace_purchase.get_or_create_customer()
        if not customer:
            # ایجاد مشتری پیش‌فرض
            customer, created = Customer.objects.get_or_create(
                company_name=f'بازارگاه - {marketplace_purchase.buyer_name}',
                defaults={
                    'customer_type': 'natural',
                    'full_name': marketplace_purchase.buyer_name,
                    'phone': marketplace_purchase.buyer_mobile,
                    'address': marketplace_purchase.province,
                    'postal_code': '0000000000',
                    'description': f'مشتری بازارگاه - شناسه خرید {purchase_id}'
                }
            )
        
        # تولید شماره پیش‌فاکتور
        proforma_number = generate_sales_proforma_number()
        
        # ایجاد پیش‌فاکتور فروش
        sales_proforma = SalesProforma.objects.create(
            number=proforma_number,
            date=timezone.now().date(),
            customer=customer,
            description=f"بازارگاه - شناسه خرید {purchase_id} - {marketplace_purchase.product_title}",
        )
        
        # دریافت کالا از عرضه مربوطه
        marketplace_sale = marketplace_purchase.marketplace_sale
        product_offer = marketplace_sale.product_offer
        product = product_offer.product
        
        # محاسبه مجموع وزن این شناسه خرید
        total_weight = sum(Decimal(str(addr.order_weight or 0)) for addr in addresses)
        
        # ایجاد آیتم پیش‌فاکتور
        SalesProformaItem.objects.create(
            proforma=sales_proforma,
            row_number=1,
            product=product,
            quantity=total_weight,
            unit_price=marketplace_purchase.unit_price,
            total_price=total_weight * marketplace_purchase.unit_price
        )
        
        return sales_proforma
        
    except MarketplacePurchase.DoesNotExist:
        raise ValueError(f"شناسه خرید {purchase_id} در سیستم یافت نشد")
    except Exception as e:
        raise ValueError(f"خطا در ایجاد پیش‌فاکتور برای شناسه خرید {purchase_id}: {str(e)}")


def create_delivery_order_for_purchase(purchase_id, addresses, sales_proforma):
    """ایجاد حواله خروج برای یک شناسه خرید"""
    from django.utils import timezone
    from decimal import Decimal
    from warehouse.models.warehouse_ops import WarehouseDeliveryOrder, WarehouseDeliveryOrderItem
    from warehouse.models.parties import Receiver, ShippingCompany
    from warehouse.models.base import Product, Warehouse
    
    # انتخاب انبار پیش‌فرض
    warehouse = Warehouse.objects.first()
    if not warehouse:
        raise ValueError("هیچ انباری تعریف نشده است")
    
    # پیدا کردن یا ایجاد شرکت حمل پیش‌فرض
    default_shipping, created = ShippingCompany.objects.get_or_create(
        name='شرکت حمل پیش‌فرض بازارگاه',
        defaults={
            'contact_person': 'نامشخص',
            'phone': '021-88888888',
            'address': 'نامشخص - بعداً تکمیل شود',
            'description': 'شرکت حمل پیش‌فرض برای حواله‌های بازارگاه - بعداً قابل ویرایش'
        }
    )
    
    # تولید شماره حواله
    from .address_management import generate_delivery_order_number
    delivery_number = generate_delivery_order_number()
    
    # ایجاد حواله خروج
    delivery_order = WarehouseDeliveryOrder.objects.create(
        number=delivery_number,
        issue_date=timezone.now().date(),
        validity_date=timezone.now().date() + timezone.timedelta(days=30),
        warehouse=warehouse,
        description=f"بازارگاه - شناسه خرید {purchase_id}",
        sales_proforma=sales_proforma,
        shipping_company=default_shipping,
    )
    
    # دریافت محصول از پیش‌فاکتور
    proforma_item = sales_proforma.items.first()
    product = proforma_item.product if proforma_item else Product.objects.first()
    
    # ایجاد آیتم‌های حواله برای هر آدرس تحویل
    for i, address in enumerate(addresses, 1):
        # استفاده از شناسه یکتای گیرنده از اکسل یا تولید خودکار
        receiver_unique_id = address.recipient_unique_id if address.recipient_unique_id else f"MP-{purchase_id}-{address.assignment_id}"
        
        # تنظیم داده‌ها با رعایت محدودیت طول
        postal_code = str(address.delivery_postal_code or '0000000000')[:10]
        personal_code = str(address.delivery_national_id or '0000000000')[:10]
        
        receiver, created = Receiver.objects.get_or_create(
            unique_id=receiver_unique_id,
            defaults={
                'receiver_type': 'natural',
                'full_name': address.recipient_name or address.buyer_name or 'نامشخص',
                'phone': address.coordination_phone or address.buyer_mobile or '',
                'address': address.delivery_address or 'آدرس نامشخص',
                'postal_code': postal_code,
                'personal_code': personal_code,
            }
        )
        
        # ایجاد آیتم حواله برای این گیرنده
        WarehouseDeliveryOrderItem.objects.create(
            delivery_order=delivery_order,
            row_number=i,
            product=product,
            quantity=Decimal(str(address.order_weight or 0)),
            vehicle_type='truck',  # نوع وسیله حمل پیش‌فرض
            receiver=receiver,
            receiver_address=address.delivery_address or 'آدرس نامشخص',
            receiver_postal_code=postal_code,
            receiver_phone=address.coordination_phone or address.buyer_mobile or '',
            receiver_unique_id=receiver_unique_id
        )
    
    return delivery_order


def generate_sales_proforma_number():
    """تولید شماره پیش‌فاکتور فروش"""
    import jdatetime
    from django.db.models import Max
    from warehouse.models.proformas import SalesProforma
    
    today = jdatetime.date.today()
    year_month = today.strftime('%y%m')
    prefix = f"SF-MP-{year_month}"  # SF-MP = Sales proForma MarketPlace
    
    # پیدا کردن آخرین شماره
    last_proforma = SalesProforma.objects.filter(
        number__startswith=prefix
    ).aggregate(max_number=Max('number'))['max_number']
    
    if last_proforma:
        try:
            last_seq = int(last_proforma[-4:])
            new_seq = last_seq + 1
        except (ValueError, IndexError):
            new_seq = 1
    else:
        new_seq = 1
    
    return f"{prefix}{new_seq:04d}"