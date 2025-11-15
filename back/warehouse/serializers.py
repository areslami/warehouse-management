from rest_framework import serializers
from .models import (
    Warehouse, ShippingCompany, WarehouseReceipt, WarehouseReceiptItem,
    DispatchIssue, DispatchIssueItem, DeliveryFulfillment, DeliveryFulfillmentItem,
    DeliveryColumnMapping
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
            'id', 'name', 'contact_person', 'phone', 'address',
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
        fields = '__all__'
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
        if obj.receiver.receiver_type == 'corporate':
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

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', [])
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if items_data:
            instance.items.all().delete()
            total_weight = 0
            for item_data in items_data:
                DispatchIssueItem.objects.create(dispatch=instance, **item_data)
                total_weight += item_data['weight']
            instance.total_weight = total_weight
        
        instance.save()
        return instance


class DeliveryFulfillmentItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    customer_name = serializers.SerializerMethodField()

    class Meta:
        model = DeliveryFulfillmentItem
        fields = [
            'id', 'product', 'product_name', 'weight', 'destination',
            'receiver', 'customer', 'customer_name', 'fare'
        ]

    def get_customer_name(self, obj):
        if obj.customer:
            if obj.customer.customer_type == 'corporate':
                return obj.customer.company_name
            return obj.customer.full_name
        return None


class DeliveryFulfillmentSerializer(serializers.ModelSerializer):
    items = DeliveryFulfillmentItemSerializer(many=True, required=False)
    b2b_address_purchase_id = serializers.CharField(source='b2b_address.purchase_id', read_only=True)
    warehouse_receipt_id = serializers.CharField(source='warehouse_receipt.receipt_id', read_only=True)
    warehouse = serializers.IntegerField(source='warehouse_receipt.warehouse.id', read_only=True)
    shipping_company_name = serializers.CharField(source='shipping_company.name', read_only=True)
    offer_id_display = serializers.CharField(source='offer.offer_id', read_only=True)
    distribution_id_display = serializers.CharField(source='distribution.transfer_id', read_only=True)

    class Meta:
        model = DeliveryFulfillment
        fields = [
            'id', 'delivery_id', 'waybill_serial', 'issue_date', 'b2b_address',
            'b2b_address_purchase_id', 'warehouse_receipt', 'warehouse_receipt_id', 'warehouse',
            'offer', 'offer_id_display', 'distribution', 'distribution_id_display',
            'description', 'shipping_company', 'shipping_company_name',
            'total_weight', 'driver_name', 'driver_phone', 'driver_license_plate',
            'items', 'created_at', 'updated_at'
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

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', [])
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if items_data:
            instance.items.all().delete()
            total_weight = 0
            for item_data in items_data:
                DeliveryFulfillmentItem.objects.create(delivery=instance, **item_data)
                total_weight += item_data['weight']
            instance.total_weight = total_weight
        
        instance.save()
        return instance


class WarehouseReceiptListSerializer(serializers.ModelSerializer):
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    items = WarehouseReceiptItemSerializer(many=True, read_only=True)

    class Meta:
        model = WarehouseReceipt
        fields = '__all__'


class DeliveryColumnMappingSerializer(serializers.ModelSerializer):
    shipping_company_name = serializers.CharField(source='shipping_company.name', read_only=True)

    class Meta:
        model = DeliveryColumnMapping
        fields = ['id', 'name', 'shipping_company', 'shipping_company_name', 'column_mappings', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
