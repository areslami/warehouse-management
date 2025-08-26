from rest_framework import serializers
from .models import B2BOffer, B2BSale, B2BPurchase, B2BPurchaseDetail, B2BDistribution
from core.serializers import ProductSerializer, CustomerSerializer
from warehouse.serializers import WarehouseSerializer


class B2BOfferSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    warehouse_receipt_id = serializers.CharField(source='warehouse_receipt.receipt_id', read_only=True)
    
    class Meta:
        model = B2BOffer
        fields = '__all__'
        read_only_fields = ['cottage_number', 'total_price', 'created_at', 'updated_at']


class B2BOfferListSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    remaining_weight = serializers.SerializerMethodField()
    
    class Meta:
        model = B2BOffer
        fields = ['id', 'offer_id', 'product_name', 'offer_weight', 'unit_price', 
                  'total_price', 'status', 'offer_date', 'offer_exp_date', 'remaining_weight']
    
    def get_remaining_weight(self, obj):
        if hasattr(obj, 'sale'):
            return obj.offer_weight - (obj.sale.sold_weight_before_transport or 0)
        return obj.offer_weight


class B2BSaleSerializer(serializers.ModelSerializer):
    product_name = serializers.SerializerMethodField()
    customer_name = serializers.SerializerMethodField()
    receiver_name = serializers.SerializerMethodField()
    
    class Meta:
        model = B2BSale
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def get_product_name(self, obj):
        if obj.product:
            return obj.product.name
        return None
    
    def get_customer_name(self, obj):
        if obj.customer:
            return obj.customer.company_name or obj.customer.full_name
        return None
    
    def get_receiver_name(self, obj):
        if obj.receiver:
            return obj.receiver.company_name or obj.receiver.full_name
        return None


class B2BSaleListSerializer(serializers.ModelSerializer):
    product_name = serializers.SerializerMethodField()
    customer_name = serializers.SerializerMethodField()
    receiver_name = serializers.SerializerMethodField()
    
    class Meta:
        model = B2BSale
        fields = ['id', 'purchase_id', 'allocation_id', 'product_name', 'customer_name',
                  'receiver_name', 'total_weight_purchased', 'payment_amount', 'purchase_date', 'tracking_number']
    
    def get_product_name(self, obj):
        if obj.product:
            return obj.product.name
        return None
    
    def get_customer_name(self, obj):
        if obj.customer:
            return obj.customer.company_name or obj.customer.full_name
        return None
    
    def get_receiver_name(self, obj):
        if obj.receiver:
            return obj.receiver.company_name or obj.receiver.full_name
        return None


class B2BPurchaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = B2BPurchase
        fields = '__all__'
        
    def validate(self, data):
        if data.get('purchase_weight', 0) <= 0:
            raise serializers.ValidationError('Purchase weight must be greater than zero')
        
        if data.get('paid_amount', 0) < 0:
            raise serializers.ValidationError('Paid amount cannot be negative')
        
        return data


class B2BPurchaseListSerializer(serializers.ModelSerializer):
    class Meta:
        model = B2BPurchase
        fields = ['id', 'purchase_id', 'buyer_name', 'purchase_weight', 
                  'paid_amount', 'purchase_date', 'purchase_type']


class B2BPurchaseDetailSerializer(serializers.ModelSerializer):
    purchase_info = B2BPurchaseListSerializer(source='purchase', read_only=True)
    
    class Meta:
        model = B2BPurchaseDetail
        fields = '__all__'


class B2BDistributionSerializer(serializers.ModelSerializer):
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    customer_name = serializers.SerializerMethodField()
    b2b_offer_id = serializers.CharField(source='b2b_offer.offer_id', read_only=True)
    cottage_number = serializers.SerializerMethodField()
    warehouse_receipt = serializers.SerializerMethodField()
    
    class Meta:
        model = B2BDistribution
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def get_customer_name(self, obj):
        if obj.customer.customer_type == 'Corporate':
            return obj.customer.company_name
        return obj.customer.full_name
    
    def get_cottage_number(self, obj):
        return obj.cottage_number
    
    def get_warehouse_receipt(self, obj):
        return obj.warehouse_receipt.id if obj.warehouse_receipt else None


class B2BDistributionListSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    customer_name = serializers.SerializerMethodField()
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    b2b_offer_id = serializers.CharField(source='b2b_offer.offer_id', read_only=True)
    cottage_number = serializers.SerializerMethodField()
    
    class Meta:
        model = B2BDistribution
        fields = ['id', 'purchase_id', 'cottage_number', 'b2b_offer_id', 'warehouse_name', 
                  'product_name', 'customer_name', 'agency_weight', 'agency_date']
    
    def get_customer_name(self, obj):
        if obj.customer.customer_type == 'Corporate':
            return obj.customer.company_name
        return obj.customer.full_name
    
    def get_cottage_number(self, obj):
        return obj.cottage_number