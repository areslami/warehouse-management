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
    items=ProformaLineSerializer(many=True,required=False)
    supplier_name=serializers.CharField(source='supplier.name',read_only=True)
    class Meta:
        model = PurchaseProforma
        fields = ['id','serial_number','date','subtotal','tax','discount' ,'final_price' ,'supplier','created_at','updated_at']
        read_only_fields=['created_at','updated_at']

    def create(self,validated_data):
        items_data = validated_data.pop('items', [])
        proforma = PurchaseProforma.objects.create(**validated_data)
        subtotal = 0
        for item_data in items_data:
            ProformaLine.objects.create(proforma=proforma, **item_data)
            subtotal += item_data['weight'] * item_data['unit_price']
        proforma.subtotal = subtotal
        proforma.final_price = subtotal + proforma.tax - proforma.discount
        proforma.save()
        return proforma


class SalesProformaSerializer(serializers.ModelSerializer):
    items=ProformaLineSerializer(many=True,required=False)
    customer_name=serializers.CharField(source='customer.name',read_only=True)
    class Meta:
        model = SalesProforma
        fields = ['serial_number','date','subtotal','tax','discount' ,'final_price','payment_type',"payment_description",'customer','created_at','updated_at' ]
        read_only_fields=['created_at','updated_at']

    def create(self,validated_data):
        items_data = validated_data.pop('items', [])
        proforma = SalesProforma.objects.create(**validated_data)
        subtotal = 0
        for item_data in items_data:
            ProformaLine.objects.create(proforma=proforma, **item_data)
            subtotal += item_data['weight'] * item_data['unit_price']
        proforma.subtotal = subtotal
        proforma.final_price = subtotal + proforma.tax - proforma.discount
        proforma.save()
        return proforma

    
    

