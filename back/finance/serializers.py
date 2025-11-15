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
            'product_name',
            'product_code',
            'weight',
            'unit_price',
            'total_price',
        ]
        read_only_fields=['total_price']
        
class PurchaseProformaSerializer(serializers.ModelSerializer):
    lines=ProformaLineSerializer(many=True,required=False)
    supplier_name=serializers.SerializerMethodField()
    
    class Meta:
        model = PurchaseProforma
        fields = ['id','serial_number','date','subtotal','tax','discount' ,'final_price' ,'supplier','supplier_name','lines','created_at','updated_at']
        read_only_fields=['subtotal','final_price','created_at','updated_at']
    
    def get_supplier_name(self, obj):
         
        if obj.supplier.supplier_type == 'corporate':
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
        proforma.final_price = (1 - proforma.discount) * subtotal 
        proforma.final_price = (1 + proforma.tax) * proforma.final_price
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
            instance.final_price = (1 - instance.discount) * subtotal 
            instance.final_price = (1 + instance.tax) * instance.final_price
        
        instance.save()
        return instance


class SalesProformaSerializer(serializers.ModelSerializer):
    lines=ProformaLineSerializer(many=True,required=False)
    customer_name=serializers.SerializerMethodField()
    class Meta:
        model = SalesProforma
        fields = ['id','serial_number','date','subtotal','tax','discount' ,'final_price','payment_type',"payment_description",'customer','customer_name','lines','created_at','updated_at']
        read_only_fields=['subtotal','final_price','created_at','updated_at']
    
    def get_customer_name(self, obj):
         
        if obj.customer.customer_type == 'corporate':
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
        proforma.final_price = (1 - proforma.discount) * subtotal 
        proforma.final_price = (1 + proforma.tax) * proforma.final_price
        proforma.save()
        return proforma
    
    def update(self,instance,validated_data):
        items_data = validated_data.pop('lines',None)
        
        for attr,value in validated_data.items():
            setattr(instance, attr, value)
            
        if items_data is not None:
            instance.lines.all().delete()
            
            subtotal = 0
            for item_data in items_data:
                ProformaLine.objects.create(proforma=instance, **item_data)
                subtotal += item_data['weight'] * item_data['unit_price']
            
            instance.subtotal = subtotal
            instance.final_price = (1 - instance.discount) * subtotal 
            instance.final_price = (1 + instance.tax) * instance.final_price
        
        instance.save()
        return instance
    
    

