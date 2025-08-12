from rest_framework import serializers
from .models import Supplier, Customer, Receiver, PartyType, Product, ProductCategory, ProductRegion


class ProductCategorySerializer(serializers.ModelSerializer):
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=255)
    
    class Meta:
        model = ProductCategory
        fields = ['id', 'name', 'description', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class ProductRegionSerializer(serializers.ModelSerializer):
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=255)
    
    class Meta:
        model = ProductRegion
        fields = ['id', 'name', 'description', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    region_name = serializers.CharField(source='b2bregion.name', read_only=True)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    b2bregion = serializers.PrimaryKeyRelatedField(queryset=ProductRegion.objects.all(), required=False, allow_null=True)
    category = serializers.PrimaryKeyRelatedField(queryset=ProductCategory.objects.all(), required=False, allow_null=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'code', 'b2bcode', 'b2bregion', 'region_name',
            'category', 'category_name', 'description', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    # Removed validation for optional fields


class SupplierSerializer(serializers.ModelSerializer):
    # Fields that are blank=True in the model
    company_name = serializers.CharField(required=False, allow_blank=True, max_length=200)
    national_id = serializers.CharField(required=False, allow_blank=True, max_length=11)
    full_name = serializers.CharField(required=False, allow_blank=True, max_length=100)
    personal_code = serializers.CharField(required=False, allow_blank=True, max_length=10)
    description = serializers.CharField(required=False, allow_blank=True)
    
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
            data['personal_code'] = None  # Set to None for unique field
            
        elif supplier_type == PartyType.INDIVIDUAL:
            if not data.get('full_name'):
                raise serializers.ValidationError("Full name is required for individual suppliers")
            if not data.get('personal_code'):
                raise serializers.ValidationError("Personal code is required for individual suppliers")
            # Clear corporate fields for individual
            data['company_name'] = ''
            data['national_id'] = None  # Set to None for unique field
        
        return data


class CustomerSerializer(serializers.ModelSerializer):
    # Fields that are blank=True in the model
    company_name = serializers.CharField(required=False, allow_blank=True, max_length=200)
    national_id = serializers.CharField(required=False, allow_blank=True, max_length=11)
    full_name = serializers.CharField(required=False, allow_blank=True, max_length=100)
    personal_code = serializers.CharField(required=False, allow_blank=True, max_length=10)
    description = serializers.CharField(required=False, allow_blank=True)
    tags = serializers.CharField(required=False, allow_blank=True, max_length=200)
    
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
            data['personal_code'] = None  # Set to None for unique field
            
        elif customer_type == PartyType.INDIVIDUAL:
            if not data.get('full_name'):
                raise serializers.ValidationError("Full name is required for individual customers")
            if not data.get('personal_code'):
                raise serializers.ValidationError("Personal code is required for individual customers")
            data['company_name'] = ''
            data['national_id'] = None  # Set to None for unique field
        
        return data


class ReceiverSerializer(serializers.ModelSerializer):
    # Fields that are blank=True in the model
    company_name = serializers.CharField(required=False, allow_blank=True, max_length=200)
    national_id = serializers.CharField(required=False, allow_blank=True, max_length=11)
    full_name = serializers.CharField(required=False, allow_blank=True, max_length=100)
    personal_code = serializers.CharField(required=False, allow_blank=True, max_length=10)
    description = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = Receiver
        fields = [
            'id', 'receiver_type', 'system_id', 'unique_id', 'company_name',
            'national_id', 'full_name', 'personal_code', 'economic_code',
            'phone', 'address', 'description', 'postal_code', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate(self, data):
        receiver_type = data.get('receiver_type')
        
        if receiver_type == PartyType.CORPORATE:
            if not data.get('company_name'):
                raise serializers.ValidationError("Company name is required for corporate receivers")
            if not data.get('national_id'):
                raise serializers.ValidationError("National ID is required for corporate receivers")
            data['full_name'] = ''
            data['personal_code'] = None  # Set to None for unique field
            
        elif receiver_type == PartyType.INDIVIDUAL:
            if not data.get('full_name'):
                raise serializers.ValidationError("Full name is required for individual receivers")
            if not data.get('personal_code'):
                raise serializers.ValidationError("Personal code is required for individual receivers")
            data['company_name'] = ''
            data['national_id'] = None  # Set to None for unique field
        
        return data


class ProductListSerializer(serializers.ModelSerializer):
    category = ProductCategorySerializer(read_only=True)
    b2bregion = ProductRegionSerializer(read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'code', 'b2bcode', 'b2bregion',
            'category', 'description', 'created_at', 'updated_at'
        ]