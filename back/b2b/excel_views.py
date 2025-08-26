from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db import transaction, models
from .utils import parse_html_table, process_distribution_row, process_sale_row
from .models import B2BDistribution
from .serializers import B2BDistributionSerializer, B2BSaleSerializer
from core.models import Customer
from core.serializers import CustomerSerializer
import pandas as pd
import io

@api_view(['POST'])
def upload_excel_distribution(request):
    if 'file' not in request.FILES:
        return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    file = request.FILES['file']
    try:
        content = file.read()
        rows = parse_html_table(content)
        processed_rows = [process_distribution_row(row) for row in rows]
        
        return Response({
            'rows': processed_rows,
            'count': len(processed_rows)
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def upload_excel_sale(request):
    if 'file' not in request.FILES:
        return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    file = request.FILES['file']
    try:

        df = pd.read_excel(io.BytesIO(file.read()))
        rows = df.fillna('').to_dict('records')
        result = [process_sale_row(row) for row in rows]
        number_of_customer_created = sum([c for _,c,_ in result])
        number_of_receiver_created = sum([r for _,_,r in result])
        processed_rows = [processed for processed,_,_ in result]
        
        
        return Response({
            'rows': processed_rows,
            'count': len(processed_rows),
            'number_of_customer_created':number_of_customer_created,
            'number_of_receiver_created':number_of_receiver_created,
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)  

@api_view(['POST'])
def preview_distribution(request):
    data = request.data
    
    response_data = {
        'distribution_data': {
            'purchase_id': data.get('purchase_id'),
            'b2b_offer': data.get('offer', {}).get('id') if data.get('offer') else None,
            'warehouse': data.get('warehouse', {}).get('id') if data.get('warehouse') else None,
            'product': data.get('product', {}).get('id') if data.get('product') else None,
            'customer': data.get('customer', {}).get('id') if data.get('customer') else None,
            'agency_weight': data.get('distribution_weight'),
            'agency_date': data.get('distribution_date'),
            'description': data.get('credit_description', ''),
        },
        'unmapped_fields': data.get('unmapped', {}),
        'needs_customer_creation': not bool(data.get('customer')),
        'customer_name': data.get('customer_name'),
        'needs_product_creation': not bool(data.get('product')),
        'product_name': data.get('product_name'),
    }
    
    return Response(response_data)


@api_view(['POST'])
def preview_sale(request):
    data = request.data
    
    response_data = {
        'sale_data': {
            'allocation_id': data.get('allocation_id'),
            'purchase_id': data.get('purchase_id'),
            'b2b_offer': data.get('offer', {}).get('id') if data.get('offer') else None,
            'product': data.get('product', {}).get('id') if data.get('product') else None,
            'customer': data.get('customer', {}).get('id') if data.get('customer') else None,
            'receiver': data.get('receiver', {}).get('id') if data.get('receiver') else None,
            'total_weight_purchased': data.get('total_weight_purchased'),
            'purchase_date': data.get('purchase_date'),
            'unit_price': data.get('unit_price'),
            'payment_amount': data.get('payment_amount'),
            'payment_method': data.get('payment_method'),
            'province': data.get('province'),
            'city': data.get('city'),
            'tracking_number': data.get('tracking_number'),
            'description': data.get('credit_description', ''),
        },
        'needs_customer_creation': not bool(data.get('customer')),
        'customer_name': data.get('customer_name'),
        'needs_receiver_creation': not bool(data.get('receiver')),
        'receiver_name': data.get('receiver', {}).get('name') if data.get('receiver') else '',
        'needs_product_creation': not bool(data.get('product')),
        'product_name': data.get('product_name'),
    }
    
    return Response(response_data)


@api_view(['POST'])
def create_distributions_batch(request):
    distributions = request.data.get('distributions', [])
    
    if not distributions:
        return Response({'error': 'No distributions provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    created = []
    errors = []
    
    try:
        with transaction.atomic():
            for idx, dist_data in enumerate(distributions):
                serializer = B2BDistributionSerializer(data=dist_data)
                if serializer.is_valid():
                    serializer.save()
                    created.append(serializer.data)
                else:
                    errors.append({
                        'index': idx,
                        'purchase_id': dist_data.get('purchase_id'),
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
def create_sale_batch(request):
    distributions = request.data.get('sales', [])
    
    if not distributions:
        return Response({'error': 'No sales provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    created = []
    errors = []
    
    try:
        with transaction.atomic():
            for idx, dist_data in enumerate(distributions):
                serializer = B2BSaleSerializer(data=dist_data)
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

