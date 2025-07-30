# marketplace/urls.py

from django.urls import path
from . import views
from .views.sales_views import create_sale_with_excel
from .views.address_management import (
    delivery_address_list, bulk_send_to_delivery, 
    address_detail, single_send_to_delivery
)
from .views.address_management_new import bulk_send_to_delivery_new

app_name = 'marketplace'

urlpatterns = [
    # ایجاد فروش با اکسل
    path('sales/create-with-excel/', 
         create_sale_with_excel, name='create_sale_with_excel'),
    
    # مدیریت آدرس‌های تحویل
    path('addresses/', 
         delivery_address_list, name='address_list'),
    path('addresses/<int:address_id>/', 
         address_detail, name='address_detail'),
    path('addresses/bulk-send-to-delivery/', 
         bulk_send_to_delivery_new, name='bulk_send_to_delivery'),
    path('addresses/<int:address_id>/send-to-delivery/', 
         single_send_to_delivery, name='single_send_to_delivery'),
    
    # عملیات اکسل برای خریدها
    path('sales/<int:sale_id>/download-purchases/', 
         views.download_purchases_excel, name='download_purchases_excel'),
    path('sales/<int:sale_id>/upload-purchases/', 
         views.upload_purchases_excel, name='upload_purchases_excel'),
    path('purchases/template/', 
         views.download_purchases_template, name='download_purchases_template'),
    
    # عملیات اکسل برای آدرس‌های تحویل
    path('purchase-details/<int:purchase_detail_id>/upload-addresses/', 
         views.upload_delivery_addresses, name='upload_delivery_addresses'),
    path('delivery-addresses/template/', 
         views.download_delivery_template, name='download_delivery_template'),
]