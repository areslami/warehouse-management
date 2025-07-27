from django.urls import path
from .views import reports, excel_ops

app_name = 'warehouse'

urlpatterns = [
    # داشبورد اصلی
    path('', reports.DashboardView.as_view(), name='dashboard'),
    
    # گزارش‌ها
    path('reports/warehouse/', reports.WarehouseReportView.as_view(), name='warehouse_report'),
    path('reports/purchase/', reports.PurchaseReportView.as_view(), name='purchase_report'),
    path('reports/sales/', reports.SalesReportView.as_view(), name='sales_report'),
    
    # APIهای چارت
    path('api/warehouse-chart/', reports.warehouse_chart_data, name='warehouse_chart_data'),
    path('api/monthly-sales-chart/', reports.monthly_sales_chart_data, name='monthly_sales_chart_data'),
    
    # API اطلاعات گیرنده
    path('api/receiver/<int:receiver_id>/', excel_ops.get_receiver_info, name='get_receiver_info'),
    
    # آپلود و دانلود اکسل حواله
    path('delivery-order/<int:delivery_order_id>/upload-excel/', 
         excel_ops.upload_delivery_order_excel, name='upload_delivery_order_excel'),
    path('delivery-order/<int:delivery_order_id>/download-excel/', 
         excel_ops.download_delivery_order_excel, name='download_delivery_order_excel'),
    path('delivery-order/template-excel/', 
         excel_ops.download_delivery_order_template, name='download_delivery_order_template'),
]