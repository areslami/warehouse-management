# marketplace/views/purchase_views.py
from django.shortcuts import get_object_or_404, redirect
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib import messages
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment
import jdatetime
from decimal import Decimal
from ..models import MarketplaceSale, MarketplacePurchase, MarketplacePurchaseDetail
from .mixins import ExcelResponseMixin, PersianDateMixin, DataCleaningMixin


class PurchaseExcelHandler(ExcelResponseMixin, PersianDateMixin, DataCleaningMixin):
    """Handler for purchase-related Excel operations"""
    
    def create_purchases_excel(self, sale):
        """Create Excel file with purchase data"""
        workbook = openpyxl.Workbook()
        sheet = workbook.active
        sheet.title = f"خریدهای فروش {sale.product_offer.offer_id}"
        
        # Headers
        headers = [
            'شناسه خرید', 'وزن خرید', 'تاریخ خرید', 'نام خریدار',
            'شماره همراه خریدار', 'شماره ملی خریدار', 'مبلغ پرداختی', 'نوع خرید'
        ]
        
        # Create styled header
        self.create_styled_header(sheet, headers)
        
        # Purchase data
        purchases = sale.purchases.all().order_by('purchase_date')
        for row_idx, purchase in enumerate(purchases, 2):
            sheet.cell(row=row_idx, column=1, value=purchase.purchase_id)
            sheet.cell(row=row_idx, column=2, value=float(purchase.purchase_weight))
            sheet.cell(row=row_idx, column=3, value=self.gregorian_to_persian(purchase.purchase_date))
            sheet.cell(row=row_idx, column=4, value=purchase.buyer_name)
            sheet.cell(row=row_idx, column=5, value=purchase.buyer_mobile)
            sheet.cell(row=row_idx, column=6, value=purchase.buyer_national_id)
            sheet.cell(row=row_idx, column=7, value=int(purchase.paid_amount))
            sheet.cell(row=row_idx, column=8, value=purchase.get_purchase_type_display())
        
        # Set column widths
        column_widths = [15, 12, 12, 25, 15, 12, 15, 12]
        for col_idx, width in enumerate(column_widths, 1):
            sheet.column_dimensions[openpyxl.utils.get_column_letter(col_idx)].width = width
        
        return workbook
    
    def create_purchases_template(self):
        """Create Excel template for purchase uploads"""
        workbook = openpyxl.Workbook()
        sheet = workbook.active
        sheet.title = "نمونه خریدها"
        
        # Headers
        headers = [
            'شناسه خرید', 'وزن خرید (تن)', 'تاریخ خرید (شمسی)', 'نام خریدار',
            'شماره همراه خریدار', 'شماره ملی خریدار', 'مبلغ پرداختی (ریال)', 'نوع خرید'
        ]
        
        # Create styled header
        self.create_styled_header(sheet, headers)
        
        # Descriptions row
        descriptions = [
            'مثال: PUR001', '2.5', '1403/05/15', 'احمد محمدی',
            '09123456789', '1234567890', '50000000', 'نقدی یا توافقی'
        ]
        
        for col_idx, desc in enumerate(descriptions, 1):
            cell = sheet.cell(row=2, column=col_idx, value=desc)
            cell.alignment = Alignment(horizontal="center")
        
        # Set column widths
        column_widths = [15, 15, 18, 25, 18, 15, 20, 15]
        for col_idx, width in enumerate(column_widths, 1):
            sheet.column_dimensions[openpyxl.utils.get_column_letter(col_idx)].width = width
        
        return workbook
    
    def process_purchases_upload(self, file, sale):
        """Process uploaded Excel file and create purchases"""
        try:
            workbook = openpyxl.load_workbook(file)
            sheet = workbook.active
            
            created_purchases = []
            errors = []
            
            for row_idx, row in enumerate(sheet.iter_rows(min_row=2, values_only=True), start=2):
                if not any(row):  # Skip empty rows
                    continue
                
                try:
                    # Extract data from row
                    purchase_id = str(row[0]).strip() if row[0] else None
                    purchase_weight = self.clean_numeric_string(row[1])
                    purchase_date_str = str(row[2]).strip() if row[2] else None
                    buyer_name = str(row[3]).strip() if row[3] else ''
                    buyer_mobile = self.clean_phone_number(row[4])
                    buyer_national_id = self.clean_national_id(row[5])
                    paid_amount = self.clean_numeric_string(row[6])
                    purchase_type_str = str(row[7]).strip() if row[7] else ''
                    
                    # Validate required fields
                    if not purchase_id:
                        errors.append(f'ردیف {row_idx}: شناسه خرید الزامی است')
                        continue
                    
                    if not purchase_weight or purchase_weight <= 0:
                        errors.append(f'ردیف {row_idx}: وزن خرید باید بیشتر از صفر باشد')
                        continue
                    
                    # Convert Persian date
                    purchase_date = self.persian_to_gregorian(purchase_date_str)
                    if not purchase_date:
                        errors.append(f'ردیف {row_idx}: تاریخ خرید نامعتبر است')
                        continue
                    
                    # Map purchase type
                    purchase_type_mapping = {
                        'نقدی': 'cash',
                        'توافقی': 'agreement',
                        'ترکیبی': 'mixed'
                    }
                    purchase_type = purchase_type_mapping.get(purchase_type_str, 'cash')
                    
                    # Check for duplicate purchase_id
                    if MarketplacePurchase.objects.filter(purchase_id=purchase_id).exists():
                        errors.append(f'ردیف {row_idx}: شناسه خرید {purchase_id} قبلاً ثبت شده است')
                        continue
                    
                    # Create purchase
                    purchase = MarketplacePurchase.objects.create(
                        marketplace_sale=sale,
                        purchase_id=purchase_id,
                        purchase_weight=Decimal(str(purchase_weight)),
                        purchase_date=purchase_date,
                        buyer_name=buyer_name,
                        buyer_mobile=buyer_mobile,
                        buyer_national_id=buyer_national_id,
                        paid_amount=Decimal(str(paid_amount)),
                        purchase_type=purchase_type
                    )
                    
                    # Create purchase detail
                    MarketplacePurchaseDetail.objects.create(purchase=purchase)
                    
                    created_purchases.append(purchase)
                    
                except Exception as e:
                    errors.append(f'ردیف {row_idx}: خطا در پردازش - {str(e)}')
            
            return created_purchases, errors
            
        except Exception as e:
            return [], [f'خطا در خواندن فایل: {str(e)}']


# View functions
@staff_member_required
def download_purchases_excel(request, sale_id):
    """دانلود خریدهای یک فروش به فرمت اکسل"""
    sale = get_object_or_404(MarketplaceSale, id=sale_id)
    handler = PurchaseExcelHandler()
    workbook = handler.create_purchases_excel(sale)
    filename = f"purchases_{sale.product_offer.offer_id}.xlsx"
    return handler.create_excel_response(workbook, filename)


@staff_member_required
def download_purchases_template(request):
    """دانلود نمونه فایل اکسل برای آپلود خریدها"""
    handler = PurchaseExcelHandler()
    workbook = handler.create_purchases_template()
    filename = "purchases_template.xlsx"
    return handler.create_excel_response(workbook, filename)


@staff_member_required
def upload_purchases_excel(request, sale_id):
    """آپلود خریدها از فایل اکسل"""
    sale = get_object_or_404(MarketplaceSale, id=sale_id)
    
    if request.method == 'POST' and request.FILES.get('excel_file'):
        handler = PurchaseExcelHandler()
        created_purchases, errors = handler.process_purchases_upload(request.FILES['excel_file'], sale)
        
        if errors:
            for error in errors:
                messages.error(request, error)
        
        if created_purchases:
            messages.success(
                request, 
                f'تعداد {len(created_purchases)} خرید با موفقیت ثبت شد'
            )
            
        # Redirect back to admin
        return redirect(f'/admin/marketplace/marketplacesale/{sale_id}/change/')
    
    # If not POST or no file, redirect back
    return redirect(f'/admin/marketplace/marketplacesale/{sale_id}/change/')