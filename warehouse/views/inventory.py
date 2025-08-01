from django.shortcuts import render
from django.contrib.admin.views.decorators import staff_member_required
from django.utils.decorators import method_decorator
from django.views.generic import TemplateView
from ..models import WarehouseInventory, Warehouse, ProductCategory, Product

@method_decorator(staff_member_required, name='dispatch')
class InventoryListView(TemplateView):
    """لیست موجودی انبار"""
    template_name = 'warehouse/inventory_list.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        # Get all inventory items
        inventories = WarehouseInventory.objects.select_related(
            'warehouse', 'product', 'product__category'
        ).all()
        
        # Add summary stats
        context.update({
            'inventories': inventories,
            'warehouses': Warehouse.objects.all(),
            'categories': ProductCategory.objects.all(),
            'products': Product.objects.all(),
        })
        
        return context