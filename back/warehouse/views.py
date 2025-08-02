from django.shortcuts import render


from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(['GET'])
def warehouse_main(request):
    return Response({"message": "Warehouse API is working"})