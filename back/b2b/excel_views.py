from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db import transaction, models
from datetime import datetime
from .utils import parse_html_table, process_address_row, process_sale_row, process_your_sale_row
from .models import B2BDistribution, B2BSale, B2BOffer
from .serializers import B2BDistributionSerializer, B2BAddressSerializer, B2BSaleSerializer
from core.models import Customer
from core.serializers import CustomerSerializer
import pandas as pd
import io

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
            print(f"Your sale HTML columns: {list(rows[0].keys()) if rows else 'No rows'}")
            processed_rows = [process_your_sale_row(row) for row in rows]
            
            return Response({
                'rows': processed_rows,
                'count': len(processed_rows),
                'sale_type': 'your_sale'
            })
        else:
            content = file.read()
            rows = parse_html_table(content)
            print(f"Distributor sale HTML columns: {list(rows[0].keys()) if rows else 'No rows'}")
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
    address_type = request.POST.get('address_type','')
    try:
        df = pd.read_excel(io.BytesIO(file.read()))
        rows = df.fillna('').to_dict('records')
        
        if address_type == "your_address":
            offer_id = request.POST.get('offer_id',"")
            result = [process_address_row(row,address_type,offer_id) for row in rows]
        else:
            transfer_id = request.POST.get('transfer_id',"")
            result = [process_address_row(row,address_type,transfer_id) for row in rows]
            
        number_of_customer_created = sum([c for _,c,_,_ in result])
        number_of_receiver_created = sum([r for _,_,r,_ in result])
        number_of_sales_created = sum([s for _,_,_,s in result])
        processed_rows = [processed for processed,_,_,_ in result]
        
        return Response({
            'rows': processed_rows,
            'count': len(processed_rows),
            'number_of_customer_created':number_of_customer_created,
            'number_of_receiver_created':number_of_receiver_created,
            'number_of_sales_created':number_of_sales_created,
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
        'description': data.get('credit_description', ''),
    }

    
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
                    
                weight = int(sale_data.get('agency_weight', 0) or sale_data.get('weight', 0) or sale_data.get('total_weight_purchased', 0) or 0)
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
                    'description': sale_data.get('description', ''),
                    'cottage_code': sale_data.get('cottage_code', '')
                }
                
                # Remove None values
                cleaned_data = {k: v for k, v in cleaned_data.items() if v is not None}
                
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
