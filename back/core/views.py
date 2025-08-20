from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend

from .models import Supplier, Customer, Receiver, Product
from .serializers import (
    SupplierSerializer, CustomerSerializer, ReceiverSerializer,
    ProductSerializer, ProductListSerializer,
)



class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'b2bregion']
    search_fields = ['name', 'code', 'b2bcode', 'description']
    ordering_fields = ['name', 'code', 'created_at']
    ordering = ['name']

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        return ProductSerializer

class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['supplier_type']
    search_fields = ['company_name', 'full_name', 'economic_code', 'phone']
    ordering_fields = ['company_name', 'full_name', 'created_at']
    ordering = ['company_name', 'full_name']
    


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['customer_type']
    search_fields = ['company_name', 'full_name', 'economic_code', 'phone', 'tags']
    ordering_fields = ['company_name', 'full_name', 'created_at']
    ordering = ['company_name', 'full_name']
    


class ReceiverViewSet(viewsets.ModelViewSet):
    queryset = Receiver.objects.all()
    serializer_class = ReceiverSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['receiver_type']
    search_fields = ['company_name', 'full_name', 'economic_code', 'phone', 'system_id', 'unique_id']
    ordering_fields = ['company_name', 'full_name', 'created_at']
    ordering = ['company_name', 'full_name']
    
