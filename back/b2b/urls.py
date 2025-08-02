from django.urls import path
from .views import b2b_main

urlpatterns=[
    path('',b2b_main,name='b2b-main')
]