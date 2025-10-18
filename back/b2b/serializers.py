from rest_framework import serializers

from b2b.models.base import B2BSale
from .models import B2BOffer, B2BAddress, B2BDistribution
from core.serializers import ProductSerializer, CustomerSerializer
from warehouse.serializers import WarehouseSerializer


class B2BOfferSerializer(serializers.ModelSerializer):
    warehouse_receipt_id = serializers.CharField(
        source='warehouse_receipt.receipt_id', read_only=True)

    class Meta:
        model = B2BOffer
        fields = '__all__'
        read_only_fields = ['total_price', 'created_at', 'updated_at']


class B2BOfferListSerializer(serializers.ModelSerializer):
    product_name = serializers.SerializerMethodField()
    product_id = serializers.SerializerMethodField()

    class Meta:
        model = B2BOffer
        fields = ['id', 'offer_id', 'offer_weight', 'unit_price',
                  'total_price', 'status', 'offer_date', 'offer_exp_date', 'product_name', 'product_id']

    def get_product_name(self, obj):
        try:
            if obj.warehouse_receipt:
                first_item = obj.warehouse_receipt.items.first()
                if first_item and first_item.product:
                    return first_item.product.name
        except Exception:
            pass
        return None

    def get_product_id(self, obj):
        try:
            if obj.warehouse_receipt:
                first_item = obj.warehouse_receipt.items.first()
                if first_item and first_item.product:
                    return first_item.product.id
        except Exception:
            pass
        return None


class B2BAddressSerializer(serializers.ModelSerializer):
    product_name = serializers.SerializerMethodField()
    customer_name = serializers.SerializerMethodField()
    receiver_name = serializers.SerializerMethodField()

    class Meta:
        model = B2BAddress
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


class B2BAddressListSerializer(serializers.ModelSerializer):
    product_name = serializers.SerializerMethodField()
    customer_name = serializers.SerializerMethodField()
    receiver_name = serializers.SerializerMethodField()
    distributor_name = serializers.SerializerMethodField()
    warehouse_name = serializers.SerializerMethodField()

    class Meta:
        model = B2BAddress
        fields = ['id', 'purchase_id', 'allocation_id', 'cottage_code', 'product_name', 'customer_name',
                  'receiver_name', 'distributor_name', 'total_weight_purchased', 'purchase_date', 'warehouse_name']

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

    def get_warehouse_name(self, obj):
        try:
            offer = getattr(obj, 'product_offer', None)
            if offer and offer.warehouse_receipt and offer.warehouse_receipt.warehouse:
                return offer.warehouse_receipt.warehouse.name
            sale = B2BSale.objects.select_related(
                'b2b_distribution__warehouse_receipt__warehouse').filter(purchase_id=obj.purchase_id).first()
            if sale and sale.b2b_distribution and sale.b2b_distribution.warehouse_receipt and sale.b2b_distribution.warehouse_receipt.warehouse:
                return sale.b2b_distribution.warehouse_receipt.warehouse.name
        except Exception:
            pass
        return None

    def get_distributor_name(self, obj):
        try:
            sale = B2BSale.objects.select_related('b2b_distribution__customer').filter(
                purchase_id=obj.purchase_id).first()
            if sale and sale.b2b_distribution and sale.b2b_distribution.customer:
                c = sale.b2b_distribution.customer
                return c.company_name or c.full_name
        except Exception:
            pass
        return None


class B2BSaleSerializer(serializers.ModelSerializer):
    offer_id = serializers.CharField(source='offer.offer_id', read_only=True)
    distribution_id = serializers.CharField(
        source='b2b_distribution.transfer_id', read_only=True)
    customer_name = serializers.SerializerMethodField()
    product_name = serializers.SerializerMethodField()
    product_id = serializers.SerializerMethodField()

    class Meta:
        model = B2BSale
        fields = '__all__'
        read_only_fields = ['total_price']

    def get_customer_name(self, obj):
        if obj.customer:
            if obj.customer.customer_type == 'corporate':
                return obj.customer.company_name
            return obj.customer.full_name
        return None

    def get_product_name(self, obj):
        try:
            if obj.offer and obj.offer.warehouse_receipt:
                first_item = obj.offer.warehouse_receipt.items.first()
                if first_item and first_item.product:
                    return first_item.product.name
            if obj.b2b_distribution and obj.b2b_distribution.warehouse_receipt:
                first_item = obj.b2b_distribution.warehouse_receipt.items.first()
                if first_item and first_item.product:
                    return first_item.product.name
        except Exception:
            pass
        return None

    def get_product_id(self, obj):
        try:
            if obj.offer and obj.offer.warehouse_receipt:
                first_item = obj.offer.warehouse_receipt.items.first()
                if first_item and first_item.product:
                    return first_item.product.id
            if obj.b2b_distribution and obj.b2b_distribution.warehouse_receipt:
                first_item = obj.b2b_distribution.warehouse_receipt.items.first()
                if first_item and first_item.product:
                    return first_item.product.id
        except Exception:
            pass
        return None


class B2BDistributionSerializer(serializers.ModelSerializer):
    warehouse_receipt_id = serializers.CharField(
        source='warehouse_receipt.receipt_id', read_only=True)
    warehouse_name = serializers.CharField(
        source='warehouse_receipt.warehouse.name', read_only=True)
    sales_proforma_serial = serializers.CharField(
        source='sales_proforma.serial_number', read_only=True)
    sales_proforma_customer_name = serializers.SerializerMethodField()
    product_id = serializers.IntegerField(
        source='warehouse_receipt.items.first.product.id', read_only=True)
    product_name = serializers.CharField(
        source='warehouse_receipt.items.first.product.name', read_only=True)
    customer_name = serializers.SerializerMethodField()

    class Meta:
        model = B2BDistribution
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

    def get_customer_name(self, obj):
        if obj.customer:
            if obj.customer.customer_type == 'corporate':
                return obj.customer.company_name
            return obj.customer.full_name
        return None

    def get_sales_proforma_customer_name(self, obj):
        if obj.sales_proforma and obj.sales_proforma.customer:
            customer = obj.sales_proforma.customer
            if customer.customer_type == 'corporate':
                return customer.company_name
            return customer.full_name
        return None


class B2BDistributionListSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    sales_proforma_customer_name = serializers.SerializerMethodField()
    warehouse_receipt_id = serializers.CharField(
        source='warehouse_receipt.receipt_id', read_only=True)
    warehouse_name = serializers.CharField(
        source='warehouse_receipt.warehouse.name', read_only=True)
    sales_proforma_serial = serializers.CharField(
        source='sales_proforma.serial_number', read_only=True)
    product_id = serializers.IntegerField(
        source='warehouse_receipt.items.first.product.id', read_only=True)
    product_name = serializers.CharField(
        source='warehouse_receipt.items.first.product.name', read_only=True)

    class Meta:
        model = B2BDistribution
        fields = ['id', 'transfer_id', 'customer_name', 'product_name', 'agency_weight', 'unit_price',
                  'agency_date', 'warehouse_receipt_id', 'warehouse_name', 'product_id', 'sales_proforma', 'sales_proforma_serial', 'sales_proforma_customer_name']

    def get_customer_name(self, obj):
        if obj.customer:
            if obj.customer.customer_type == 'corporate':
                return obj.customer.company_name
            return obj.customer.full_name
        return None

    def get_sales_proforma_customer_name(self, obj):
        if obj.sales_proforma and obj.sales_proforma.customer:
            customer = obj.sales_proforma.customer
            if customer.customer_type == 'corporate':
                return customer.company_name
            return customer.full_name
        return None

    def get_product_name(self, obj):
        try:
            if obj.warehouse_receipt:
                first_item = obj.warehouse_receipt.items.first()
                if first_item and first_item.product:
                    return first_item.product.name
        except Exception:
            pass
        return None

    def get_product_id(self, obj):
        try:
            if obj.warehouse_receipt:
                first_item = obj.warehouse_receipt.items.first()
                if first_item and first_item.product:
                    return first_item.product.id
        except Exception:
            pass
        return None
