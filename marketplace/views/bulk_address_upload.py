# marketplace/views/bulk_address_upload.py
from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.admin.views.decorators import staff_member_required
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction
import pandas as pd
import logging
from ..models.sales_purchase import MarketplacePurchase, MarketplacePurchaseDetail
from ..models.delivery_logistics import DeliveryAddress
from datetime import datetime
import jdatetime

logger = logging.getLogger(__name__)


@staff_member_required
def bulk_address_upload_view(request):
    """صفحه آپلود بالک آدرس‌های تحویل"""
    if request.method == 'POST':
        if 'excel_file' not in request.FILES:
            messages.error(request, 'لطفا فایل اکسل را انتخاب کنید')
            return render(request, 'marketplace/bulk_address_upload.html')
        
        excel_file = request.FILES['excel_file']
        
        # بررسی نوع فایل
        if not excel_file.name.endswith(('.xlsx', '.xls')):
            messages.error(request, 'فقط فایل‌های اکسل (.xlsx, .xls) پذیرفته می‌شوند')
            return render(request, 'marketplace/bulk_address_upload.html')
        
        try:
            # خواندن فایل اکسل
            df = pd.read_excel(excel_file)
            
            # پردازش داده‌ها
            result = process_bulk_addresses(df)
            
            if result['success']:
                messages.success(request, f'با موفقیت {result["processed"]} آدرس پردازش شد. {result["created"]} آدرس جدید ایجاد شد.')
                if result['errors']:
                    messages.warning(request, f'تعداد {len(result["errors"])} خطا رخ داد.')
            else:
                messages.error(request, f'خطا در پردازش: {result["message"]}')
                
            # نمایش جزئیات خطاها
            return render(request, 'marketplace/bulk_address_upload.html', {
                'result': result
            })
            
        except Exception as e:
            logger.error(f"Error in bulk address upload: {str(e)}")
            messages.error(request, f'خطا در پردازش فایل: {str(e)}')
    
    return render(request, 'marketplace/bulk_address_upload.html')


def process_bulk_addresses(df):
    """پردازش داده‌های اکسل و ایجاد آدرس‌های تحویل"""
    
    # فیلدهای مورد انتظار در اکسل
    required_fields = [
        'شناسه خرید',  # purchase_id
        'نام خریدار',
        'شناسه ملی خریدار', 
        'شماره همراه خریدار',
        'آدرس خریدار',
        'نام تحویل گیرنده',
        'آدرس تحویل',
        'شماره هماهنگی تحویل',
        'وزن سفارش'
    ]
    
    # بررسی وجود فیلدهای ضروری
    missing_fields = []
    for field in required_fields:
        if field not in df.columns:
            missing_fields.append(field)
    
    if missing_fields:
        return {
            'success': False,
            'message': f'فیلدهای ضروری موجود نیست: {", ".join(missing_fields)}',
            'errors': [],
            'processed': 0,
            'created': 0
        }
    
    errors = []
    processed = 0
    created = 0
    
    with transaction.atomic():
        for index, row in df.iterrows():
            try:
                # دریافت شناسه خرید
                purchase_id = str(row['شناسه خرید']).strip()
                
                if not purchase_id or purchase_id == 'nan':
                    errors.append(f'ردیف {index + 1}: شناسه خرید خالی است')
                    continue
                
                # پیدا کردن خرید
                try:
                    purchase = MarketplacePurchase.objects.get(purchase_id=purchase_id)
                except MarketplacePurchase.DoesNotExist:
                    errors.append(f'ردیف {index + 1}: شناسه خرید {purchase_id} یافت نشد')
                    continue
                
                # ایجاد یا دریافت MarketplacePurchaseDetail
                purchase_detail, _ = MarketplacePurchaseDetail.objects.get_or_create(
                    purchase=purchase
                )
                
                # آماده‌سازی داده‌های آدرس
                address_data = prepare_address_data(row, purchase_detail, index)
                
                if address_data['error']:
                    errors.append(f'ردیف {index + 1}: {address_data["error"]}')
                    continue
                
                # بررسی وجود آدرس قبلی برای این خرید
                existing_address = DeliveryAddress.objects.filter(
                    purchase_detail=purchase_detail
                ).first()
                
                if existing_address:
                    # به‌روزرسانی آدرس موجود
                    for key, value in address_data['data'].items():
                        setattr(existing_address, key, value)
                    existing_address.save()
                else:
                    # ایجاد آدرس جدید
                    DeliveryAddress.objects.create(**address_data['data'])
                    created += 1
                
                processed += 1
                
            except Exception as e:
                errors.append(f'ردیف {index + 1}: خطای غیرمنتظره - {str(e)}')
                logger.error(f"Error processing row {index + 1}: {str(e)}")
                continue
    
    return {
        'success': True,
        'message': 'پردازش با موفقیت انجام شد',
        'errors': errors,
        'processed': processed,
        'created': created
    }


def prepare_address_data(row, purchase_detail, row_index):
    """آماده‌سازی داده‌های آدرس از ردیف اکسل"""
    
    try:
        # داده‌های اصلی
        purchase = purchase_detail.purchase
        
        data = {
            'purchase_detail': purchase_detail,
            'code': str(row.get('شناسه خرید', '')),
            'total_purchase_weight': float(row.get('وزن سفارش', 0)),
            'purchase_date': purchase.purchase_date,
            'unit_price': purchase.unit_price,
            'tracking_number': str(row.get('شماره پیگیری', '')),
            'province': str(row.get('استان', purchase.province)),
            'city': str(row.get('شهرستان', '')),
            'paid_amount': purchase.paid_amount,
            'buyer_account_number': str(row.get('شماره حساب خریدار', '')),
            'cottage_code': purchase.cottage_number,
            'product_title': purchase.product_title,
            'description': str(row.get('توضیحات', '')),
            'payment_method': purchase.purchase_type,
            'offer_id': str(row.get('شناسه عرضه', purchase.supply_id)),
            'address_registration_date': jdatetime.date.today(),
            'assignment_id': f"BULK_{purchase.purchase_id}_{row_index}",
            'buyer_name': str(row.get('نام خریدار', purchase.buyer_name)),
            'buyer_national_id': str(row.get('شناسه ملی خریدار', purchase.buyer_national_id)),
            'buyer_postal_code': str(row.get('کدپستی خریدار', '')),
            'buyer_address': str(row.get('آدرس خریدار', '')),
            'deposit_id': str(row.get('شناسه واریز', '')),
            'buyer_mobile': str(row.get('شماره همراه خریدار', purchase.buyer_mobile)),
            'buyer_unique_id': str(row.get('شناسه یکتا خریدار', purchase.buyer_national_id)),
            'buyer_user_type': determine_user_type(str(row.get('شناسه ملی خریدار', purchase.buyer_national_id))),
            'recipient_name': str(row.get('نام تحویل گیرنده', '')),
            'recipient_unique_id': str(row.get('شناسه یکتای تحویل', '')),
            'delivery_address': str(row.get('آدرس تحویل', '')),
            'delivery_postal_code': str(row.get('کد پستی تحویل', '')),
            'coordination_phone': str(row.get('شماره هماهنگی تحویل', '')),
            'delivery_national_id': str(row.get('کد ملی تحویل', '')),
            'order_weight': float(row.get('وزن سفارش', 0)),
            'status': 'pending'
        }
        
        # تنظیم نوع وسیله حمل
        vehicle_type = str(row.get('نوع وسیله حمل', '')).lower()
        data['vehicle_single'] = 'تک' in vehicle_type or 'single' in vehicle_type
        data['vehicle_double'] = 'جفت' in vehicle_type or 'double' in vehicle_type  
        data['vehicle_trailer'] = 'تریلی' in vehicle_type or 'trailer' in vehicle_type
        
        # اعتبارسنجی داده‌های ضروری
        if not data['recipient_name']:
            return {'error': 'نام تحویل گیرنده ضروری است', 'data': None}
        
        if not data['delivery_address']:
            return {'error': 'آدرس تحویل ضروری است', 'data': None}
        
        if not data['coordination_phone']:
            return {'error': 'شماره هماهنگی تحویل ضروری است', 'data': None}
        
        if data['order_weight'] <= 0:
            return {'error': 'وزن سفارش باید بیشتر از صفر باشد', 'data': None}
        
        return {'error': None, 'data': data}
        
    except Exception as e:
        return {'error': f'خطا در آماده‌سازی داده‌ها: {str(e)}', 'data': None}


def determine_user_type(national_id):
    """تشخیص نوع کاربر بر اساس کد ملی"""
    if not national_id or national_id == 'nan':
        return 'individual'
    
    clean_id = ''.join(filter(str.isdigit, str(national_id)))
    
    if len(clean_id) == 10:
        return 'individual'  # حقیقی
    elif len(clean_id) == 11:
        return 'company'     # حقوقی
    else:
        return 'individual'  # پیش‌فرض