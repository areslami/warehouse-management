
from django.contrib import admin
from django.urls import path, include
from django.shortcuts import redirect

urlpatterns = [
    path('admin/', admin.site.urls),
    path('warehouse/', include('warehouse.urls')),
    path('marketplace/', include('marketplace.urls')),  # اضافه کردن marketplace URLs
    path('', lambda request: redirect('warehouse:dashboard')),  # ریدایرکت به داشبورد
]