from rest_framework import serializers
from .models import (
    Warehouse, ShippingCompany, WarehouseReceipt, WarehouseReceiptItem,
    DispatchIssue, DispatchIssueItem, DeliveryFulfillment, DeliveryFulfillmentItem
)


class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = [
            'id', 'name', 'address', 'manager', 'phone', 'description',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class ShippingCompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingCompany
        fields = [
            'id', 'name', 'contact_person', 'phone', 'email', 'address',
            'description', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class WarehouseReceiptItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_code = serializers.CharField(source='product.code', read_only=True)
    
    class Meta:
        model = WarehouseReceiptItem
        fields = ['id', 'product', 'product_name', 'product_code', 'weight']


class WarehouseReceiptSerializer(serializers.ModelSerializer):
    items = WarehouseReceiptItemSerializer(many=True, required=False)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    proforma_serial = serializers.CharField(source='proforma.serial_number', read_only=True)
    
    class Meta:
        model = WarehouseReceipt
        fields = [
            'id', 'receipt_id', 'receipt_type', 'date', 'warehouse', 'warehouse_name',
            'description', 'total_weight', 'cottage_serial_number', 'proforma',
            'proforma_serial', 'items', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        receipt = WarehouseReceipt.objects.create(**validated_data)
        
        total_weight = 0
        for item_data in items_data:
            WarehouseReceiptItem.objects.create(receipt=receipt, **item_data)
            total_weight += item_data['weight']
        
        receipt.total_weight = total_weight
        receipt.save()
        return receipt

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if items_data is not None:
            instance.items.all().delete()
            total_weight = 0
            for item_data in items_data:
                WarehouseReceiptItem.objects.create(receipt=instance, **item_data)
                total_weight += item_data['weight']
            instance.total_weight = total_weight
        
        instance.save()
        return instance


class DispatchIssueItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    receiver_name = serializers.SerializerMethodField()
    
    class Meta:
        model = DispatchIssueItem
        fields = [
            'id', 'product', 'product_name', 'weight', 'vehicle_type',
            'receiver', 'receiver_name'
        ]
    
    def get_receiver_name(self, obj):
        from core.models import PartyType
        if obj.receiver.receiver_type == PartyType.CORPORATE:
            return obj.receiver.company_name
        return obj.receiver.full_name


class DispatchIssueSerializer(serializers.ModelSerializer):
    items = DispatchIssueItemSerializer(many=True, required=False)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    shipping_company_name = serializers.CharField(source='shipping_company.name', read_only=True)
    sales_proforma_serial = serializers.CharField(source='sales_proforma.serial_number', read_only=True)
    
    class Meta:
        model = DispatchIssue
        fields = [
            'id', 'dispatch_id', 'warehouse', 'warehouse_name', 'sales_proforma',
            'sales_proforma_serial', 'issue_date', 'validity_date', 'description',
            'shipping_company', 'shipping_company_name', 'total_weight', 'items',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        dispatch = DispatchIssue.objects.create(**validated_data)
        
        total_weight = 0
        for item_data in items_data:
            DispatchIssueItem.objects.create(dispatch=dispatch, **item_data)
            total_weight += item_data['weight']
        
        dispatch.total_weight = total_weight
        dispatch.save()
        return dispatch


class DeliveryFulfillmentItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    receiver_name = serializers.SerializerMethodField()
    
    class Meta:
        model = DeliveryFulfillmentItem
        fields = [
            'id', 'shipment_id', 'shipment_price', 'product', 'product_name',
            'weight', 'vehicle_type', 'receiver', 'receiver_name'
        ]
    
    def get_receiver_name(self, obj):
        from core.models import PartyType
        if obj.receiver.receiver_type == PartyType.CORPORATE:
            return obj.receiver.company_name
        return obj.receiver.full_name


class DeliveryFulfillmentSerializer(serializers.ModelSerializer):
    items = DeliveryFulfillmentItemSerializer(many=True, required=False)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    shipping_company_name = serializers.CharField(source='shipping_company.name', read_only=True)
    sales_proforma_serial = serializers.CharField(source='sales_proforma.serial_number', read_only=True)
    
    class Meta:
        model = DeliveryFulfillment
        fields = [
            'id', 'delivery_id', 'issue_date', 'validity_date', 'warehouse',
            'warehouse_name', 'sales_proforma', 'sales_proforma_serial',
            'description', 'shipping_company', 'shipping_company_name',
            'total_weight', 'items', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        delivery = DeliveryFulfillment.objects.create(**validated_data)
        
        total_weight = 0
        for item_data in items_data:
            DeliveryFulfillmentItem.objects.create(delivery=delivery, **item_data)
            total_weight += item_data['weight']
        
        delivery.total_weight = total_weight
        delivery.save()
        return delivery


class WarehouseReceiptListSerializer(serializers.ModelSerializer):
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    items_count = serializers.SerializerMethodField()
    
    class Meta:
        model = WarehouseReceipt
        fields = [
            'id', 'receipt_id', 'receipt_type', 'date', 'warehouse', 'warehouse_name',
            'total_weight', 'items_count', 'created_at'
        ]
    
    def get_items_count(self, obj):
        return obj.items.count()