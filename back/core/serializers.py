from rest_framework import serializers
from .models import Supplier, Customer, Receiver, Product, Indicator
from .utils.indicator_format import render_indicator_template



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
            'id', 'receiver_type', 'company_name',
            'national_id', 'full_name', 'personal_code', 'economic_code',
            'phone', 'address', 'description', 'postal_code', 'created_at', 'updated_at'
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


class IndicatorSerializer(serializers.ModelSerializer):
    """Serializes indicators while accepting both machine keys and localized labels."""

    BELONGS_ALIASES = {
        "warehouse_receipt": {"warehouse_receipt", "رسید انبار"},
        "dispatch_issue": {"dispatch_issue", "صدور حواله"},
        "delivery_fulfillment": {"delivery_fulfillment", "تحویل کالا"},
        "sale_proforma": {"sale_proforma", "پیش فاکتور فروش"},
        "purchase_proforma": {"purchase_proforma", "پیش فاکتور خرید"},
    }

    format_preview = serializers.SerializerMethodField()

    class Meta:
        model = Indicator
        fields = ['id', 'name', 'belongs', 'counter', 'is_default', 'format_template', 'format_preview', 'start_number', 'end_number']
        read_only_fields = ['counter']
        extra_kwargs = {
            'is_default': {'required': False},
            'belongs': {'validators': []},
            'start_number': {'required': False},
            'end_number': {'required': False},
        }
        validators = []

    def validate_name(self, value: str) -> str:
        normalized_value = value.strip()
        if not normalized_value:
            raise serializers.ValidationError("name is required")

        queryset = Indicator.objects.filter(name=normalized_value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError(
                "An indicator with this name already exists. Please choose another name."
            )

        return normalized_value

    def validate_belongs(self, value: str) -> str:
        if not value:
            raise serializers.ValidationError("belongs is required")
        normalized_value = value.strip()
        for slug, aliases in self.BELONGS_ALIASES.items():
            if normalized_value in aliases:
                return slug

        return normalized_value

    def validate_format_template(self, value: str) -> str:
        normalized_value = (value or "").strip()
        if not normalized_value:
            raise serializers.ValidationError("format_template is required")
        return normalized_value

    def get_format_preview(self, obj: Indicator) -> str:
        return render_indicator_template(
            obj.format_template,
            counter_value=(obj.counter or 0) + 1,
        )
