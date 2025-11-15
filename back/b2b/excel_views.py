from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.http import HttpResponse
from django.db import transaction, models
from datetime import datetime, date
from .utils import (
    parse_html_table,
    process_address_row,
    process_sale_row,
    process_your_sale_row,
    fa_payment_label,
    fa_status_label,
    extract_agreements,
)
from .models import B2BDistribution, B2BSale, B2BOffer, B2BAddress
from .serializers import B2BDistributionSerializer, B2BAddressSerializer, B2BSaleSerializer
from core.models import Customer
from core.serializers import CustomerSerializer
import pandas as pd
import io
from io import BytesIO
import jdatetime
import re
import os
from django.conf import settings


def _format_jalali_date(value, fmt='%Y/%m/%d'):
    """
    Convert a Gregorian datetime/date to a Jalali date string suitable for Excel exports.
    Returns an empty string when value is falsy or unsupported.
    """
    if not value:
        return ''

    if isinstance(value, jdatetime.datetime) or isinstance(value, jdatetime.date):
        return value.strftime(fmt)

    if isinstance(value, datetime):
        value = value.date()
    elif not isinstance(value, date):
        return ''

    return jdatetime.date.fromgregorian(date=value).strftime(fmt)


@api_view(['POST'])
def upload_excel_sales(request):
    if 'file' not in request.FILES:
        return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

    file = request.FILES['file']
    sale_type = request.POST.get('sale_type', 'distributor_sale')

    try:
        if sale_type == 'your_sale':
            content = file.read()
            rows = parse_html_table(content)
            print(
                f"Your sale HTML columns: {list(rows[0].keys()) if rows else 'No rows'}")
            processed_rows = [process_your_sale_row(row) for row in rows]

            return Response({
                'rows': processed_rows,
                'count': len(processed_rows),
                'sale_type': 'your_sale'
            })
        else:
            content = file.read()
            rows = parse_html_table(content)
            print(
                f"Distributor sale HTML columns: {list(rows[0].keys()) if rows else 'No rows'}")
            processed_rows = [process_sale_row(row) for row in rows]

            return Response({
                'rows': processed_rows,
                'count': len(processed_rows),
                'sale_type': 'distributor_sale'
            })
    except Exception as e:
        import traceback
        print(f"Error in upload_excel_sales: {str(e)}")
        print(traceback.format_exc())
        return Response({'error': str(e), 'details': traceback.format_exc()}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def upload_excel_addresses(request):
    if 'file' not in request.FILES:
        return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

    file = request.FILES['file']
    address_type = request.POST.get('address_type', '')
    try:
        df = pd.read_excel(io.BytesIO(file.read()))
        rows = df.fillna('').to_dict('records')

        if address_type == "your_address":
            offer_id = request.POST.get('offer_id', "")
            result = [process_address_row(
                row, address_type, offer_id) for row in rows]
        else:
            transfer_id = request.POST.get('transfer_id', "")
            result = [process_address_row(
                row, address_type, transfer_id) for row in rows]

        number_of_customer_created = sum([c for _, c, _, _ in result])
        number_of_receiver_created = sum([r for _, _, r, _ in result])
        number_of_sales_created = sum([s for _, _, _, s in result])
        processed_rows = [processed for processed, _, _, _ in result]

        return Response({
            'rows': processed_rows,
            'count': len(processed_rows),
            'number_of_customer_created': number_of_customer_created,
            'number_of_receiver_created': number_of_receiver_created,
            'number_of_sales_created': number_of_sales_created,
        })
    except Exception as e:
        import traceback
        print(f"Error in upload_excel_addresses: {str(e)}")
        print(traceback.format_exc())
        return Response({'error': str(e), 'details': traceback.format_exc()}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def preview_sales(request):
    data = request.data

    # Handle offer field properly - check if it has a valid id
    offer_id = None
    if data.get('offer') and isinstance(data.get('offer'), dict):
        offer_id = data.get('offer').get('id')

    # Map Persian payment types to valid choices
    payment_method = data.get('payment_method', 'cash')
    if payment_method == 'توافقی':
        payment_method = 'agreement'
    elif payment_method == 'نقدی':
        payment_method = 'cash'
    elif payment_method == 'اعتباری':
        payment_method = 'credit'
    elif payment_method not in ['cash', 'credit', 'agreement', 'other']:
        payment_method = 'other'

    # Map to B2BSale fields
    sale_data = {
        'purchase_id': data.get('purchase_id'),
        'b2b_offer': offer_id,
        'product': data.get('product', {}).get('id') if data.get('product') else None,
        'customer': data.get('customer', {}).get('id') if data.get('customer') else None,
        'agency_weight': data.get('distribution_weight') or data.get('weight') or data.get('total_weight_purchased') or 0,
        'agency_date': data.get('distribution_date') or data.get('purchase_date') or datetime.now().isoformat(),
        'unit_price': data.get('unit_price', 0),
        'total_price': data.get('total_amount') or data.get('payment_amount') or 0,
        'description': data.get('credit_description', ''),
        'cottage_code': data.get('cottage_code') or data.get('cottage_number') or '',
        'purchase_type': payment_method
    }

    response_data = {
        'sale_data': sale_data,
        'unmapped_fields': data.get('unmapped', {}),
        'needs_customer_creation': not bool(data.get('customer')),
        'customer_name': data.get('customer_name'),
        'needs_product_creation': not bool(data.get('product')),
        'product_name': data.get('product_name'),
    }

    return Response(response_data)


@api_view(['POST'])
def preview_addresses(request):
    data = request.data

    # Normalize payment method
    pm = data.get('payment_method')
    if isinstance(pm, str):
        pm_str = pm.strip()
    else:
        pm_str = ''
    if pm_str in ['cash', 'credit', 'agreement', 'other']:
        normalized_pm = pm_str
    else:
        if pm_str == 'توافقی':
            normalized_pm = 'agreement'
        elif pm_str == 'نقدی':
            normalized_pm = 'cash'
        elif pm_str == 'اعتباری':
            normalized_pm = 'credit'
        else:
            normalized_pm = 'other' if pm_str else ''

    # Extract offer id if provided
    offer_id = None
    if data.get('offer') and isinstance(data.get('offer'), dict):
        offer_id = data.get('offer').get('id')

    address_data = {
        'allocation_id': data.get('allocation_id'),
        'purchase_id': data.get('purchase_id'),
        'cottage_code': data.get('cottage_code') or data.get('cottage_number') or '',
        'product': data.get('product', {}).get('id') if data.get('product') else None,
        'customer': data.get('customer', {}).get('id') if data.get('customer') else None,
        'receiver': data.get('receiver', {}).get('id') if data.get('receiver') else None,
        'total_weight_purchased': data.get('total_weight_purchased'),
        'purchase_date': data.get('purchase_date'),
        'unit_price': data.get('unit_price'),
        'payment_amount': data.get('payment_amount'),
        'payment_method': normalized_pm,
        'province': data.get('province'),
        'city': data.get('city'),
        'tracking_number': data.get('tracking_number'),
        'credit_description': data.get('credit_description', ''),
    }

    if offer_id:
        address_data['product_offer'] = offer_id

    for k in ['customer_account_number', 'address_register_date', 'deposit_id', 'single', 'double', 'trailer', 'purchase_weight', 'waybilled_weight', 'non_waybilled_weight', "agreement_period_1", "agreement_amount_1", "agreement_period_2", "agreement_amount_2", "agreement_period_3", "agreement_amount_3", "description"]:
        if data.get(k) not in [None, '']:
            address_data[k] = data.get(k)

    response_data = {
        'address_data': address_data,
        'needs_customer_creation': not bool(data.get('customer')),
        'customer_name': data.get('customer_name'),
        'needs_receiver_creation': not bool(data.get('receiver')),
        'receiver_name': data.get('receiver', {}).get('name') if data.get('receiver') else '',
        'needs_product_creation': not bool(data.get('product')),
        'product_name': data.get('product_name'),
    }

    return Response(response_data)


@api_view(['POST'])
def create_sales_batch(request):
    sales = request.data.get('sales', [])

    if not sales:
        return Response({'error': 'No sales provided'}, status=status.HTTP_400_BAD_REQUEST)

    created = []
    errors = []

    try:
        with transaction.atomic():
            for idx, sale_data in enumerate(sales):
                # Map distribution fields to B2BSale fields
                # Map Persian payment types to valid choices
                payment_type = sale_data.get('purchase_type', 'cash')
                if payment_type == 'توافقی':
                    payment_type = 'agreement'
                elif payment_type == 'نقدی':
                    payment_type = 'cash'
                elif payment_type == 'اعتباری':
                    payment_type = 'credit'
                elif payment_type not in ['cash', 'credit', 'agreement', 'other']:
                    payment_type = 'other'

                weight = int(sale_data.get('agency_weight', 0) or sale_data.get(
                    'weight', 0) or sale_data.get('total_weight_purchased', 0) or 0)
                unit_price = int(sale_data.get('unit_price', 0) or 0)
                total_price = int(sale_data.get('total_price', 0) or 0)

                # Calculate total_price if not provided
                if total_price == 0 and weight > 0 and unit_price > 0:
                    total_price = weight * unit_price

                cleaned_data = {
                    'purchase_id': sale_data.get('purchase_id'),
                    'offer': sale_data.get('b2b_offer'),
                    'weight': weight,
                    'unit_price': unit_price,
                    'total_price': total_price,
                    'sale_date': sale_data.get('agency_date') or datetime.now().date().isoformat(),
                    'product': sale_data.get('product'),
                    'customer': sale_data.get('customer'),
                    'purchase_type': payment_type,
                    'credit_description': sale_data.get('credit_description', ''),
                    'cottage_code': sale_data.get('cottage_code', ''),
                    "agreement_period_1": sale_data.get('agreement_period_1', ''),
                    "agreement_amount_1": sale_data.get('agreement_amount_1', ''),
                    "agreement_period_2": sale_data.get('agreement_period_2', ''),
                    "agreement_amount_2": sale_data.get('agreement_amount_2', ''),
                    "agreement_period_3": sale_data.get('agreement_period_3', ''),
                    "agreement_amount_3": sale_data.get('agreement_amount_3', ''),
                    "description": sale_data.get('description', ''),
                }

                # Remove None values
                cleaned_data = {k: v for k,
                                v in cleaned_data.items() if v is not None}

                serializer = B2BSaleSerializer(data=cleaned_data)
                if serializer.is_valid():
                    serializer.save()
                    created.append(serializer.data)
                else:
                    print(f"Sale validation failed for index {idx}")
                    print(f"Data received: {cleaned_data}")
                    print(f"Errors: {serializer.errors}")
                    errors.append({
                        'index': idx,
                        'purchase_id': sale_data.get('purchase_id'),
                        'errors': serializer.errors
                    })

            if errors:
                raise ValueError("Validation errors occurred")

    except ValueError:
        return Response({
            'success': False,
            'errors': errors
        }, status=status.HTTP_400_BAD_REQUEST)

    return Response({
        'success': True,
        'created': created,
        'count': len(created)
    })


@api_view(['POST'])
def create_addresses_batch(request):
    sales = request.data.get('sales', [])
    if not sales:
        return Response({'error': 'No sales provided'}, status=status.HTTP_400_BAD_REQUEST)

    created = []
    errors = []

    try:
        with transaction.atomic():
            for idx, dist_data in enumerate(sales):
                # Clean the data - remove None or empty foreign key references
                cleaned_data = {}
                for key, value in dist_data.items():
                    # Skip None values and empty dicts for foreign key fields
                    if value is not None and value != {}:
                        # For foreign key fields, ensure they're not pointing to null/undefined
                        if key == 'product_offer' and (not value or value == 'null'):
                            continue
                        cleaned_data[key] = value

                pm = cleaned_data.get('payment_method', '')
                if isinstance(pm, str):
                    pm_str = pm.strip()
                    if pm_str not in ['cash', 'credit', 'agreement', 'other']:
                        if pm_str == 'توافقی':
                            cleaned_data['payment_method'] = 'agreement'
                        elif pm_str == 'نقدی':
                            cleaned_data['payment_method'] = 'cash'
                        elif pm_str == 'اعتباری':
                            cleaned_data['payment_method'] = 'credit'
                        else:
                            cleaned_data['payment_method'] = 'other' if pm_str else ''
                serializer = B2BAddressSerializer(data=cleaned_data)
                if serializer.is_valid():
                    serializer.save()
                    created.append(serializer.data)
                else:
                    errors.append({
                        'index': idx,
                        'allocation_id': dist_data.get('allocation_id'),
                        'errors': serializer.errors
                    })

            if errors:
                raise ValueError("Validation errors occurred")

    except ValueError:
        return Response({
            'success': False,
            'errors': errors
        }, status=status.HTTP_400_BAD_REQUEST)

    return Response({
        'success': True,
        'created': created,
        'count': len(created)
    })
def _get_address_row(address: B2BAddress, columns):
    customer = address.customer
    receiver = address.receiver
    offer = getattr(address, 'product_offer', None)
    ag_p1, ag_d1, ag_p2, ag_d2, ag_p3, ag_d3 = extract_agreements(
        getattr(address, 'credit_description', ''))
    column_value_map = {
        'purchase_id': address.purchase_id or '',
        'total_weight_purchased': int(address.total_weight_purchased or 0),
        'purchase_date': _format_jalali_date(address.purchase_date),
        'unit_price': int(address.unit_price or 0),
        'tracking_number': address.tracking_number or '',
        'province': address.province or '',
        'city': address.city or '',
        'payment_amount': int(address.payment_amount or 0),
        'customer_account_number': (address.customer_account_number or ''),
        'cottage_code': address.cottage_code or '',
        'product_title': (f"{address.product.code} / {address.product.name}" if address.product else ''),
        'description': getattr(address, 'credit_description', '') or '',
        'payment_method': fa_payment_label(getattr(address, 'payment_method', '')),
        'offer_id': (offer.offer_id if offer else ''),
        'address_register_date': _format_jalali_date(getattr(address, 'created_at', None)),
        'allocation_id': address.allocation_id or '',
        'customer_name': (customer.company_name or customer.full_name) if customer else '',
        'customer_national_code': (customer.national_id or customer.personal_code or '') if customer else '',
        'customer_postal_code': (customer.postal_code or '') if customer else '',
        'customer_address': (customer.address or '') if customer else '',
        'deposit_id': (address.deposit_id or ''),
        'customer_phone': (customer.phone or '') if customer else '',
        'customer_economic_code': (customer.economic_code or '') if customer else '',
        'customer_type': ('حقوقی' if (customer and customer.customer_type == 'corporate') else ('حقیقی' if customer else '')),
        'receiver_name': (receiver.company_name or receiver.full_name) if receiver else '',
        'receiver_economic_code': (receiver.economic_code or '') if receiver else '',
        'single': (address.single or ''),
        'double': (address.double or ''),
        'trailer': (address.trailer or ''),
        'receiver_address': (receiver.address or '') if receiver else '',
        'receiver_postal_code': (receiver.postal_code or '') if receiver else '',
        'receiver_phone': (receiver.phone or '') if receiver else '',
        'receiver_national_id': (receiver.personal_code or receiver.national_id or '') if receiver else '',
        'purchase_weight': int(address.purchase_weight or address.total_weight_purchased or 0),
        'waybilled_weight': int(address.waybilled_weight or 0),
        'non_waybilled_weight': int(address.non_waybilled_weight or 0),
        'agreement_period_1': ag_p1,
        'agreement_amount_1': ag_d1,
        'agreement_period_2': ag_p2,
        'agreement_amount_2': ag_d2,
        'agreement_period_3': ag_p3,
        'agreement_amount_3': ag_d3,
    }
    return [column_value_map.get(col, '') for col in columns]


def _ensure_selected_columns(request, mapping_dict, required_key=None):
    requested = request.data.get('columns') or []
    if not isinstance(requested, list):
        requested = []

    seen = set()
    column_keys = []
    for key in requested:
        if not isinstance(key, str):
            continue
        if key not in mapping_dict or key in seen:
            continue
        seen.add(key)
        column_keys.append(key)

    if required_key and required_key in mapping_dict and required_key not in seen:
        column_keys.insert(0, required_key)
        seen.add(required_key)

    if not column_keys:
        column_keys = list(mapping_dict.keys())

    headers = [mapping_dict[key] for key in column_keys]
    return column_keys, headers


@api_view(['POST'])
def export_addresses_xlsx(request):
    ids = request.data.get('ids', [])
    qs = B2BAddress.objects.filter(id__in=ids).select_related(
        'product', 'customer', 'receiver', 'product_offer__warehouse_receipt__warehouse'
    )
    from .excel_config import EXCEL_FIELD_MAPPING_ADDRESS
    column_keys, headers = _ensure_selected_columns(
        request, EXCEL_FIELD_MAPPING_ADDRESS, required_key='purchase_id'
    )
    rows = []
    for a in qs:
        rows.append(_get_address_row(a, column_keys))

    df = pd.DataFrame(rows, columns=headers)
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Addresses')
        ws = writer.book.active
        ws.sheet_view.rightToLeft = True
        # Apply styling to match template at back/tmp/2.xlsx
        from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
        from openpyxl.utils import get_column_letter
        try:
            # Resolve template path using Django BASE_DIR with fallbacks
            candidates = [
                os.path.join(getattr(settings, 'BASE_DIR', ''),
                             'tmp', '2.xlsx'),
                os.path.normpath(os.path.join(
                    os.path.dirname(__file__), '../tmp/2.xlsx')),
                os.path.join(getattr(settings, 'BASE_DIR', ''),
                             'back', 'tmp', '2.xlsx'),
            ]
            template_path = next(
                (p for p in candidates if p and os.path.exists(p)), None)
            from openpyxl import load_workbook
            if template_path and os.path.exists(template_path):
                tmpl_wb = load_workbook(template_path)
                tmpl_ws = tmpl_wb.active

                # Copy sheet-level options
                try:
                    ws.sheet_view.showGridLines = tmpl_ws.sheet_view.showGridLines
                except Exception:
                    pass

                # Header row height
                try:
                    hdr_h = tmpl_ws.row_dimensions[1].height
                    if hdr_h:
                        ws.row_dimensions[1].height = hdr_h
                except Exception:
                    pass

                # Apply per-column header styles and column widths
                num_cols = ws.max_column
                t_first_header = tmpl_ws.cell(
                    row=1, column=1) if tmpl_ws.max_column >= 1 else None
                for col_idx in range(1, num_cols + 1):
                    col_letter = get_column_letter(col_idx)
                    out_cell = ws.cell(row=1, column=col_idx)
                    t_cell = tmpl_ws.cell(
                        row=1, column=col_idx) if col_idx <= tmpl_ws.max_column else None
                    if not t_cell:
                        t_cell = t_first_header

                    if t_cell:
                        try:
                            out_cell.font = t_cell.font
                        except Exception:
                            out_cell.font = Font(bold=True)
                        try:
                            out_cell.fill = t_cell.fill
                        except Exception:
                            pass
                        try:
                            out_cell.alignment = t_cell.alignment or Alignment(
                                horizontal='center', vertical='center')
                        except Exception:
                            out_cell.alignment = Alignment(
                                horizontal='center', vertical='center')
                        try:
                            out_cell.border = t_cell.border or Border()
                        except Exception:
                            pass

                    # Column width
                    try:
                        t_dim = tmpl_ws.column_dimensions.get(col_letter)
                        if t_dim and t_dim.width:
                            ws.column_dimensions[col_letter].width = t_dim.width
                    except Exception:
                        pass

                # Data row baseline style sampled from template row 2
                template_has_row2 = tmpl_ws.max_row >= 2
                t_first_body = tmpl_ws.cell(row=2, column=1) if (
                    tmpl_ws.max_row >= 2 and tmpl_ws.max_column >= 1) else None
                if template_has_row2:
                    max_r = ws.max_row
                    max_c = ws.max_column
                    for col_idx in range(1, max_c + 1):
                        t_body_cell = tmpl_ws.cell(
                            row=2, column=col_idx) if col_idx <= tmpl_ws.max_column else None
                        if not t_body_cell:
                            t_body_cell = t_first_body
                        if not t_body_cell:
                            continue
                        for row_idx in range(2, max_r + 1):
                            c = ws.cell(row=row_idx, column=col_idx)
                            # Apply font, alignment, and number format; avoid copying fills broadly
                            try:
                                c.font = t_body_cell.font
                            except Exception:
                                pass
                            try:
                                c.alignment = t_body_cell.alignment
                            except Exception:
                                pass
                            try:
                                if t_body_cell.number_format and t_body_cell.number_format != 'General':
                                    c.number_format = t_body_cell.number_format
                            except Exception:
                                pass

                # Ensure borders and fills even if template styles are partial
                thin_side = Side(style='thin', color='FF000000')
                thin_border = Border(
                    left=thin_side, right=thin_side, top=thin_side, bottom=thin_side)
                # Derive header/body fills from template if present, otherwise set explicit colors

                def _resolve_rgb(fill, default_rgb):
                    try:
                        if getattr(fill, 'patternType', None) == 'solid':
                            fg = getattr(fill, 'fgColor', None)
                            if fg is not None and getattr(fg, 'rgb', None):
                                rgb = fg.rgb
                                if len(rgb) == 6:
                                    return 'FF' + rgb
                                return rgb
                        return default_rgb
                    except Exception:
                        return default_rgb

                default_header_rgb = 'FF7030A0'   # purple
                default_body_rgb = 'FFF2F2F2'     # light gray

                header_source = tmpl_ws.cell(
                    row=1, column=1) if tmpl_ws and tmpl_ws.max_row >= 1 and tmpl_ws.max_column >= 1 else None
                body_source = tmpl_ws.cell(
                    row=2, column=1) if tmpl_ws and tmpl_ws.max_row >= 2 and tmpl_ws.max_column >= 1 else None

                header_rgb = _resolve_rgb(getattr(
                    header_source, 'fill', None), default_header_rgb) if header_source else default_header_rgb
                body_rgb = _resolve_rgb(getattr(
                    body_source, 'fill', None), default_body_rgb) if body_source else default_body_rgb

                header_fill = PatternFill(
                    fill_type='solid', fgColor=header_rgb)
                body_fill = PatternFill(fill_type='solid', fgColor=body_rgb)

                # Apply to header row
                for c in ws[1]:
                    c.fill = header_fill
                    c.border = thin_border
                    # Force white, bold header text while preserving font family/size if possible
                    try:
                        existing = c.font
                        c.font = Font(name=getattr(existing, 'name', None), size=getattr(
                            existing, 'size', None), bold=True, color='FFFFFFFF')
                    except Exception:
                        c.font = Font(bold=True, color='FFFFFFFF')
                # Apply to all data cells
                for row in ws.iter_rows(min_row=2, max_row=ws.max_row, min_col=1, max_col=ws.max_column):
                    for c in row:
                        c.fill = body_fill
                        c.border = thin_border
            else:
                # No template found: keep a simple readable header
                header_font = Font(bold=True, color='FFFFFFFF')
                header_fill = PatternFill(
                    fill_type='solid', fgColor='FF7030A0')  # purple
                body_fill = PatternFill(
                    fill_type='solid', fgColor='FFF2F2F2')    # light gray
                thin_side = Side(style='thin', color='FF000000')
                thin_border = Border(
                    left=thin_side, right=thin_side, top=thin_side, bottom=thin_side)
                for cell in ws[1]:
                    cell.font = header_font
                    cell.fill = header_fill
                    cell.alignment = Alignment(
                        horizontal='center', vertical='center')
                    cell.border = thin_border
                for row in ws.iter_rows(min_row=2, max_row=ws.max_row, min_col=1, max_col=ws.max_column):
                    for c in row:
                        c.fill = body_fill
                        c.border = thin_border
        except Exception:
            # Any unexpected styling error should not break export
            header_font = Font(bold=True, color='FFFFFFFF')
            header_fill = PatternFill(fill_type='solid', fgColor='FF7030A0')
            body_fill = PatternFill(fill_type='solid', fgColor='FFF2F2F2')
            thin_side = Side(style='thin', color='FF000000')
            thin_border = Border(
                left=thin_side, right=thin_side, top=thin_side, bottom=thin_side)
            for cell in ws[1]:
                cell.font = header_font
                cell.fill = header_fill
                cell.alignment = Alignment(
                    horizontal='center', vertical='center')
                cell.border = thin_border
            for row in ws.iter_rows(min_row=2, max_row=ws.max_row, min_col=1, max_col=ws.max_column):
                for c in row:
                    c.fill = body_fill
                    c.border = thin_border
        for col_cells in ws.columns:
            max_len = max((len(str(c.value)) if c.value is not None else 0)
                          for c in col_cells[:100])
            ws.column_dimensions[col_cells[0].column_letter].width = min(
                max(12, max_len + 2), 40)
        ws.freeze_panes = 'A2'

    output.seek(0)
    resp = HttpResponse(output.getvalue(
    ), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    resp['Content-Disposition'] = 'attachment; filename="b2b-addresses.xlsx"'
    return resp


def _get_offer_row(offer, columns):
    column_value_map = {
        'offer_id': offer.offer_id or '',
        'warehouse_receipt_id': offer.warehouse_receipt.receipt_id if offer.warehouse_receipt else '',
        'offer_weight': int(offer.offer_weight or 0),
        'unit_price': int(offer.unit_price or 0),
        'status': fa_status_label(offer.status or ''),
        'offer_type': fa_payment_label(offer.offer_type or ''),
        'offer_date': _format_jalali_date(offer.offer_date),
        'offer_exp_date': _format_jalali_date(offer.offer_exp_date),
        'description': offer.description or '',
    }
    return [column_value_map.get(col, '') for col in columns]


@api_view(['POST'])
def export_offers_xlsx(request):
    from .excel_config import EXCEL_FIELD_MAPPING_OFFER
    ids = request.data.get('ids', [])
    qs = B2BOffer.objects.filter(id__in=ids).select_related('warehouse_receipt')

    column_keys, headers = _ensure_selected_columns(
        request, EXCEL_FIELD_MAPPING_OFFER, required_key='offer_id'
    )
    rows = []

    for offer in qs:
        rows.append(_get_offer_row(offer, column_keys))

    df = pd.DataFrame(rows, columns=headers)
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Offers')
        ws = writer.book.active
        ws.sheet_view.rightToLeft = True

        from openpyxl.styles import Font, Alignment, PatternFill, Border, Side

        # Golden yellow header for offers (matching UI color #f6d265)
        header_fill = PatternFill(fill_type='solid', fgColor='FFF6D265')  # Golden yellow
        body_fill = PatternFill(fill_type='solid', fgColor='FFF2F2F2')    # Light gray
        thin_side = Side(style='thin', color='FF000000')
        thin_border = Border(left=thin_side, right=thin_side, top=thin_side, bottom=thin_side)

        # Style header row
        for cell in ws[1]:
            cell.fill = header_fill
            cell.border = thin_border
            cell.font = Font(bold=True, color='FF000000')  # Black text for better contrast
            cell.alignment = Alignment(horizontal='center', vertical='center')

        # Style data rows
        for row in ws.iter_rows(min_row=2, max_row=ws.max_row, min_col=1, max_col=ws.max_column):
            for c in row:
                c.fill = body_fill
                c.border = thin_border

        # Auto-size columns
        for col_cells in ws.columns:
            max_len = max((len(str(c.value)) if c.value is not None else 0) for c in col_cells[:100])
            ws.column_dimensions[col_cells[0].column_letter].width = min(max(12, max_len + 2), 40)

        ws.freeze_panes = 'A2'

    output.seek(0)
    resp = HttpResponse(output.getvalue(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    resp['Content-Disposition'] = 'attachment; filename="b2b-offers.xlsx"'
    return resp


def _get_distribution_row(dist, columns):
    customer_name = ''
    if dist.customer:
        customer_name = dist.customer.company_name if dist.customer.customer_type == 'corporate' else dist.customer.full_name
    column_value_map = {
        'transfer_id': dist.transfer_id or '',
        'customer_name': customer_name,
        'warehouse_receipt_id': dist.warehouse_receipt.receipt_id if dist.warehouse_receipt else '',
        'sales_proforma_serial': dist.sales_proforma.serial_number if dist.sales_proforma else '',
        'agency_weight': int(dist.agency_weight or 0),
        'unit_price': int(dist.unit_price or 0),
        'agency_date': _format_jalali_date(dist.agency_date),
        'description': dist.description or '',
    }
    return [column_value_map.get(col, '') for col in columns]


@api_view(['POST'])
def export_distributions_xlsx(request):
    from .excel_config import EXCEL_FIELD_MAPPING_DISTRIBUTION
    ids = request.data.get('ids', [])
    qs = B2BDistribution.objects.filter(id__in=ids).select_related(
        'warehouse_receipt', 'sales_proforma', 'customer'
    )

    column_keys, headers = _ensure_selected_columns(
        request, EXCEL_FIELD_MAPPING_DISTRIBUTION, required_key='transfer_id'
    )
    rows = []

    for dist in qs:
        rows.append(_get_distribution_row(dist, column_keys))

    df = pd.DataFrame(rows, columns=headers)
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Distributions')
        ws = writer.book.active
        ws.sheet_view.rightToLeft = True

        from openpyxl.styles import Font, Alignment, PatternFill, Border, Side

        # Teal header for distributions (complementary to golden yellow)
        header_fill = PatternFill(fill_type='solid', fgColor='FF00B5AD')  # Teal
        body_fill = PatternFill(fill_type='solid', fgColor='FFF2F2F2')    # Light gray
        thin_side = Side(style='thin', color='FF000000')
        thin_border = Border(left=thin_side, right=thin_side, top=thin_side, bottom=thin_side)

        # Style header row
        for cell in ws[1]:
            cell.fill = header_fill
            cell.border = thin_border
            cell.font = Font(bold=True, color='FFFFFFFF')  # White text
            cell.alignment = Alignment(horizontal='center', vertical='center')

        # Style data rows
        for row in ws.iter_rows(min_row=2, max_row=ws.max_row, min_col=1, max_col=ws.max_column):
            for c in row:
                c.fill = body_fill
                c.border = thin_border

        # Auto-size columns
        for col_cells in ws.columns:
            max_len = max((len(str(c.value)) if c.value is not None else 0) for c in col_cells[:100])
            ws.column_dimensions[col_cells[0].column_letter].width = min(max(12, max_len + 2), 40)

        ws.freeze_panes = 'A2'

    output.seek(0)
    resp = HttpResponse(output.getvalue(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    resp['Content-Disposition'] = 'attachment; filename="b2b-distributions.xlsx"'
    return resp


def _get_sale_row(sale, columns):
    customer_name = ''
    if sale.customer:
        customer_name = sale.customer.company_name if sale.customer.customer_type == 'corporate' else sale.customer.full_name
    column_value_map = {
        'purchase_id': sale.purchase_id or '',
        'is_distributor': 'بله' if sale.is_distributor else 'خیر',
        'offer_id': sale.offer.offer_id if sale.offer else '',
        'distribution_id': sale.b2b_distribution.transfer_id if sale.b2b_distribution else '',
        'product_name': sale.product.name if sale.product else '',
        'customer_name': customer_name,
        'weight': int(sale.weight or 0),
        'unit_price': int(sale.unit_price or 0),
        'total_price': int(sale.total_price or 0),
        'sale_date': _format_jalali_date(sale.sale_date),
        'purchase_type': fa_payment_label(sale.purchase_type or ''),
        'description': sale.description or '',
        'credit_period_1': '',
        'credit_amount_1': '',
        'credit_period_2': '',
        'credit_amount_2': '',
        'credit_period_3': '',
        'credit_amount_3': '',
    }
    credit_desc = getattr(sale, 'credit_description', '')
    ag_p1, ag_d1, ag_p2, ag_d2, ag_p3, ag_d3 = extract_agreements(credit_desc)
    column_value_map['credit_period_1'] = ag_p1
    column_value_map['credit_amount_1'] = ag_d1
    column_value_map['credit_period_2'] = ag_p2
    column_value_map['credit_amount_2'] = ag_d2
    column_value_map['credit_period_3'] = ag_p3
    column_value_map['credit_amount_3'] = ag_d3
    return [column_value_map.get(col, '') for col in columns]


@api_view(['POST'])
def export_sales_xlsx(request):
    from .excel_config import EXCEL_FIELD_MAPPING_SALE
    ids = request.data.get('ids', [])
    qs = B2BSale.objects.filter(id__in=ids).select_related(
        'product', 'customer', 'offer', 'b2b_distribution'
    )

    column_keys, headers = _ensure_selected_columns(
        request, EXCEL_FIELD_MAPPING_SALE, required_key='purchase_id'
    )
    rows = []

    for sale in qs:
        rows.append(_get_sale_row(sale, column_keys))

    df = pd.DataFrame(rows, columns=headers)
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Sales')
        ws = writer.book.active
        ws.sheet_view.rightToLeft = True

        from openpyxl.styles import Font, Alignment, PatternFill, Border, Side

        # Purple header for sales (triadic color harmony with yellow and teal)
        header_fill = PatternFill(fill_type='solid', fgColor='FF9B59B6')  # Purple
        body_fill = PatternFill(fill_type='solid', fgColor='FFF2F2F2')    # Light gray
        thin_side = Side(style='thin', color='FF000000')
        thin_border = Border(left=thin_side, right=thin_side, top=thin_side, bottom=thin_side)

        # Style header row
        for cell in ws[1]:
            cell.fill = header_fill
            cell.border = thin_border
            cell.font = Font(bold=True, color='FFFFFFFF')  # White text
            cell.alignment = Alignment(horizontal='center', vertical='center')

        # Style data rows
        for row in ws.iter_rows(min_row=2, max_row=ws.max_row, min_col=1, max_col=ws.max_column):
            for c in row:
                c.fill = body_fill
                c.border = thin_border

        # Auto-size columns
        for col_cells in ws.columns:
            max_len = max((len(str(c.value)) if c.value is not None else 0) for c in col_cells[:100])
            ws.column_dimensions[col_cells[0].column_letter].width = min(max(12, max_len + 2), 40)

        ws.freeze_panes = 'A2'

    output.seek(0)
    resp = HttpResponse(output.getvalue(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    resp['Content-Disposition'] = 'attachment; filename="b2b-sales.xlsx"'
    return resp
