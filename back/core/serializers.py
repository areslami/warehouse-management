from rest_framework import serializers
from .models import Supplier, Customer, Receiver, Product



class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'code', 'b2bcode', 'b2bregion', 
            'category' , 'description', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']



class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = [
            'id', 'supplier_type', 'company_name', 'national_id', 'full_name',
            'personal_code', 'economic_code', 'phone', 'address', 'description',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate(self, data):
        supplier_type = data.get('supplier_type')
        
        if supplier_type == 'corporate':
            if not data.get('company_name'):
                raise serializers.ValidationError("Company name is required for corporate suppliers")
            if not data.get('national_id'):
                raise serializers.ValidationError("National ID is required for corporate suppliers")
            data['full_name'] = ''
            data['personal_code'] = None  
            
        elif supplier_type == 'individual':
            if not data.get('full_name'):
                raise serializers.ValidationError("Full name is required for individual suppliers")
            if not data.get('personal_code'):
                raise serializers.ValidationError("Personal code is required for individual suppliers")
            data['company_name'] = ''
            data['national_id'] = None 
        
        return data


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            'id', 'customer_type', 'company_name', 'national_id', 'full_name',
            'personal_code', 'economic_code', 'phone', 'address',  'postal_code', 'description',
            'tags', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate(self, data):
        customer_type = data.get('customer_type')
        
        if customer_type == 'corporate':
            if not data.get('company_name'):
                raise serializers.ValidationError("Company name is required for corporate customers")
            if not data.get('national_id'):
                raise serializers.ValidationError("National ID is required for corporate customers")
            data['full_name'] = ''
            data['personal_code'] = None  
            
        elif customer_type == 'individual':
            if not data.get('full_name'):
                raise serializers.ValidationError("Full name is required for individual customers")
            data['company_name'] = ''
            data['national_id'] = None 
            if not data.get('personal_code'):
                data['personal_code'] = None
        
        return data


class ReceiverSerializer(serializers.ModelSerializer):
    class Meta:
        model = Receiver
        fields = [
            'id', 'receiver_type', 'unique_id', 'company_name',
            'national_id', 'full_name', 'personal_code', 'economic_code',
            'phone', 'address', 'description', 'postal_code', 'created_at', 'updated_at','receiver_veichle_type'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate(self, data):
        receiver_type = data.get('receiver_type')
        
        if receiver_type == 'corporate':
            if not data.get('company_name'):
                raise serializers.ValidationError("Company name is required for corporate receivers")
            if not data.get('national_id'):
                raise serializers.ValidationError("National ID is required for corporate receivers")
            data['full_name'] = ''
            data['personal_code'] = None 
            
        elif receiver_type == 'individual':
            if not data.get('full_name'):
                raise serializers.ValidationError("Full name is required for individual receivers")
            if not data.get('personal_code'):
                raise serializers.ValidationError("Personal code is required for individual receivers")
            data['company_name'] = ''
            data['national_id'] = None  
        
        return data


class ProductListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'code', 'b2bcode', 'b2bregion',
            'category', 'description', 'created_at', 'updated_at'
        ]