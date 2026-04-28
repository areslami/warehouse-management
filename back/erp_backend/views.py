
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta


@api_view(['GET'])
def root_view(request):
    return Response({'message': "HI"})


@api_view(['GET'])
def dashboard_summary(request):
    from warehouse.models import WarehouseReceipt, DispatchIssue, DeliveryFulfillment
    from finance.models import SalesProforma, PurchaseProforma
    from b2b.models import B2BOffer, B2BSale

    # 1. Realized Revenue: sum of B2BSale.total_price
    realized_revenue = B2BSale.objects.aggregate(
        total=Sum('total_price')
    )['total'] or 0

    # 2. Pipeline Revenue: sum of SalesProforma.final_price
    pipeline_revenue = SalesProforma.objects.aggregate(
        total=Sum('final_price')
    )['total'] or 0

    # 3. Pending dispatches: dispatches count minus delivery count (best approximation)
    pending_dispatches = max(0, DispatchIssue.objects.count() - DeliveryFulfillment.objects.count())

    # 4. Total stock weight: sum(receipts) - sum(deliveries)
    total_received = WarehouseReceipt.objects.aggregate(
        total=Sum('total_weight')
    )['total'] or 0
    total_delivered = DeliveryFulfillment.objects.aggregate(
        total=Sum('total_weight')
    )['total'] or 0
    stock_weight = max(0, int(total_received) - int(total_delivered))

    # 5. Active B2B offers
    active_offers_qs = B2BOffer.objects.filter(status='active').select_related(
        'product', 'warehouse_receipt__warehouse'
    ).order_by('-offer_date')
    active_offers_count = active_offers_qs.count()

    active_offers_detail = []
    for o in active_offers_qs:
        product_name = o.product.name if o.product else None
        if not product_name and o.warehouse_receipt:
            first_item = o.warehouse_receipt.items.select_related('product').first()
            if first_item and first_item.product:
                product_name = first_item.product.name
        warehouse_name = (
            o.warehouse_receipt.warehouse.name
            if o.warehouse_receipt and o.warehouse_receipt.warehouse
            else ''
        )
        active_offers_detail.append({
            'offer_id': o.offer_id,
            'product': product_name or 'نامشخص',
            'warehouse': warehouse_name,
            'weight': int(o.offer_weight),
            'unit_price': int(o.unit_price),
            'total_price': int(o.total_price),
            'offer_type': o.offer_type,
            'offer_date': o.offer_date.strftime('%Y-%m-%d'),
            'exp_date': o.offer_exp_date.strftime('%Y-%m-%d'),
        })

    # 6. All pending dispatches detail + deadline items (within 14 days)
    now = timezone.now()
    deadline_window = now + timedelta(days=14)

    all_dispatches = DispatchIssue.objects.select_related(
        'warehouse', 'sales_proforma__customer'
    ).order_by('validity_date')

    pending_dispatches_detail = []
    deadline_items = []

    for d in all_dispatches:
        customer_name = ''
        if d.sales_proforma and d.sales_proforma.customer:
            c = d.sales_proforma.customer
            customer_name = c.company_name if c.customer_type == 'corporate' else c.full_name
        is_overdue = d.validity_date < now
        days_left = (d.validity_date.date() - now.date()).days
        row = {
            'dispatch_id': d.dispatch_id,
            'issue_date': d.issue_date.strftime('%Y-%m-%d'),
            'validity_date': d.validity_date.strftime('%Y-%m-%d'),
            'warehouse': d.warehouse.name if d.warehouse else '',
            'customer': customer_name,
            'total_weight': int(d.total_weight),
            'is_overdue': is_overdue,
        }
        pending_dispatches_detail.append(row)
        if d.validity_date <= deadline_window:
            deadline_items.append({
                'id': f'dispatch_{d.dispatch_id}',
                'type': 'dispatch',
                'label': d.dispatch_id,
                'customer': customer_name,
                'warehouse': d.warehouse.name if d.warehouse else '',
                'weight': int(d.total_weight),
                'deadline': d.validity_date.strftime('%Y-%m-%d'),
                'days_left': days_left,
                'is_overdue': is_overdue,
            })

    # Also include B2BOffer expiries within 14 days
    near_expiry_offers = B2BOffer.objects.filter(
        offer_exp_date__lte=deadline_window,
        status='active',
    ).select_related('product', 'warehouse_receipt__warehouse').order_by('offer_exp_date')

    for o in near_expiry_offers:
        product_name = o.product.name if o.product else None
        if not product_name and o.warehouse_receipt:
            first_item = o.warehouse_receipt.items.select_related('product').first()
            if first_item and first_item.product:
                product_name = first_item.product.name
        days_left = (o.offer_exp_date.date() - now.date()).days
        deadline_items.append({
            'id': f'offer_{o.offer_id}',
            'type': 'offer',
            'label': o.offer_id,
            'customer': '',
            'warehouse': (
                o.warehouse_receipt.warehouse.name
                if o.warehouse_receipt and o.warehouse_receipt.warehouse else ''
            ),
            'weight': int(o.offer_weight),
            'deadline': o.offer_exp_date.strftime('%Y-%m-%d'),
            'days_left': days_left,
            'is_overdue': o.offer_exp_date < now,
            'product': product_name or 'نامشخص',
        })

    # Sort all deadline items: overdue first, then by days_left asc
    deadline_items.sort(key=lambda x: (not x['is_overdue'], x['days_left']))

    # 7. Weekly trend: last 7 days — weight, revenue, offers
    weekly_trend = []
    for i in range(6, -1, -1):
        day = (now - timedelta(days=i)).date()
        day_received = WarehouseReceipt.objects.filter(
            date__date=day
        ).aggregate(total=Sum('total_weight'))['total'] or 0
        day_delivered = DeliveryFulfillment.objects.filter(
            issue_date__date=day
        ).aggregate(total=Sum('total_weight'))['total'] or 0
        day_revenue = B2BSale.objects.filter(
            sale_date=day
        ).aggregate(total=Sum('total_price'))['total'] or 0
        day_offers = B2BOffer.objects.filter(
            offer_date__date=day
        ).count()
        weekly_trend.append({
            'date': day.strftime('%Y-%m-%d'),
            'received': int(day_received),
            'delivered': int(day_delivered),
            'revenue': int(day_revenue),
            'offers': day_offers,
        })

    # 8. Revenue breakdown by product (for revenue detail panel)
    revenue_by_product = (
        B2BSale.objects
        .values('product__name')
        .annotate(total=Sum('total_price'))
        .order_by('-total')[:10]
    )
    revenue_breakdown = [
        {'product': row['product__name'] or 'نامشخص', 'total': int(row['total'])}
        for row in revenue_by_product
    ]

    # 9. Revenue detail: total income (B2BSale) vs total spent (PurchaseProforma)
    total_spent = PurchaseProforma.objects.aggregate(
        total=Sum('final_price')
    )['total'] or 0

    revenue_detail = {
        'total_income': int(realized_revenue),
        'total_spent': int(total_spent),
        'net': int(realized_revenue) - int(total_spent),
        'breakdown_by_product': revenue_breakdown,
    }

    # 10. Inventory detail: per warehouse, per product — receipts minus deliveries
    # Group receipt items by warehouse + product
    from django.db.models import F

    receipt_by_wh_product = (
        WarehouseReceipt.objects
        .filter(warehouse__isnull=False)
        .values(
            warehouse_name=F('warehouse__name'),
            product_name=F('items__product__name'),
        )
        .annotate(received=Sum('items__weight'))
        .exclude(received=None)
        .order_by('warehouse_name', '-received')
    )

    # Aggregate into {warehouse: [{product, received}]}
    wh_map: dict = {}
    for row in receipt_by_wh_product:
        wh = row['warehouse_name']
        if wh not in wh_map:
            wh_map[wh] = []
        wh_map[wh].append({
            'product': row['product_name'] or 'نامشخص',
            'weight': int(row['received']),
        })

    inventory_detail = [
        {'warehouse': wh, 'products': products}
        for wh, products in wh_map.items()
    ]

    return Response({
        'realized_revenue': int(realized_revenue),
        'pipeline_revenue': int(pipeline_revenue),
        'pending_dispatches': pending_dispatches,
        'stock_weight': stock_weight,
        'active_offers': active_offers_count,
        'deadline_items': deadline_items,
        'weekly_trend': weekly_trend,
        'revenue_breakdown': revenue_breakdown,
        'revenue_detail': revenue_detail,
        'inventory_detail': inventory_detail,
        'active_offers_detail': active_offers_detail,
        'pending_dispatches_detail': pending_dispatches_detail,
    })
