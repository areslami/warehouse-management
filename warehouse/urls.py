from django.urls import path
from . import views

app_name = 'warehouse'

urlpatterns = [
    # داشبورد اصلی
    path('', views.DashboardView.as_view(), name='dashboard'),
    
    # گزارش‌ها
    path('reports/warehouse/', views.WarehouseReportView.as_view(), name='warehouse_report'),
    path('reports/purchase/', views.PurchaseReportView.as_view(), name='purchase_report'),
    path('reports/sales/', views.SalesReportView.as_view(), name='sales_report'),
    
    # APIهای چارت
    path('api/warehouse-chart/', views.warehouse_chart_data, name='warehouse_chart_data'),
    path('api/monthly-sales-chart/', views.monthly_sales_chart_data, name='monthly_sales_chart_data'),
    
    # آپلود و دانلود اکسل حواله
    path('delivery-order/<int:delivery_order_id>/upload-excel/', 
         views.upload_delivery_order_excel, name='upload_delivery_order_excel'),
    path('delivery-order/<int:delivery_order_id>/download-excel/', 
         views.download_delivery_order_excel, name='download_delivery_order_excel'),
    path('delivery-order/template-excel/', 
         views.download_delivery_order_template, name='download_delivery_order_template'),
]