from rest_framework import viewsets, filters, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
import pandas as pd
import io

from .models import (
    Warehouse, ShippingCompany, WarehouseReceipt, DispatchIssue, DeliveryFulfillment,
    DeliveryColumnMapping
)
from .serializers import (
    WarehouseSerializer, ShippingCompanySerializer, WarehouseReceiptSerializer,
    WarehouseReceiptListSerializer, DispatchIssueSerializer, DeliveryFulfillmentSerializer,
    DeliveryColumnMappingSerializer
)
from .excel_utils import process_delivery_row, create_delivery_from_data


class WarehouseViewSet(viewsets.ModelViewSet):
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'manager', 'phone', 'address']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']


class ShippingCompanyViewSet(viewsets.ModelViewSet):
    queryset = ShippingCompany.objects.all()
    serializer_class = ShippingCompanySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'contact_person', 'phone']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']


class WarehouseReceiptViewSet(viewsets.ModelViewSet):
    queryset = WarehouseReceipt.objects.select_related('warehouse', 'proforma').prefetch_related('items__product').all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['receipt_type', 'warehouse']
    search_fields = ['receipt_id', 'cottage_serial_number', 'description']
    ordering_fields = ['date', 'created_at']
    ordering = ['-date']

    def get_serializer_class(self):
        if self.action == 'list':
            return WarehouseReceiptListSerializer
        return WarehouseReceiptSerializer

    @action(detail=False, methods=['get'])
    def by_date_range(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if start_date and end_date:
            receipts = self.get_queryset().filter(date__range=[start_date, end_date])
            serializer = WarehouseReceiptListSerializer(receipts, many=True)
            return Response(serializer.data)
        return Response({'error': 'start_date and end_date parameters are required'}, status=400)


class DispatchIssueViewSet(viewsets.ModelViewSet):
    queryset = DispatchIssue.objects.select_related(
        'warehouse', 'sales_proforma', 'shipping_company'
    ).prefetch_related('items__product', 'items__receiver').all()
    serializer_class = DispatchIssueSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['warehouse', 'shipping_company']
    search_fields = ['dispatch_id', 'description']
    ordering_fields = ['issue_date', 'created_at']
    ordering = ['-issue_date']


class DeliveryFulfillmentViewSet(viewsets.ModelViewSet):
    queryset = DeliveryFulfillment.objects.select_related(
        'b2b_address', 'warehouse_receipt', 'shipping_company'
    ).prefetch_related('items__product').all()
    serializer_class = DeliveryFulfillmentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['b2b_address', 'warehouse_receipt', 'shipping_company']
    search_fields = ['delivery_id', 'description']
    ordering_fields = ['issue_date', 'created_at']
    ordering = ['-issue_date']


class DeliveryColumnMappingViewSet(viewsets.ModelViewSet):
    queryset = DeliveryColumnMapping.objects.select_related('shipping_company').all()
    serializer_class = DeliveryColumnMappingSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['shipping_company']
    search_fields = ['name']
    ordering_fields = ['name', 'created_at']
    ordering = ['shipping_company', 'name']


@api_view(['POST'])
def upload_delivery_excel(request):
    """
    Upload Excel file and extract column headers and row data.
    Returns column names and preview of data for frontend mapping.
    """
    if 'file' not in request.FILES:
        return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

    file = request.FILES['file']
    shipping_company_id = request.POST.get('shipping_company_id')

    if not shipping_company_id:
        return Response({'error': 'Shipping company ID is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Read Excel file - first read without header to detect header row
        file_bytes = io.BytesIO(file.read())
        df_no_header = pd.read_excel(file_bytes, header=None, nrows=10)

        # Find the row with the most non-empty, unique values (likely the header row)
        header_row = 0
        max_named_cols = 0

        for idx in range(min(10, len(df_no_header))):
            row = df_no_header.iloc[idx]
            # Count non-empty, non-NaN values that look like column names (not numbers)
            named_count = sum(1 for val in row if pd.notna(val) and
                            str(val).strip() != '' and
                            not str(val).replace('.', '').replace(',', '').isdigit())

            if named_count > max_named_cols:
                max_named_cols = named_count
                header_row = idx

        # Now read the file again with the detected header row
        file_bytes.seek(0)
        df = pd.read_excel(file_bytes, header=header_row)

        # Get column headers - filter out unnamed columns
        all_columns = df.columns.tolist()
        # Keep only columns that don't start with "Unnamed"
        named_columns = [col for col in all_columns if not str(col).startswith('Unnamed')]

        # If we filtered out too many columns, include all columns
        if len(named_columns) < 5:  # Arbitrary threshold - we need at least some columns
            columns = all_columns
        else:
            columns = named_columns
            # Filter the dataframe to only include named columns
            df = df[named_columns]

        # Convert to list of dictionaries (rows)
        rows = df.fillna('').to_dict('records')

        return Response({
            'columns': columns,
            'rows': rows,
            'count': len(rows),
            'shipping_company_id': shipping_company_id,
            'header_row': header_row  # Include for debugging
        })
    except Exception as e:
        import traceback
        print(f"Error in upload_delivery_excel: {str(e)}")
        print(traceback.format_exc())
        return Response({
            'error': str(e),
            'details': traceback.format_exc()
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def batch_create_deliveries(request):
    """
    Create multiple deliveries from Excel data with column mappings.

    Expected request body:
    {
        "deliveries": [...],
        "column_mappings": {...},
        "shipping_company_id": 123
    }
    """
    try:
        deliveries_data = request.data.get('deliveries', [])
        column_mappings = request.data.get('column_mappings', {})
        shipping_company_id = request.data.get('shipping_company_id')

        if not deliveries_data:
            return Response({'error': 'No delivery data provided'}, status=status.HTTP_400_BAD_REQUEST)

        if not column_mappings:
            return Response({'error': 'Column mappings are required'}, status=status.HTTP_400_BAD_REQUEST)

        if not shipping_company_id:
            return Response({'error': 'Shipping company ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        created_deliveries = []
        errors = []

        for idx, row_data in enumerate(deliveries_data):
            try:
                # Process the row with column mappings
                result = process_delivery_row(row_data, column_mappings, shipping_company_id)

                if result.get('error'):
                    errors.append({
                        'row': idx + 1,
                        'error': result['error'],
                        'data': result.get('row_data')
                    })
                    continue

                # Create delivery from processed data
                delivery, error_msg = create_delivery_from_data(result['delivery_data'])

                if delivery:
                    created_deliveries.append(delivery.id)
                else:
                    errors.append({
                        'row': idx + 1,
                        'error': error_msg or 'خطای نامشخص در ایجاد تحویل',
                        'data': result.get('delivery_data')
                    })

            except Exception as e:
                import traceback
                errors.append({
                    'row': idx + 1,
                    'error': str(e),
                    'traceback': traceback.format_exc()
                })

        return Response({
            'success': True,
            'count': len(created_deliveries),
            'created_ids': created_deliveries,
            'errors': errors,
            'error_count': len(errors)
        })

    except Exception as e:
        import traceback
        print(f"Error in batch_create_deliveries: {str(e)}")
        print(traceback.format_exc())
        return Response({
            'error': str(e),
            'details': traceback.format_exc()
        }, status=status.HTTP_400_BAD_REQUEST)
