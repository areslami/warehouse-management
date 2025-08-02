from django.urls import path
from .views import warehouse_main

urlpatterns = [
    path('',warehouse_main,name='warehouse-main')
    
]