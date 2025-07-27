from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.admin.views.decorators import staff_member_required
from django.http import HttpResponse, JsonResponse
from django.contrib import messages
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment
import io
from ..models import (
    WarehouseDeliveryOrder, WarehouseDeliveryOrderItem, 
    Product, Receiver
)

@staff_member_required
def get_receiver_info(request, receiver_id):
    """API برای دریافت اطلاعات گیرنده"""
    try:
        receiver = get_object_or_404(Receiver, id=receiver_id)
        data = {
            'address': receiver.address,
            'phone': receiver.phone,
            'postal_code': receiver.postal_code,
            'unique_id': receiver.unique_id,
        }
        return JsonResponse(data)
    except:
        return JsonResponse({'error': 'گیرنده یافت نشد'}, status=404)

@staff_member_required
def upload_delivery_order_excel(request, delivery_order_id):
    """آپلود فایل اکسل برای آیتم‌های حواله خروج"""
    delivery_order = get_object_or_404(WarehouseDeliveryOrder, id=delivery_order_id)
    
    if request.method == 'POST' and request.FILES.get('excel_file'):
        excel_file = request.FILES['excel_file']
        
        try:
            # خواندن فایل اکسل
            workbook = openpyxl.load_workbook(excel_file)
            sheet = workbook.active
            
            success_count = 0
            error_rows = []
            
            # خواندن داده‌ها از ردیف دوم (ردیف اول هدر)
            for row_idx, row in enumerate(sheet.iter_rows(min_row=2, values_only=True), start=2):
                try:
                    if not any(row):  # ردیف خالی
                        continue
                        
                    product_code = str(row[0]).strip() if row[0] else None
                    quantity = float(row[1]) if row[1] else None
                    vehicle_type = str(row[2]).strip().lower() if row[2] else None
                    receiver_unique_id = str(row[3]).strip() if row[3] else None
                    
                    if not all([product_code, quantity, vehicle_type, receiver_unique_id]):
                        error_rows.append(f"ردیف {row_idx}: داده‌های ناقص")
                        continue
                    
                    # بررسی نوع وسیله حمل معتبر
                    valid_vehicles = ['truck', 'pickup', 'van', 'container', 'other']
                    if vehicle_type not in valid_vehicles:
                        error_rows.append(f"ردیف {row_idx}: نوع وسیله نامعتبر ({vehicle_type})")
                        continue
                    
                    # پیدا کردن کالا
                    product = Product.objects.get(code=product_code)
                    
                    # پیدا کردن گیرنده
                    receiver = Receiver.objects.get(unique_id=receiver_unique_id)
                    
                    # ایجاد آیتم حواله
                    item = WarehouseDeliveryOrderItem.objects.create(
                        delivery_order=delivery_order,
                        product=product,
                        quantity=quantity,
                        vehicle_type=vehicle_type,
                        receiver=receiver,
                        receiver_address=receiver.address,
                        receiver_postal_code=receiver.postal_code,
                        receiver_phone=receiver.phone,
                        receiver_unique_id=receiver.unique_id
                    )
                    success_count += 1
                    
                except Product.DoesNotExist:
                    error_rows.append(f"ردیف {row_idx}: کالا با کد '{product_code}' یافت نشد")
                except Receiver.DoesNotExist:
                    error_rows.append(f"ردیف {row_idx}: گیرنده با شناسه '{receiver_unique_id}' یافت نشد")
                except ValueError:
                    error_rows.append(f"ردیف {row_idx}: مقدار نامعتبر")
                except Exception as e:
                    error_rows.append(f"ردیف {row_idx}: {str(e)}")
            
            if success_count > 0:
                messages.success(request, f'✅ {success_count} آیتم با موفقیت اضافه شد')
            
            if error_rows:
                error_message = '❌ خطا در ردیف‌های: ' + ', '.join(error_rows[:5])
                if len(error_rows) > 5:
                    error_message += f' و {len(error_rows) - 5} خطای دیگر'
                messages.warning(request, error_message)
                
        except Exception as e:
            messages.error(request, f'❌ خطا در خواندن فایل: {str(e)}')
        
        return redirect(f'/admin/warehouse/warehousedeliveryorder/{delivery_order_id}/change/')
    
    context = {
        'delivery_order': delivery_order,
        'title': f'آپلود فایل اکسل برای حواله {delivery_order.number}'
    }
    return render(request, 'warehouse/upload_excel.html', context)

@staff_member_required
def download_delivery_order_excel(request, delivery_order_id):
    """دانلود آیتم‌های حواله خروج به فرمت اکسل"""
    delivery_order = get_object_or_404(WarehouseDeliveryOrder, id=delivery_order_id)
    
    # ایجاد فایل اکسل
    workbook = openpyxl.Workbook()
    sheet = workbook.active
    sheet.title = f"حواله {delivery_order.number}"
    
    # تنظیمات استایل
    header_font = Font(bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="366092", end_color="366092", fill_type="solid")
    center_alignment = Alignment(horizontal="center", vertical="center")
    
    # هدرها
    headers = [
        'ردیف', 'کالا', 'کد کالا', 'مقدار', 'واحد', 'نوع وسیله', 
        'گیرنده', 'شناسه گیرنده', 'تلفن گیرنده', 'آدرس گیرنده', 'کد پستی'
    ]
    
    for col_idx, header in enumerate(headers, 1):
        cell = sheet.cell(row=1, column=col_idx, value=header)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = center_alignment
    
    # داده‌های آیتم‌ها
    items = delivery_order.items.all().order_by('row_number')
    for row_idx, item in enumerate(items, 2):
        sheet.cell(row=row_idx, column=1, value=item.row_number)
        sheet.cell(row=row_idx, column=2, value=item.product.name)
        sheet.cell(row=row_idx, column=3, value=item.product.code)
        sheet.cell(row=row_idx, column=4, value=float(item.quantity))
        sheet.cell(row=row_idx, column=5, value=item.product.unit)
        sheet.cell(row=row_idx, column=6, value=item.get_vehicle_type_display())
        sheet.cell(row=row_idx, column=7, value=str(item.receiver))
        sheet.cell(row=row_idx, column=8, value=item.receiver_unique_id)
        sheet.cell(row=row_idx, column=9, value=item.receiver_phone)
        sheet.cell(row=row_idx, column=10, value=item.receiver_address)
        sheet.cell(row=row_idx, column=11, value=item.receiver_postal_code)
    
    # تنظیم عرض ستون‌ها
    column_widths = [8, 25, 15, 12, 10, 15, 25, 15, 15, 40, 12]
    for col_idx, width in enumerate(column_widths, 1):
        sheet.column_dimensions[openpyxl.utils.get_column_letter(col_idx)].width = width
    
    # ایجاد response
    response = HttpResponse(
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = f'attachment; filename="delivery_order_{delivery_order.number}.xlsx"'
    
    # نوشتن فایل در response
    virtual_workbook = io.BytesIO()
    workbook.save(virtual_workbook)
    virtual_workbook.seek(0)
    response.write(virtual_workbook.getvalue())
    
    return response

@staff_member_required
def download_delivery_order_template(request):
    """دانلود فایل نمونه برای آپلود حواله"""
    workbook = openpyxl.Workbook()
    sheet = workbook.active
    sheet.title = "نمونه حواله"
    
    # تنظیمات استایل
    header_font = Font(bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="366092", end_color="366092", fill_type="solid")
    center_alignment = Alignment(horizontal="center", vertical="center")
    
    # هدرها
    headers = ['کد کالا', 'مقدار', 'نوع وسیله حمل', 'شناسه گیرنده']
    descriptions = [
        'کد کالای تعریف شده در سیستم',
        'مقدار کالا (عدد)',
        'truck/pickup/van/container/other',
        'شناسه یکتای گیرنده'
    ]
    
    for col_idx, (header, desc) in enumerate(zip(headers, descriptions), 1):
        cell = sheet.cell(row=1, column=col_idx, value=header)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = center_alignment
        
        # توضیحات در ردیف دوم
        desc_cell = sheet.cell(row=2, column=col_idx, value=desc)
        desc_cell.font = Font(italic=True, color="666666")
    
    # نمونه داده
    sample_data = [
        ['K001', 100, 'truck', 'R001'],
        ['K002', 50, 'pickup', 'R002'],
    ]
    
    for row_idx, row_data in enumerate(sample_data, 3):
        for col_idx, value in enumerate(row_data, 1):
            sheet.cell(row=row_idx, column=col_idx, value=value)
    
    # تنظیم عرض ستون‌ها
    for col_idx in range(1, 5):
        sheet.column_dimensions[openpyxl.utils.get_column_letter(col_idx)].width = 25
    
    # ایجاد response
    response = HttpResponse(
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = 'attachment; filename="delivery_order_template.xlsx"'
    
    virtual_workbook = io.BytesIO()
    workbook.save(virtual_workbook)
    virtual_workbook.seek(0)
    response.write(virtual_workbook.getvalue())
    
    return response