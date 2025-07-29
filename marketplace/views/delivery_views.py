# marketplace/views/delivery_views.py
from django.shortcuts import get_object_or_404, redirect
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib import messages
import openpyxl
from decimal import Decimal
from ..models import MarketplacePurchaseDetail, DeliveryAddress
from .mixins import ExcelResponseMixin, PersianDateMixin, DataCleaningMixin


class DeliveryAddressProcessor(ExcelResponseMixin, PersianDateMixin, DataCleaningMixin):
    """Processor for delivery address Excel operations"""
    
    def create_delivery_template(self):
        """Create Excel template for delivery addresses"""
        workbook = openpyxl.Workbook()
        sheet = workbook.active
        sheet.title = "نمونه آدرس تحویل"
        
        # Headers for all required fields
        headers = [
            'کد', 'وزن کل خرید', 'تاریخ خرید', 'قیمت هر واحد', 'شماره پیگیری',
            'استان', 'شهرستان', 'مبلغ پرداختی', 'شماره حساب خریدار', 'کد کوتاژ',
            'عنوان کالا', 'توضیحات', 'شیوه پرداخت', 'شناسه عرضه', 'تاریخ ثبت آدرس',
            'شناسه تخصیص', 'نام خریدار', 'شناسه ملی خریدار', 'کدپستی خریدار',
            'آدرس خریدار', 'شناسه واریز', 'شماره همراه خریدار', 'شناسه یکتا خریدار',
            'نوع کاربری خریدار', 'نام تحویل گیرنده', 'شناسه یکتای تحویل', 'تک',
            'جفت', 'تریلی', 'آدرس تحویل', 'کد پستی تحویل', 'شماره هماهنگی تحویل',
            'کد ملی تحویل', 'وزن سفارش', 'بازه 1 پرداخت توافقی (روز)',
            'بازه 2 پرداخت توافقی (روز)', 'بازه 3 پرداخت توافقی (روز)',
            'مبلغ بازه 1 توافقی-ریال', 'مبلغ بازه 2 توافقی-ریال', 'مبلغ بازه 3 توافقی-ریال',
            'وزن بارنامه شده', 'وزن بارنامه نشده'
        ]
        
        # Create styled header
        self.create_styled_header(sheet, headers)
        
        # Sample data
        sample_data = [
            'BUY001', 25.5, '1403/10/15', 2000000, 'TRK001', 'تهران', 'تهران',
            51000000, '1234567890123456', 'CTG001', 'سیمان پرتلند', 'سفارش عادی',
            'نقدی', 'OFF001', '1403/10/16', 'ADDR001', 'احمد محمدی', '1234567890',
            '1234567890', 'تهران، خیابان آزادی', 'DEP001', '09123456789', 'USR001',
            'حقیقی', 'علی احمدی', 'REC001', 'بله', 'خیر', 'خیر',
            'تهران، خیابان انقلاب', '1234567890', '09987654321', '0987654321',
            25.5, '', '', '', '', '', '', 0, 0
        ]
        
        # Write sample data
        for col_idx, value in enumerate(sample_data, 1):
            sheet.cell(row=2, column=col_idx, value=value)
        
        # Set column widths
        for col_idx in range(1, len(headers) + 1):
            sheet.column_dimensions[openpyxl.utils.get_column_letter(col_idx)].width = 15
        
        return workbook
    
    def process_delivery_upload(self, file, purchase_detail):
        """Process uploaded delivery addresses Excel file"""
        try:
            workbook = openpyxl.load_workbook(file)
            sheet = workbook.active
            
            success_count = 0
            error_rows = []
            
            # Remove old addresses
            old_count = purchase_detail.delivery_addresses.count()
            purchase_detail.delivery_addresses.all().delete()
            
            for row_idx, row in enumerate(sheet.iter_rows(min_row=2, values_only=True), start=2):
                if not any(row):  # Skip empty rows
                    continue
                
                try:
                    # Validate main fields
                    code = str(row[0]).strip() if row[0] else ''
                    if not code:
                        error_rows.append(f"ردیف {row_idx}: کد خالی است")
                        continue
                    
                    # Process fields with data cleaning
                    total_purchase_weight = self._safe_decimal(row[1])
                    purchase_date = self.persian_to_gregorian(str(row[2]).strip() if row[2] else '')
                    unit_price = self._safe_decimal(row[3])
                    tracking_number = str(row[4]).strip() if row[4] else ''
                    province = str(row[5]).strip() if row[5] else ''
                    city = str(row[6]).strip() if row[6] else ''
                    paid_amount = self._safe_decimal(row[7])
                    buyer_account_number = str(row[8]).strip() if row[8] else ''
                    cottage_code = str(row[9]).strip() if row[9] else ''
                    product_title = str(row[10]).strip() if row[10] else ''
                    description = str(row[11]).strip() if row[11] else ''
                    payment_method = str(row[12]).strip() if row[12] else ''
                    offer_id = str(row[13]).strip() if row[13] else ''
                    address_registration_date = self.persian_to_gregorian(str(row[14]).strip() if row[14] else '')
                    assignment_id = str(row[15]).strip() if row[15] else ''
                    buyer_name = str(row[16]).strip() if row[16] else ''
                    buyer_national_id = self.clean_national_id(row[17])
                    buyer_postal_code = self.clean_postal_code(row[18])
                    buyer_address = str(row[19]).strip() if row[19] else ''
                    deposit_id = str(row[20]).strip() if row[20] else ''
                    buyer_mobile = self.clean_phone_number(row[21])
                    buyer_unique_id = str(row[22]).strip() if row[22] else ''
                    buyer_user_type = self._map_user_type(str(row[23]).strip() if row[23] else '')
                    recipient_name = str(row[24]).strip() if row[24] else ''
                    recipient_unique_id = str(row[25]).strip() if row[25] else ''
                    
                    # Vehicle types
                    vehicle_single = self._safe_boolean(row[26])
                    vehicle_double = self._safe_boolean(row[27])
                    vehicle_trailer = self._safe_boolean(row[28])
                    
                    delivery_address = str(row[29]).strip() if row[29] else ''
                    delivery_postal_code = self.clean_postal_code(row[30])
                    coordination_phone = self.clean_phone_number(row[31])
                    delivery_national_id = self.clean_national_id(row[32])
                    order_weight = self._safe_decimal(row[33])
                    
                    # Payment periods (optional)
                    payment_period_1_days = self._safe_integer(row[34])
                    payment_period_2_days = self._safe_integer(row[35])
                    payment_period_3_days = self._safe_integer(row[36])
                    payment_amount_1 = self._safe_decimal(row[37])
                    payment_amount_2 = self._safe_decimal(row[38])
                    payment_amount_3 = self._safe_decimal(row[39])
                    
                    # Shipping weights
                    shipped_weight = self._safe_decimal(row[40])
                    unshipped_weight = self._safe_decimal(row[41])
                    
                    # Validate required fields
                    if not assignment_id:
                        error_rows.append(f"ردیف {row_idx}: شناسه تخصیص الزامی است")
                        continue
                    
                    if not buyer_name:
                        error_rows.append(f"ردیف {row_idx}: نام خریدار الزامی است")
                        continue
                    
                    # Check for duplicate assignment_id
                    if DeliveryAddress.objects.filter(assignment_id=assignment_id).exists():
                        error_rows.append(f"ردیف {row_idx}: شناسه تخصیص {assignment_id} قبلاً ثبت شده است")
                        continue
                    
                    # Create delivery address
                    DeliveryAddress.objects.create(
                        purchase_detail=purchase_detail,
                        code=code,
                        total_purchase_weight=total_purchase_weight,
                        purchase_date=purchase_date or purchase_detail.purchase.purchase_date,
                        unit_price=unit_price,
                        tracking_number=tracking_number,
                        province=province,
                        city=city,
                        paid_amount=paid_amount,
                        buyer_account_number=buyer_account_number,
                        cottage_code=cottage_code,
                        product_title=product_title,
                        description=description,
                        payment_method=payment_method,
                        offer_id=offer_id,
                        address_registration_date=address_registration_date or purchase_detail.purchase.purchase_date,
                        assignment_id=assignment_id,
                        buyer_name=buyer_name,
                        buyer_national_id=buyer_national_id,
                        buyer_postal_code=buyer_postal_code,
                        buyer_address=buyer_address,
                        deposit_id=deposit_id,
                        buyer_mobile=buyer_mobile,
                        buyer_unique_id=buyer_unique_id,
                        buyer_user_type=buyer_user_type,
                        recipient_name=recipient_name,
                        recipient_unique_id=recipient_unique_id,
                        vehicle_single=vehicle_single,
                        vehicle_double=vehicle_double,
                        vehicle_trailer=vehicle_trailer,
                        delivery_address=delivery_address,
                        delivery_postal_code=delivery_postal_code,
                        coordination_phone=coordination_phone,
                        delivery_national_id=delivery_national_id,
                        order_weight=order_weight,
                        payment_period_1_days=payment_period_1_days,
                        payment_period_2_days=payment_period_2_days,
                        payment_period_3_days=payment_period_3_days,
                        payment_amount_1=payment_amount_1,
                        payment_amount_2=payment_amount_2,
                        payment_amount_3=payment_amount_3,
                        shipped_weight=shipped_weight,
                        unshipped_weight=unshipped_weight
                    )
                    
                    success_count += 1
                    
                except Exception as e:
                    error_rows.append(f"ردیف {row_idx}: خطا در پردازش - {str(e)}")
            
            return success_count, error_rows, old_count
            
        except Exception as e:
            return 0, [f"خطا در خواندن فایل: {str(e)}"], 0
    
    def _safe_decimal(self, value):
        """Safely convert value to Decimal"""
        if value is None or value == '':
            return Decimal('0')
        try:
            cleaned = self.clean_numeric_string(value)
            return Decimal(str(cleaned))
        except:
            return Decimal('0')
    
    def _safe_integer(self, value):
        """Safely convert value to integer"""
        if value is None or value == '':
            return None
        try:
            return int(float(str(value)))
        except:
            return None
    
    def _safe_boolean(self, value):
        """Safely convert value to boolean"""
        if value is None:
            return False
        value_str = str(value).strip().lower()
        return value_str in ['true', '1', 'yes', 'بله', 'درست']
    
    def _map_user_type(self, value):
        """Map Persian user type to English"""
        mapping = {
            'حقیقی': 'individual',
            'حقوقی': 'company'
        }
        return mapping.get(value, 'individual')


# View functions
@staff_member_required
def download_delivery_template(request):
    """دانلود نمونه فایل اکسل برای آدرس‌های تحویل"""
    processor = DeliveryAddressProcessor()
    workbook = processor.create_delivery_template()
    filename = "delivery_addresses_template.xlsx"
    return processor.create_excel_response(workbook, filename)


@staff_member_required
def upload_delivery_addresses(request, purchase_detail_id):
    """آپلود آدرس‌های تحویل با پردازش بهبود یافته"""
    purchase_detail = get_object_or_404(MarketplacePurchaseDetail, id=purchase_detail_id)
    
    if request.method == 'POST' and request.FILES.get('excel_file'):
        processor = DeliveryAddressProcessor()
        success_count, error_rows, old_count = processor.process_delivery_upload(
            request.FILES['excel_file'], purchase_detail
        )
        
        if old_count > 0:
            messages.info(request, f'🔄 {old_count} آدرس قبلی حذف شد')
        
        if error_rows:
            for error in error_rows:
                messages.error(request, error)
        
        if success_count > 0:
            messages.success(request, f'✅ تعداد {success_count} آدرس تحویل با موفقیت ثبت شد')
        else:
            messages.warning(request, '⚠️ هیچ آدرسی ثبت نشد')
        
        # Redirect back to admin
        return redirect(f'/admin/marketplace/marketplacepurchasedetail/{purchase_detail_id}/change/')
    
    # If not POST or no file, redirect back
    return redirect(f'/admin/marketplace/marketplacepurchasedetail/{purchase_detail_id}/change/')