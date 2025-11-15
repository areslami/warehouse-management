from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.admin.views.decorators import staff_member_required
from django.utils.decorators import method_decorator
from django.views.generic import ListView, CreateView, UpdateView, DetailView
from django.urls import reverse_lazy
from django.contrib import messages
from django.http import JsonResponse
from django.core.paginator import Paginator
from django.db.models import Q, Sum
from django.db import transaction
import json
import jdatetime

from ..models import (
    WarehouseDeliveryOrder, 
    WarehouseDeliveryOrderItem, 
    Warehouse, 
    Product, 
    Receiver, 
    ShippingCompany,
    SalesProforma
)
from ..forms import WarehouseDeliveryOrderForm

@method_decorator(staff_member_required, name='dispatch')
class DeliveryOrderListView(ListView):
    """لیست حواله‌های خروج انبار"""
    model = WarehouseDeliveryOrder
    template_name = 'warehouse/delivery_orders/list.html'
    context_object_name = 'delivery_orders'
    paginate_by = 10
    
    def get_queryset(self):
        queryset = WarehouseDeliveryOrder.objects.select_related(
            'warehouse', 'shipping_company', 'sales_proforma'
        ).prefetch_related('items')
        
        # Search filters
        number = self.request.GET.get('number')
        warehouse_id = self.request.GET.get('warehouse')
        shipping_company_id = self.request.GET.get('shipping_company')
        
        if number:
            queryset = queryset.filter(number__icontains=number)
        if warehouse_id:
            queryset = queryset.filter(warehouse_id=warehouse_id)
        if shipping_company_id:
            queryset = queryset.filter(shipping_company_id=shipping_company_id)
            
        return queryset.order_by('-created_at')
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        # Get all delivery orders for statistics
        all_orders = WarehouseDeliveryOrder.objects.all()
        
        # Statistics
        context.update({
            'total_orders': all_orders.count(),
            'total_weight': all_orders.aggregate(Sum('total_weight'))['total_weight__sum'] or 0,
            'active_orders': all_orders.filter(validity_date__gte=jdatetime.date.today()).count(),
            'total_items': WarehouseDeliveryOrderItem.objects.count(),
            'warehouses': Warehouse.objects.all(),
            'shipping_companies': ShippingCompany.objects.all(),
            'today': jdatetime.date.today(),
        })
        
        return context

@method_decorator(staff_member_required, name='dispatch')
class DeliveryOrderCreateView(CreateView):
    """ایجاد حواله خروج جدید"""
    model = WarehouseDeliveryOrder
    form_class = WarehouseDeliveryOrderForm
    template_name = 'warehouse/delivery_orders/working_form.html'
    success_url = reverse_lazy('warehouse:delivery_order_list')
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context.update({
            'warehouses': Warehouse.objects.all(),
            'sales_proformas': SalesProforma.objects.all(),
            'shipping_companies': ShippingCompany.objects.all(),
            'products': Product.objects.all(),
            'receivers': Receiver.objects.all(),
        })
        return context
    
    def form_valid(self, form):
        try:
            with transaction.atomic():
                # Save the delivery order
                delivery_order = form.save()
                
                # Process items from POST data
                items_data = self._extract_items_data()
                
                if not items_data:
                    messages.error(self.request, 'لطفاً حداقل یک آیتم به حواله اضافه کنید.')
                    return redirect('warehouse:delivery_order_create')
                
                created_items = 0
                for item_data in items_data:
                    if self._is_valid_item_data(item_data):
                        try:
                            receiver = get_object_or_404(Receiver, id=item_data['receiver'])
                            product = get_object_or_404(Product, id=item_data['product'])
                            
                            # Get the next row number
                            last_item = WarehouseDeliveryOrderItem.objects.filter(
                                delivery_order=delivery_order
                            ).order_by('-row_number').first()
                            row_number = (last_item.row_number + 1) if last_item else 1
                            
                            WarehouseDeliveryOrderItem.objects.create(
                                delivery_order=delivery_order,
                                row_number=row_number,
                                product=product,
                                quantity=float(item_data['quantity']),
                                vehicle_type=item_data['vehicle_type'],
                                receiver=receiver,
                                receiver_address=item_data.get('receiver_address', receiver.address),
                                receiver_postal_code=receiver.postal_code,
                                receiver_phone=receiver.phone,
                                receiver_unique_id=receiver.unique_id,
                            )
                            created_items += 1
                        except Exception as e:
                            pass
                            continue
                
                if created_items == 0:
                    messages.error(self.request, 'هیچ آیتم معتبری برای ثبت یافت نشد.')
                    return redirect('warehouse:delivery_order_create')
                
                messages.success(self.request, f'حواله خروج با {created_items} آیتم با موفقیت ایجاد شد.')
                return redirect('warehouse:delivery_order_list')
                
        except Exception as e:
            messages.error(self.request, f'خطا در ثبت حواله: {str(e)}')
            return super().form_invalid(form)
    
    def form_invalid(self, form):
        """Handle form validation errors"""
        messages.error(self.request, 'لطفاً خطاهای فرم را بررسی کنید.')
        for field, errors in form.errors.items():
            for error in errors:
                messages.error(self.request, f'{form.fields[field].label}: {error}')
        return super().form_invalid(form)
    
    def _extract_items_data(self):
        """استخراج داده‌های آیتم‌ها از POST"""
        items_data = []
        post_data = self.request.POST
        
        # Find all item indices
        indices = set()
        for key in post_data.keys():
            if key.startswith('items[') and '][' in key:
                index = key.split('[')[1].split(']')[0]
                try:
                    indices.add(int(index))
                except ValueError:
                    continue
        
        # Extract data for each item
        for index in indices:
            item_data = {
                'product': post_data.get(f'items[{index}][product]'),
                'quantity': post_data.get(f'items[{index}][quantity]'),
                'vehicle_type': post_data.get(f'items[{index}][vehicle_type]'),
                'receiver': post_data.get(f'items[{index}][receiver]'),
                'receiver_address': post_data.get(f'items[{index}][receiver_address]'),
            }
            items_data.append(item_data)
        return items_data
    
    def _is_valid_item_data(self, item_data):
        """بررسی معتبر بودن داده‌های آیتم"""
        required_fields = ['product', 'quantity', 'vehicle_type', 'receiver']
        return all(item_data.get(field) for field in required_fields)

@method_decorator(staff_member_required, name='dispatch')
class DeliveryOrderUpdateView(UpdateView):
    """ویرایش حواله خروج"""
    model = WarehouseDeliveryOrder
    form_class = WarehouseDeliveryOrderForm
    template_name = 'warehouse/delivery_orders/working_form.html'
    success_url = reverse_lazy('warehouse:delivery_order_list')
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context.update({
            'warehouses': Warehouse.objects.all(),
            'sales_proformas': SalesProforma.objects.all(),
            'shipping_companies': ShippingCompany.objects.all(),
            'products': Product.objects.all(),
            'receivers': Receiver.objects.all(),
            'existing_items': self.object.items.all(),
        })
        return context
    
    def form_valid(self, form):
        try:
            with transaction.atomic():
                delivery_order = form.save()
                
                # Delete existing items
                delivery_order.items.all().delete()
                
                # Add new items
                items_data = self._extract_items_data()
                
                if not items_data:
                    messages.error(self.request, 'لطفاً حداقل یک آیتم به حواله اضافه کنید.')
                    return redirect('warehouse:delivery_order_update', pk=self.object.pk)
                
                created_items = 0
                for item_data in items_data:
                    if self._is_valid_item_data(item_data):
                        try:
                            receiver = get_object_or_404(Receiver, id=item_data['receiver'])
                            product = get_object_or_404(Product, id=item_data['product'])
                            
                            # Get the next row number
                            last_item = WarehouseDeliveryOrderItem.objects.filter(
                                delivery_order=delivery_order
                            ).order_by('-row_number').first()
                            row_number = (last_item.row_number + 1) if last_item else 1
                            
                            WarehouseDeliveryOrderItem.objects.create(
                                delivery_order=delivery_order,
                                row_number=row_number,
                                product=product,
                                quantity=float(item_data['quantity']),
                                vehicle_type=item_data['vehicle_type'],
                                receiver=receiver,
                                receiver_address=item_data.get('receiver_address', receiver.address),
                                receiver_postal_code=receiver.postal_code,
                                receiver_phone=receiver.phone,
                                receiver_unique_id=receiver.unique_id,
                            )
                            created_items += 1
                        except Exception as e:
                            pass
                            continue
                
                if created_items == 0:
                    messages.error(self.request, 'هیچ آیتم معتبری برای ثبت یافت نشد.')
                    return redirect('warehouse:delivery_order_update', pk=self.object.pk)
                
                messages.success(self.request, f'حواله خروج با {created_items} آیتم با موفقیت ویرایش شد.')
                return redirect('warehouse:delivery_order_list')
                
        except Exception as e:
            messages.error(self.request, f'خطا در ویرایش حواله: {str(e)}')
            return super().form_invalid(form)
    
    def form_invalid(self, form):
        """Handle form validation errors"""
        messages.error(self.request, 'لطفاً خطاهای فرم را بررسی کنید.')
        for field, errors in form.errors.items():
            for error in errors:
                messages.error(self.request, f'{form.fields[field].label}: {error}')
        return super().form_invalid(form)
    
    def _extract_items_data(self):
        """استخراج داده‌های آیتم‌ها از POST"""
        items_data = []
        post_data = self.request.POST
        
        # Find all item indices
        indices = set()
        for key in post_data.keys():
            if key.startswith('items[') and '][' in key:
                index = key.split('[')[1].split(']')[0]
                try:
                    indices.add(int(index))
                except ValueError:
                    continue
        
        # Extract data for each item
        for index in indices:
            item_data = {
                'product': post_data.get(f'items[{index}][product]'),
                'quantity': post_data.get(f'items[{index}][quantity]'),
                'vehicle_type': post_data.get(f'items[{index}][vehicle_type]'),
                'receiver': post_data.get(f'items[{index}][receiver]'),
                'receiver_address': post_data.get(f'items[{index}][receiver_address]'),
            }
            items_data.append(item_data)
        return items_data
    
    def _is_valid_item_data(self, item_data):
        """بررسی معتبر بودن داده‌های آیتم"""
        required_fields = ['product', 'quantity', 'vehicle_type', 'receiver']
        return all(item_data.get(field) for field in required_fields)

@method_decorator(staff_member_required, name='dispatch')
class DeliveryOrderDetailView(DetailView):
    """نمایش جزئیات حواله خروج"""
    model = WarehouseDeliveryOrder
    template_name = 'warehouse/delivery_orders/detail.html'
    context_object_name = 'delivery_order'
    
    def get_object(self):
        return get_object_or_404(
            WarehouseDeliveryOrder.objects.select_related(
                'warehouse', 'shipping_company', 'sales_proforma'
            ).prefetch_related('items__product', 'items__receiver'),
            pk=self.kwargs['pk']
        )

@staff_member_required
def get_receiver_info(request, receiver_id):
    """API برای دریافت اطلاعات گیرنده"""
    try:
        receiver = get_object_or_404(Receiver, id=receiver_id)
        data = {
            'address': receiver.address,
            'postal_code': receiver.postal_code,
            'phone': receiver.phone,
            'unique_id': receiver.unique_id,
        }
        return JsonResponse(data)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)