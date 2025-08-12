#!/usr/bin/env python3
"""
Quick test data creator for Shams ERP
"""
import requests
import json
from datetime import datetime

API_BASE = 'http://localhost:8000'

def make_request(method, endpoint, data=None):
    headers = {'Content-Type': 'application/json'}
    url = f"{API_BASE}/{endpoint.lstrip('/')}"
    
    try:
        if method == 'POST':
            response = requests.post(url, headers=headers, json=data)
        elif method == 'GET':
            response = requests.get(url, headers=headers)
            
        if response.status_code in [200, 201]:
            return response.json()
        else:
            print(f"Error {response.status_code}: {response.text}")
            return None
    except Exception as e:
        print(f"Request failed: {str(e)}")
        return None

def create_test_data():
    print("Creating minimal test data...")
    
    # Create category
    category = make_request('POST', '/product-categories/', {
        "name": "محصولات آزمایشی",
        "description": "برای تست"
    })
    
    # Create region
    region = make_request('POST', '/product-regions/', {
        "name": "تهران",
        "description": "استان تهران"
    })
    
    # Create product
    if category and region:
        product = make_request('POST', '/products/', {
            "name": "برنج آزمایشی",
            "code": "TEST001",
            "b2bcode": "B2B-TEST-001",
            "b2bregion": region["id"],
            "category": category["id"],
            "description": "محصول آزمایشی"
        })
    
    # Create warehouse
    warehouse = make_request('POST', '/warehouse/warehouses/', {
        "name": "انبار آزمایشی",
        "address": "تهران، خیابان آزادی",
        "manager": "مدیر تست",
        "phone": "02133334444",
        "description": "انبار برای تست"
    })
    
    print("Test data created successfully!")

if __name__ == "__main__":
    create_test_data()