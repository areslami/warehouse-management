from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db import transaction, models
from .utils import parse_html_table, process_row
from .models import B2BDistribution
from .serializers import B2BDistributionSerializer
from core.models import Customer
from core.serializers import CustomerSerializer


@api_view(['POST'])
def upload_excel(request):
    if 'file' not in request.FILES:
        return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    file = request.FILES['file']
    try:
        content = file.read()
        rows = parse_html_table(content)
        processed_rows = [process_row(row) for row in rows]
        
        return Response({
            'rows': processed_rows,
            'count': len(processed_rows)
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def preview_distribution(request):
    data = request.data
    
    # Get warehouse_receipt
    warehouse_receipt_id = data.get('warehouse_receipt')
    
    response_data = {
        'distribution_data': {
            'purchase_id': data.get('purchase_id'),
            'b2b_offer': data.get('offer', {}).get('id') if data.get('offer') else None,
            'warehouse_receipt': warehouse_receipt_id,
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
def create_distributions_batch(request):
    distributions = request.data.get('distributions', [])
    
    if not distributions:
        return Response({'error': 'No distributions provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    created = []
    errors = []
    
    try:
        with transaction.atomic():
            for idx, dist_data in enumerate(distributions):
                print(f"Distribution data: {dist_data}") 
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


@api_view(['GET'])
def search_customer(request):
    name = request.query_params.get('name', '')
    
    if not name:
        return Response({'error': 'Name parameter required'}, status=status.HTTP_400_BAD_REQUEST)
    
    customers = Customer.objects.filter(
        models.Q(full_name__icontains=name) |
        models.Q(company_name__icontains=name)
    )[:10]
    
    serializer = CustomerSerializer(customers, many=True)
    return Response(serializer.data)