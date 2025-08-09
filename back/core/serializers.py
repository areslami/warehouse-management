from rest_framework import serializers
from .models import Supplier, Customer, Reciever, PartyType, Product, ProductCategory, ProductReigon


class ProductCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductCategory
        fields = ['id', 'name', 'description', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class ProductReigonSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductReigon
        fields = ['id', 'name', 'description', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    region_name = serializers.CharField(source='b2breigon.name', read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'code', 'b2bcode', 'b2breigon', 'region_name',
            'category', 'category_name', 'description', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate(self, data):
        if data.get('b2breigon') is None:
            raise serializers.ValidationError("B2B region is required")
        if data.get('category') is None:
            raise serializers.ValidationError("Product category is required")
        return data


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
        
        if supplier_type == PartyType.CORPORATE:
            if not data.get('company_name'):
                raise serializers.ValidationError("Company name is required for corporate suppliers")
            if not data.get('national_id'):
                raise serializers.ValidationError("National ID is required for corporate suppliers")
            # Clear individual fields for corporate
            data['full_name'] = ''
            data['personal_code'] = ''
            
        elif supplier_type == PartyType.INDIVIDUAL:
            if not data.get('full_name'):
                raise serializers.ValidationError("Full name is required for individual suppliers")
            if not data.get('personal_code'):
                raise serializers.ValidationError("Personal code is required for individual suppliers")
            # Clear corporate fields for individual
            data['company_name'] = ''
            data['national_id'] = ''
        
        return data


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            'id', 'customer_type', 'company_name', 'national_id', 'full_name',
            'personal_code', 'economic_code', 'phone', 'address', 'description',
            'tags', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate(self, data):
        customer_type = data.get('customer_type')
        
        if customer_type == PartyType.CORPORATE:
            if not data.get('company_name'):
                raise serializers.ValidationError("Company name is required for corporate customers")
            if not data.get('national_id'):
                raise serializers.ValidationError("National ID is required for corporate customers")
            data['full_name'] = ''
            data['personal_code'] = ''
            
        elif customer_type == PartyType.INDIVIDUAL:
            if not data.get('full_name'):
                raise serializers.ValidationError("Full name is required for individual customers")
            if not data.get('personal_code'):
                raise serializers.ValidationError("Personal code is required for individual customers")
            data['company_name'] = ''
            data['national_id'] = ''
        
        return data


class RecieverSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reciever
        fields = [
            'id', 'reciever_type', 'system_id', 'unique_id', 'company_name',
            'national_id', 'full_name', 'personal_code', 'economic_code',
            'phone', 'address', 'description', 'postal_code', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate(self, data):
        reciever_type = data.get('reciever_type')
        
        if reciever_type == PartyType.CORPORATE:
            if not data.get('company_name'):
                raise serializers.ValidationError("Company name is required for corporate receivers")
            if not data.get('national_id'):
                raise serializers.ValidationError("National ID is required for corporate receivers")
            data['full_name'] = ''
            data['personal_code'] = ''
            
        elif reciever_type == PartyType.INDIVIDUAL:
            if not data.get('full_name'):
                raise serializers.ValidationError("Full name is required for individual receivers")
            if not data.get('personal_code'):
                raise serializers.ValidationError("Personal code is required for individual receivers")
            data['company_name'] = ''
            data['national_id'] = ''
        
        return data


class ProductListSerializer(serializers.ModelSerializer):
    category = ProductCategorySerializer(read_only=True)
    b2breigon = ProductReigonSerializer(read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'code', 'b2bcode', 'b2breigon',
            'category', 'description', 'created_at', 'updated_at'
        ]