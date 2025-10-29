from rest_framework import viewsets, filters, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum

from b2b.models.base import B2BSale
from .models import B2BOffer, B2BAddress, B2BDistribution
from .serializers import (
    B2BOfferSerializer, B2BOfferListSerializer,
    B2BAddressSerializer, B2BAddressListSerializer,
    B2BDistributionSerializer, B2BDistributionListSerializer, B2BSaleSerializer
)


@api_view(['GET'])
def get_next_transfer_id(request):
    last_distribution = B2BDistribution.objects.order_by('-id').first()
    if last_distribution and last_distribution.transfer_id:
        try:
            last_num = int(last_distribution.transfer_id.split('-')[-1])
            new_num = last_num + 1
        except (ValueError, IndexError):
            new_num = 1
    else:
        new_num = 1
    
    next_id = f"DIST-{new_num}"
    return Response({'next_transfer_id': next_id})


@api_view(['GET'])
def get_next_offer_id(request):
    last_offer = B2BOffer.objects.order_by('-id').first()
    if last_offer and last_offer.offer_id:
        try:
            last_num = int(last_offer.offer_id.split('-')[-1])
            new_num = last_num + 1
        except (ValueError, IndexError):
            new_num = 1
    else:
        new_num = 1
    
    next_id = f"OFFER-{new_num}"
    return Response({'next_offer_id': next_id})


class B2BOfferViewSet(viewsets.ModelViewSet):
    queryset = B2BOffer.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'offer_type', ]
    search_fields = ['offer_id', 'warehouse_receipt__receipt_id', 'warehouse_receipt__product__name','warehouse_receipt__cottage_serial_number']
    ordering_fields = ['offer_date', 'offer_exp_date', 'created_at']
    ordering = ['-offer_date']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return B2BOfferListSerializer
        return B2BOfferSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.select_related( 'warehouse_receipt')
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        active_offers = self.get_queryset().filter(status='active')
        serializer = B2BOfferListSerializer(active_offers, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_status(self, request):
        status_param = request.query_params.get('status', None)
        if status_param:
            offers = self.get_queryset().filter(status=status_param)
            serializer = B2BOfferListSerializer(offers, many=True)
            return Response(serializer.data)
        return Response({'error': 'Status parameter required'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], url_path='next-id')
    def next_id(self, request):
        """Get next available offer_id"""
        next_id = B2BOffer.get_next_offer_id()
        return Response({'next_offer_id': next_id})


class B2BAddressViewSet(viewsets.ModelViewSet):
    queryset = B2BAddress.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['product_offer', 'customer', 'receiver']
    search_fields = ['purchase_id', 'allocation_id', 'cottage_code', 'tracking_number']
    ordering_fields = ['purchase_date', 'created_at']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return B2BAddressListSerializer
        return B2BAddressSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.select_related('product', 'customer', 'receiver', 'product_offer', 'product_offer__warehouse_receipt', 'product_offer__warehouse_receipt__warehouse')
    
    
class B2BSaleViewSet(viewsets.ModelViewSet):   
    queryset = B2BSale.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['offer',  'customer','b2b_distribution']
    search_fields = ['offer__offer_id',  'customer__company_name', 'purchase_id','b2b_distribution__transfer_id', ]
    ordering_fields = ['sale_date',  'created_at']
    ordering = ['-sale_date']
    
    def get_serializer_class(self):
        return B2BSaleSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.select_related('offer', 'b2b_distribution', 'customer', 'product', 'sales_proforma')
    
    @action(detail=False, methods=['get'])
    def total_sales(self, request):
        total_sales = self.get_queryset().aggregate(total_amount=Sum('total_price'))
        return Response(total_sales)
    
    @action(detail=False, methods=['get'], url_path='next-id')
    def next_id(self, request):
        """Get next available purchase_id"""
        next_id = B2BSale.get_next_sale_id()
        return Response({'next_sale_id': next_id})


class B2BDistributionViewSet(viewsets.ModelViewSet):
    queryset = B2BDistribution.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['warehouse_receipt', 'customer']
    search_fields = ['warehouse_receipt__cottage_serial_number', 'customer__company_name', 'customer__full_name', 'transfer_id']
    ordering_fields = ['agency_date', 'agency_weight', 'created_at']
    ordering = ['-agency_date']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return B2BDistributionListSerializer
        return B2BDistributionSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.select_related('warehouse_receipt', 'customer')
    
    @action(detail=False, methods=['get'])
    def by_customer(self, request):
        customer_id = request.query_params.get('customer_id', None)
        if customer_id:
            distributions = self.get_queryset().filter(customer_id=customer_id)
            serializer = B2BDistributionSerializer(distributions, many=True)
            return Response(serializer.data)
        return Response({'error': 'Customer ID required'}, status=status.HTTP_400_BAD_REQUEST)


    @action(detail=False, methods=['get'], url_path='next-id')
    def next_id(self, request):
        """Get next available purchase_id"""
        next_id = B2BDistribution.get_next_dist_id()
        return Response({'next_dist_id': next_id})
