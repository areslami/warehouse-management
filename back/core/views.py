from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import Supplier, Customer, Receiver, Product, ProductCategory, ProductRegion
from .serializers import (
    SupplierSerializer, CustomerSerializer, ReceiverSerializer,
    ProductSerializer, ProductListSerializer, ProductCategorySerializer,
    ProductRegionSerializer
)


class ProductCategoryViewSet(viewsets.ModelViewSet):
    queryset = ProductCategory.objects.all()
    serializer_class = ProductCategorySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    
            


class ProductRegionViewSet(viewsets.ModelViewSet):
    queryset = ProductRegion.objects.all()
    serializer_class = ProductRegionSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('category', 'b2bregion').all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'b2bregion']
    search_fields = ['name', 'code', 'b2bcode', 'description']
    ordering_fields = ['name', 'code', 'created_at']
    ordering = ['name']

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        return ProductSerializer
    
    @action(detail=False, methods=['get'])
    def by_category(self, request):
        category_id = request.query_params.get('category_id')
        if category_id:
            products = self.get_queryset().filter(category_id=category_id)
            serializer = ProductListSerializer(products, many=True)
            return Response(serializer.data)
        return Response({'error': 'category_id parameter is required'}, status=400)


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
    
