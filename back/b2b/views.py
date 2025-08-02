from django.shortcuts import render


from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(['GET'])
def b2b_main(request):
    return Response({"message": "B2B API is working"})