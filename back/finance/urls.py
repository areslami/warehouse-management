from django.urls import path
from .views import finance_main

urlpatterns=[
    path('',finance_main,name='finance-main')
]