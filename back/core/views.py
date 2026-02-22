from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from django.db.models import F

from .models import Supplier, Customer, Receiver, Product, Indicator
from .serializers import (
    SupplierSerializer, CustomerSerializer, ReceiverSerializer,
    ProductSerializer, ProductListSerializer, IndicatorSerializer,
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
    search_fields = ['company_name', 'full_name', 'economic_code', 'phone']
    ordering_fields = ['company_name', 'full_name', 'created_at']
    ordering = ['company_name', 'full_name']


class IndicatorViewSet(viewsets.ModelViewSet):
    queryset = Indicator.objects.all()
    serializer_class = IndicatorSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['belongs', 'is_default']
    search_fields = ['name', 'belongs']
    ordering_fields = ['name', 'belongs', 'counter']
    ordering = ['name']

    @transaction.atomic
    def perform_create(self, serializer):
        belongs = serializer.validated_data.get('belongs')
        is_default = serializer.validated_data.get('is_default', False)
        if is_default:
            Indicator.objects.filter(belongs=belongs, is_default=True).update(is_default=False)
        indicator = serializer.save()
        if not Indicator.objects.filter(belongs=belongs, is_default=True).exists():
            indicator.is_default = True
            indicator.save(update_fields=['is_default'])

    @transaction.atomic
    def perform_update(self, serializer):
        belongs = serializer.validated_data.get('belongs', serializer.instance.belongs)
        is_default = serializer.validated_data.get('is_default')
        if is_default:
            Indicator.objects.filter(belongs=belongs, is_default=True).exclude(pk=serializer.instance.pk).update(is_default=False)
        indicator = serializer.save()
        if not Indicator.objects.filter(belongs=indicator.belongs, is_default=True).exists():
            indicator.is_default = True
            indicator.save(update_fields=['is_default'])

    @action(detail=True, methods=['post'], url_path='set-default')
    @transaction.atomic
    def set_default(self, request, pk=None):
        indicator = self.get_object()
        Indicator.objects.filter(belongs=indicator.belongs, is_default=True).exclude(pk=indicator.pk).update(is_default=False)
        indicator.is_default = True
        indicator.save(update_fields=['is_default'])
        serializer = self.get_serializer(indicator)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='increment')
    @transaction.atomic
    def increment(self, request, pk=None):
        indicator = self.get_object()
        start_number = indicator.start_number or 1
        new_counter = max(indicator.counter + 1, start_number)
        Indicator.objects.filter(pk=indicator.pk).update(counter=new_counter)
        indicator.refresh_from_db()
        serializer = self.get_serializer(indicator)
        return Response(serializer.data, status=status.HTTP_200_OK)
