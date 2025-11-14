from decimal import Decimal
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.db import transaction, models
from django.utils import timezone

from b2b.models.base import B2BSale
from .models import B2BOffer, B2BAddress, B2BDistribution
from core.serializers import ProductSerializer, CustomerSerializer
from warehouse.serializers import WarehouseSerializer
from finance.models import SalesProforma, ProformaLine


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
    warehouse_receipt_id = serializers.CharField(
        source='warehouse_receipt.receipt_id', read_only=True)

    class Meta:
        model = B2BOffer
        fields = ['id', 'offer_id', 'warehouse_receipt', 'warehouse_receipt_id', 'offer_weight', 'unit_price',
                  'total_price', 'offer_type', 'status', 'offer_date', 'offer_exp_date', 'product_name', 'product_id']

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

    def validate(self, attrs):
        attrs = super().validate(attrs)
        offer = attrs.get('product_offer') or getattr(self.instance, 'product_offer', None)
        product = attrs.get('product') or getattr(self.instance, 'product', None)
        weight = attrs.get('total_weight_purchased') or getattr(self.instance, 'total_weight_purchased', None)
        cottage_code = attrs.get('cottage_code') or getattr(self.instance, 'cottage_code', None)
        if offer and product:
            receipt = offer.warehouse_receipt
            receipt_product = receipt.items.first().product if receipt and receipt.items.exists() else None
            if receipt_product and receipt_product.id != product.id:
                raise serializers.ValidationError({'product': 'کالا با عرضه انتخاب شده همخوانی ندارد.'})
            if offer.offer_weight and weight:
                qs = offer.sales.all()
                if self.instance:
                    qs = qs.exclude(pk=self.instance.pk)
                consumed = qs.aggregate(total=models.Sum('total_weight_purchased'))['total'] or Decimal('0')
                remaining = Decimal(offer.offer_weight) - consumed
                requested = Decimal(weight)
                if remaining < requested:
                    raise serializers.ValidationError({'total_weight_purchased': 'وزن درخواستی بیش از ظرفیت عرضه است.'})
        return attrs

    def validate_allocation_id(self, value):
        if self.instance and self.instance.allocation_id == value:
            return value
        if B2BAddress.objects.filter(allocation_id=value).exists():
            raise serializers.ValidationError("آدرس بازارگاه با این شماره تخصیص قبلاً ثبت شده است.")
        return value

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
        fields = ['id', 'purchase_id', 'allocation_id', 'cottage_code', 'product', 'product_name', 'customer', 'customer_name',
                  'receiver', 'receiver_name', 'distributor_name', 'total_weight_purchased', 'purchase_date', 'warehouse_name']

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
    sales_proforma_id = serializers.IntegerField(source='sales_proforma.id', read_only=True)
    sales_proforma_serial = serializers.CharField(source='sales_proforma.serial_number', read_only=True)

    class Meta:
        model = B2BSale
        fields = '__all__'
        read_only_fields = ['total_price', 'sales_proforma']

    def validate(self, attrs):
        attrs = super().validate(attrs)
        offer = attrs.get('offer') or getattr(self.instance, 'offer', None)
        distribution = attrs.get('b2b_distribution') or getattr(self.instance, 'b2b_distribution', None)
        is_distributor = attrs.get('is_distributor') if 'is_distributor' in attrs else getattr(self.instance, 'is_distributor', False)
        product = attrs.get('product') or getattr(self.instance, 'product', None)
        weight = attrs.get('weight') or getattr(self.instance, 'weight', None)
        if is_distributor and not distribution:
            raise serializers.ValidationError({'b2b_distribution': 'عاملیت توزیع الزامی است.'})
        if not is_distributor and not offer:
            raise serializers.ValidationError({'offer': 'عرضه برای فروش الزامی است.'})
        if is_distributor and offer:
            raise serializers.ValidationError({'offer': 'برای فروش عاملیت نباید عرضه انتخاب شود.'})
        if not is_distributor and distribution:
            raise serializers.ValidationError({'b2b_distribution': 'برای فروش مستقیم نباید عاملیت انتخاب شود.'})
        source_receipt = None
        available_capacity = None
        if offer:
            source_receipt = offer.warehouse_receipt
            if offer.offer_weight:
                qs = offer.b2b_sales.all()
                if self.instance:
                    qs = qs.exclude(pk=self.instance.pk)
                consumed = qs.aggregate(total=models.Sum('weight'))['total'] or Decimal('0')
                available_capacity = Decimal(offer.offer_weight) - consumed
        elif distribution:
            source_receipt = distribution.warehouse_receipt
            if distribution.agency_weight:
                qs = distribution.b2b_sales.all()
                if self.instance:
                    qs = qs.exclude(pk=self.instance.pk)
                consumed = qs.aggregate(total=models.Sum('weight'))['total'] or Decimal('0')
                available_capacity = Decimal(distribution.agency_weight) - consumed
        if source_receipt and product:
            source_item = source_receipt.items.first()
            if source_item and source_item.product_id != product.id:
                raise serializers.ValidationError({'product': 'کالا با منبع انتخابی همخوانی ندارد.'})
        if available_capacity is not None and weight:
            requested = Decimal(weight)
            if requested > available_capacity:
                raise serializers.ValidationError({'weight': 'وزن فروش بیش از موجودی مجاز است.'})
        return attrs

    def get_customer_name(self, obj):
        if obj.customer:
            if obj.customer.customer_type == 'corporate':
                return obj.customer.company_name
            return obj.customer.full_name
        return None

    def get_product_name(self, obj):
        if obj.product:
            return obj.product.name
        return None

    def get_product_id(self, obj):
        if obj.product:
            return obj.product.id
        return None

    def _generate_unique_serial_number(self):
        """Generate a unique 5-digit serial number for sales proforma"""
        # Start from 10000 to ensure 5 digits
        latest_proforma = SalesProforma.objects.filter(
            serial_number__regex=r'^\d{5}$'
        ).order_by('-serial_number').first()

        if latest_proforma and latest_proforma.serial_number.isdigit():
            try:
                next_number = int(latest_proforma.serial_number) + 1
                # If we exceed 5 digits, wrap around to 10000
                if next_number > 99999:
                    next_number = 10000
            except (ValueError, AttributeError):
                next_number = 10000
        else:
            next_number = 10000

        # Ensure uniqueness by checking if it already exists
        serial_number = str(next_number).zfill(5)
        attempts = 0
        while SalesProforma.objects.filter(serial_number=serial_number).exists() and attempts < 90000:
            next_number += 1
            if next_number > 99999:
                next_number = 10000
            serial_number = str(next_number).zfill(5)
            attempts += 1

        return serial_number

    @transaction.atomic
    def create(self, validated_data):
        is_distributor = validated_data.get('is_distributor', False)

        # Create the B2B sale
        sale = B2BSale.objects.create(**validated_data)

        # If this is a "your sale" (not distributor), create a sales proforma
        if not is_distributor:
            try:
                # Generate unique serial number
                serial_number = self._generate_unique_serial_number()

                # Create the sales proforma
                sales_proforma = SalesProforma.objects.create(
                    serial_number=serial_number,
                    date=timezone.now(),
                    customer=sale.customer,
                    payment_type=validated_data.get('purchase_type', 'cash'),
                    payment_description=validated_data.get('description', ''),
                    subtotal=sale.total_price,
                    tax=0,
                    discount=0,
                    final_price=sale.total_price
                )

                # Create a proforma line with the sale details
                ProformaLine.objects.create(
                    proforma=sales_proforma,
                    product=sale.product,
                    weight=sale.weight,
                    unit_price=sale.unit_price
                )

                # Link the sale to the proforma
                sale.sales_proforma = sales_proforma
                sale.save(update_fields=['sales_proforma'])

            except Exception as e:
                # If proforma creation fails, the transaction will rollback
                raise serializers.ValidationError({
                    'sales_proforma': f'Failed to create sales proforma: {str(e)}'
                })

        return sale


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
        fields = ['id', 'transfer_id', 'warehouse_receipt', 'customer_name', 'product_name', 'agency_weight', 'unit_price',
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
