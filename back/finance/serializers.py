from rest_framework import serializers
from .models import SalesProforma,PurchaseProforma,ProformaLine


class ProformaLineSerializer(serializers.ModelSerializer):
    product_name=serializers.CharField(source='product.name',read_only=True)
    product_code=serializers.CharField(source='product.code',read_only=True)
    
    class Meta:
        model=ProformaLine
        fields=[
            'id',
            'product',
            'weight',
            'unit_price',
            'total_price',
            'created_at',
            'updated_at',
        ]
        read_only_fields=['created_at','updated_at','total_price']
        
class PurchaseProformaSerializer(serializers.ModelSerializer):
    lines=ProformaLineSerializer(many=True,required=False)
    supplier_name=serializers.SerializerMethodField()
    class Meta:
        model = PurchaseProforma
        fields = ['id','serial_number','date','subtotal','tax','discount' ,'final_price' ,'supplier','supplier_name','created_at','updated_at','lines']
        read_only_fields=['created_at','updated_at']
    
    def get_supplier_name(self, obj):
        if obj.supplier.supplier_type == 'Corporate':
            return obj.supplier.company_name
        return obj.supplier.full_name

    def create(self,validated_data):
        items_data = validated_data.pop('lines', [])
        proforma = PurchaseProforma.objects.create(**validated_data)
        subtotal = 0
        for item_data in items_data:
            ProformaLine.objects.create(proforma=proforma, **item_data)
            subtotal += item_data['weight'] * item_data['unit_price']
        proforma.subtotal = subtotal
        proforma.final_price = subtotal + proforma.tax - proforma.discount
        proforma.save()
        return proforma
    
    def update(self, instance, validated_data):
        items_data = validated_data.pop('lines', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if items_data is not None:
            instance.lines.all().delete()
            
            subtotal = 0
            for item_data in items_data:
                ProformaLine.objects.create(proforma=instance, **item_data)
                subtotal += item_data['weight'] * item_data['unit_price']
            
            instance.subtotal = subtotal
            instance.final_price = subtotal + instance.tax - instance.discount
        
        instance.save()
        return instance


class SalesProformaSerializer(serializers.ModelSerializer):
    lines=ProformaLineSerializer(many=True,required=False)
    customer_name=serializers.SerializerMethodField()
    class Meta:
        model = SalesProforma
        fields = ['id','serial_number','date','subtotal','tax','discount' ,'final_price','payment_type',"payment_description",'customer','customer_name','created_at','updated_at' ,'lines']
        read_only_fields=['created_at','updated_at']
    
    def get_customer_name(self, obj):
        if obj.customer.customer_type == 'Corporate':
            return obj.customer.company_name
        return obj.customer.full_name

    def create(self,validated_data):
        items_data = validated_data.pop('lines', [])
        proforma = SalesProforma.objects.create(**validated_data)
        subtotal = 0
        for item_data in items_data:
            ProformaLine.objects.create(proforma=proforma, **item_data)
            subtotal += item_data['weight'] * item_data['unit_price']
        proforma.subtotal = subtotal
        proforma.final_price = subtotal + proforma.tax - proforma.discount
        proforma.save()
        return proforma
    
    def update(self, instance, validated_data):
        items_data = validated_data.pop('lines', None)
        
        # Update proforma fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Handle items update if provided
        if items_data is not None:
            # Delete existing items
            instance.lines.all().delete()
            
            # Create new items
            subtotal = 0
            for item_data in items_data:
                ProformaLine.objects.create(proforma=instance, **item_data)
                subtotal += item_data['weight'] * item_data['unit_price']
            
            instance.subtotal = subtotal
            instance.final_price = subtotal + instance.tax - instance.discount
        
        instance.save()
        return instance

    
    

