from django.utils import timezone
from datetime import timedelta


def generate_deadline_notifications():
    """
    Creates Notification records for dispatches and offers expiring within 24 hours.
    Uses get_or_create so repeated calls are safe (idempotent).
    """
    from warehouse.models import DispatchIssue
    from b2b.models import B2BOffer
    from .models import Notification

    now = timezone.now()
    window = now + timedelta(hours=24)

    # --- Dispatch Issues expiring within 24h ---
    dispatches = DispatchIssue.objects.filter(
        validity_date__lte=window
    ).select_related('warehouse', 'sales_proforma__customer')

    for d in dispatches:
        customer_name = ''
        if d.sales_proforma and d.sales_proforma.customer:
            c = d.sales_proforma.customer
            customer_name = c.company_name if c.customer_type == 'corporate' else c.full_name

        is_overdue = d.validity_date < now
        if is_overdue:
            title = f'حواله منقضی شده: {d.dispatch_id}'
            message = (
                f'حواله {d.dispatch_id}'
                + (f' برای {customer_name}' if customer_name else '')
                + ' منقضی شده است.'
            )
        else:
            hours_left = max(0, int((d.validity_date - now).total_seconds() // 3600))
            title = f'سررسید حواله: {d.dispatch_id}'
            message = (
                f'حواله {d.dispatch_id}'
                + (f' برای {customer_name}' if customer_name else '')
                + f' در {hours_left} ساعت دیگر منقضی می‌شود.'
            )

        Notification.objects.get_or_create(
            entity_type='dispatch',
            entity_id=d.dispatch_id,
            defaults={
                'title': title,
                'message': message,
                'deadline': d.validity_date,
            },
        )

    # --- B2B Offers expiring within 24h ---
    offers = B2BOffer.objects.filter(
        offer_exp_date__lte=window,
        status='active',
    ).select_related('product', 'warehouse_receipt__warehouse')

    for o in offers:
        product_name = o.product.name if o.product else None
        if not product_name and o.warehouse_receipt:
            first_item = o.warehouse_receipt.items.select_related('product').first()
            if first_item and first_item.product:
                product_name = first_item.product.name
        product_name = product_name or 'نامشخص'

        is_overdue = o.offer_exp_date < now
        if is_overdue:
            title = f'عرضه منقضی شده: {o.offer_id}'
            message = f'عرضه {o.offer_id} ({product_name}) منقضی شده است.'
        else:
            hours_left = max(0, int((o.offer_exp_date - now).total_seconds() // 3600))
            title = f'سررسید عرضه: {o.offer_id}'
            message = f'عرضه {o.offer_id} ({product_name}) در {hours_left} ساعت دیگر منقضی می‌شود.'

        Notification.objects.get_or_create(
            entity_type='offer',
            entity_id=o.offer_id,
            defaults={
                'title': title,
                'message': message,
                'deadline': o.offer_exp_date,
            },
        )
