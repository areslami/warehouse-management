# marketplace/urls.py

from django.urls import path
from . import views

app_name = 'marketplace'

urlpatterns = [
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