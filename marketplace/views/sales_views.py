# marketplace/views/sales_views.py
from django.shortcuts import render, redirect
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib import messages
from django.urls import reverse
from ..models import MarketplaceSale
from ..forms import MarketplaceSaleCreateForm
from .purchase_views import PurchaseExcelHandler


@staff_member_required
def create_sale_with_excel(request):
    """ایجاد فروش بازارگاه با امکان آپلود اکسل خریدها"""
    
    if request.method == 'POST':
        form = MarketplaceSaleCreateForm(request.POST, request.FILES)
        
        if form.is_valid():
            # ایجاد فروش
            sale = form.save()
            
            # بررسی وجود فایل اکسل
            excel_file = request.FILES.get('excel_file')
            if excel_file:
                # پردازش فایل اکسل
                handler = PurchaseExcelHandler()
                created_purchases, errors = handler.process_purchases_upload(excel_file, sale)
                
                if errors:
                    for error in errors:
                        messages.error(request, error)
                
                if created_purchases:
                    messages.success(
                        request, 
                        f'فروش با موفقیت ایجاد شد. تعداد {len(created_purchases)} خرید از فایل اکسل ثبت شد.'
                    )
                else:
                    messages.warning(request, 'فروش ایجاد شد اما هیچ خریدی از فایل اکسل ثبت نشد.')
            else:
                messages.success(request, 'فروش با موفقیت ایجاد شد. می‌توانید خریدها را به صورت دستی اضافه کنید.')
            
            # هدایت به صفحه ویرایش فروش در ادمین
            return redirect(f'/admin/marketplace/marketplacesale/{sale.id}/change/')
    else:
        form = MarketplaceSaleCreateForm()
    
    return render(request, 'marketplace/create_sale_with_excel.html', {
        'form': form,
        'title': 'ایجاد فروش بازارگاه'
    })