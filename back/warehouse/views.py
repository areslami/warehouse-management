from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import (
    Warehouse, ShippingCompany, WarehouseReceipt, DispatchIssue, DeliveryFulfillment
)
from .serializers import (
    WarehouseSerializer, ShippingCompanySerializer, WarehouseReceiptSerializer,
    WarehouseReceiptListSerializer, DispatchIssueSerializer, DeliveryFulfillmentSerializer
)


class WarehouseViewSet(viewsets.ModelViewSet):
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'manager', 'phone', 'address']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']


class ShippingCompanyViewSet(viewsets.ModelViewSet):
    queryset = ShippingCompany.objects.all()
    serializer_class = ShippingCompanySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'contact_person', 'phone', 'email']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']


class WarehouseReceiptViewSet(viewsets.ModelViewSet):
    queryset = WarehouseReceipt.objects.select_related('warehouse', 'proforma').prefetch_related('items__product').all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['receipt_type', 'warehouse']
    search_fields = ['receipt_id', 'cottage_serial_number', 'description']
    ordering_fields = ['date', 'created_at']
    ordering = ['-date']

    def get_serializer_class(self):
        if self.action == 'list':
            return WarehouseReceiptListSerializer
        return WarehouseReceiptSerializer

    @action(detail=False, methods=['get'])
    def by_date_range(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if start_date and end_date:
            receipts = self.get_queryset().filter(date__range=[start_date, end_date])
            serializer = WarehouseReceiptListSerializer(receipts, many=True)
            return Response(serializer.data)
        return Response({'error': 'start_date and end_date parameters are required'}, status=400)


class DispatchIssueViewSet(viewsets.ModelViewSet):
    queryset = DispatchIssue.objects.select_related(
        'warehouse', 'sales_proforma', 'shipping_company'
    ).prefetch_related('items__product', 'items__receiver').all()
    serializer_class = DispatchIssueSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['warehouse', 'shipping_company']
    search_fields = ['dispatch_id', 'description']
    ordering_fields = ['issue_date', 'created_at']
    ordering = ['-issue_date']


class DeliveryFulfillmentViewSet(viewsets.ModelViewSet):
    queryset = DeliveryFulfillment.objects.select_related(
        'warehouse', 'sales_proforma', 'shipping_company'
    ).prefetch_related('items__product', 'items__receiver').all()
    serializer_class = DeliveryFulfillmentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['warehouse', 'shipping_company']
    search_fields = ['delivery_id', 'description']
    ordering_fields = ['issue_date', 'created_at']
    ordering = ['-issue_date']