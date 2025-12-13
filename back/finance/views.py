from django.http import HttpResponse
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import (
    SalesProforma,
    PurchaseProforma,
    ProformaLine,
    SalesProformaExportPreset,
)
from .serializers import (
    SalesProformaSerializer,
    PurchaseProformaSerializer,
    ProformaLineSerializer,
    SalesProformaExportPresetSerializer,
)
from .export_pdf import render_sales_proforma_pdf


class SalesProformaExportPresetViewSet(viewsets.ModelViewSet):
    queryset = SalesProformaExportPreset.objects.all()
    serializer_class = SalesProformaExportPresetSerializer
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["name", "bank_name"]
    search_fields = ["name", "bank_name", "account_number", "sheba_number"]
    ordering_fields = ["name", "created_at"]
    ordering = ["-created_at"]


class PurchaseProformaViewSet(viewsets.ModelViewSet):
    queryset = (
        PurchaseProforma.objects.select_related("supplier")
        .prefetch_related("lines__product")
        .all()
    )
    serializer_class = PurchaseProformaSerializer
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["supplier", "date"]
    search_fields = ["serial_number", "supplier__company_name", "supplier__full_name"]
    ordering_fields = ["date", "serial_number", "final_price"]
    ordering = ["-date"]

    @action(detail=False, methods=["get"])
    def by_supplier(self, request):
        supplier_id = request.query_params.get("supplier_id")
        if supplier_id:
            proformas = self.get_queryset().filter(supplier_id=supplier_id)
            serializer = self.get_serializer(proformas, many=True)
            return Response(serializer.data)
        return Response({"error": "supplier_id parameter is required"}, status=400)

    @action(detail=False, methods=["get"])
    def by_date_range(self, request):
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")

        if not start_date or not end_date:
            return Response(
                {"error": "start_date and end_date parameters are required"}, status=400
            )

        proformas = self.get_queryset().filter(date__range=[start_date, end_date])
        serializer = self.get_serializer(proformas, many=True)
        return Response(serializer.data)


class SalesProformaViewSet(viewsets.ModelViewSet):
    queryset = (
        SalesProforma.objects.select_related("customer", "export_preset")
        .prefetch_related("lines__product")
        .all()
    )
    serializer_class = SalesProformaSerializer
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["customer", "date", "payment_type", "export_preset"]
    search_fields = [
        "serial_number",
        "customer__company_name",
        "customer__full_name",
        "payment_description",
    ]
    ordering_fields = ["date", "serial_number", "final_price"]
    ordering = ["-date"]

    @action(detail=False, methods=["get"])
    def by_customer(self, request):
        customer_id = request.query_params.get("customer_id")
        if customer_id:
            proformas = self.get_queryset().filter(customer_id=customer_id)
            serializer = self.get_serializer(proformas, many=True)
            return Response(serializer.data)
        return Response({"error": "customer_id parameter is required"}, status=400)

    @action(detail=False, methods=["get"])
    def by_date_range(self, request):
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")

        if not start_date or not end_date:
            return Response(
                {"error": "start_date and end_date parameters are required"}, status=400
            )

        proformas = self.get_queryset().filter(date__range=[start_date, end_date])
        serializer = self.get_serializer(proformas, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def pdf(self, request, pk=None):
        proforma = self.get_object()
        try:
            pdf_bytes = render_sales_proforma_pdf(proforma)
            response = HttpResponse(pdf_bytes, content_type="application/pdf")
            filename = f"sales-proforma-{proforma.serial_number}.pdf"
            response["Content-Disposition"] = f'attachment; filename="{filename}"'
            return response
        except ValueError as e:
            return Response({"error": str(e)}, status=400)
        except Exception as e:
            return Response(
                {"error": "An error occurred while generating PDF."}, status=500
            )


class ProformaLineViewSet(viewsets.ModelViewSet):
    queryset = ProformaLine.objects.select_related('product', 'proforma').all()
    serializer_class = ProformaLineSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['product', 'proforma']
    search_fields = ['product__name', 'product__code']
    ordering_fields = ['created_at', 'unit_price', 'weight']
    ordering = ['-created_at']