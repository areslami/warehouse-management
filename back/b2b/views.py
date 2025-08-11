from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Sum
from .models import B2BOffer, B2BSale, B2BPurchase, B2BPurchaseDetail, B2BDistribution
from .serializers import (
    B2BOfferSerializer, B2BOfferListSerializer,
    B2BSaleSerializer, B2BSaleListSerializer,
    B2BPurchaseSerializer, B2BPurchaseListSerializer,
    B2BPurchaseDetailSerializer,
    B2BDistributionSerializer, B2BDistributionListSerializer
)


class B2BOfferViewSet(viewsets.ModelViewSet):
    queryset = B2BOffer.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'offer_type', 'product', 'warehouse_receipt']
    search_fields = ['offer_id', 'product__name', 'cottage_number']
    ordering_fields = ['offer_date', 'offer_exp_date', 'created_at']
    ordering = ['-offer_date']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return B2BOfferListSerializer
        return B2BOfferSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.select_related('product', 'warehouse_receipt')
    
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


class B2BSaleViewSet(viewsets.ModelViewSet):
    queryset = B2BSale.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['offer_status', 'product_offer']
    search_fields = ['product_title', 'cottage_number']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return B2BSaleListSerializer
        return B2BSaleSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.select_related('product_offer', 'product_offer__product')
    
    @action(detail=True, methods=['get'])
    def purchases(self, request, pk=None):
        sale = self.get_object()
        purchases = sale.purchases.all()
        serializer = B2BPurchaseSerializer(purchases, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        sales = self.get_queryset()
        summary = sales.aggregate(
            total_sales=Sum('sold_weight_before_transport'),
            total_remaining=Sum('remaining_weight_before_transport')
        )
        return Response(summary)


class B2BPurchaseViewSet(viewsets.ModelViewSet):
    queryset = B2BPurchase.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['b2b_sale', 'purchase_type', 'province']
    search_fields = ['purchase_id', 'buyer_name', 'buyer_national_id', 'tracking_number']
    ordering_fields = ['purchase_date', 'paid_amount', 'created_at']
    ordering = ['-purchase_date']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return B2BPurchaseListSerializer
        return B2BPurchaseSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.select_related('b2b_sale', 'b2b_sale__product_offer')
    
    @action(detail=False, methods=['get'])
    def by_buyer(self, request):
        buyer_id = request.query_params.get('buyer_national_id', None)
        if buyer_id:
            purchases = self.get_queryset().filter(buyer_national_id=buyer_id)
            serializer = B2BPurchaseSerializer(purchases, many=True)
            return Response(serializer.data)
        return Response({'error': 'Buyer national ID required'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def by_date_range(self, request):
        start_date = request.query_params.get('start_date', None)
        end_date = request.query_params.get('end_date', None)
        
        if start_date and end_date:
            purchases = self.get_queryset().filter(
                purchase_date__gte=start_date,
                purchase_date__lte=end_date
            )
            serializer = B2BPurchaseSerializer(purchases, many=True)
            return Response(serializer.data)
        return Response({'error': 'Start date and end date required'}, status=status.HTTP_400_BAD_REQUEST)


class B2BPurchaseDetailViewSet(viewsets.ModelViewSet):
    queryset = B2BPurchaseDetail.objects.all()
    serializer_class = B2BPurchaseDetailSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['purchase']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.select_related('purchase')


class B2BDistributionViewSet(viewsets.ModelViewSet):
    queryset = B2BDistribution.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['warehouse', 'customer', 'product']
    search_fields = ['cottage_number', 'customer__company_name', 'customer__full_name']
    ordering_fields = ['agency_date', 'agency_weight', 'created_at']
    ordering = ['-agency_date']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return B2BDistributionListSerializer
        return B2BDistributionSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.select_related('warehouse', 'product', 'customer', 'sales_proforma')
    
    @action(detail=False, methods=['get'])
    def by_customer(self, request):
        customer_id = request.query_params.get('customer_id', None)
        if customer_id:
            distributions = self.get_queryset().filter(customer_id=customer_id)
            serializer = B2BDistributionSerializer(distributions, many=True)
            return Response(serializer.data)
        return Response({'error': 'Customer ID required'}, status=status.HTTP_400_BAD_REQUEST)