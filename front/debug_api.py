#!/usr/bin/env python3
"""
Debug the exact API error
"""
import requests
import json
from datetime import datetime

API_BASE = 'http://localhost:8000'

def test_warehouse_receipt():
    """Test creating a warehouse receipt to see exact error"""
    
    # First get a warehouse and product
    warehouses = requests.get(f"{API_BASE}/warehouse/warehouses/").json()
    products = requests.get(f"{API_BASE}/products/").json()
    
    if not warehouses or not products:
        print("No warehouses or products found. Create test data first.")
        return
    
    # Test data similar to what frontend might send
    test_data = {
        "receipt_id": "TEST001",
        "receipt_type": "purchase",
        "date": "2025-08-12",  # This might be the issue - needs datetime format
        "warehouse": warehouses[0]["id"],
        "description": "Test receipt",
        "items": [
            {
                "product": products[0]["id"],
                "weight": 10.5
            }
        ]
    }
    
    print("Sending data:", json.dumps(test_data, indent=2))
    
    response = requests.post(
        f"{API_BASE}/warehouse/receipts/",
        headers={'Content-Type': 'application/json'},
        json=test_data
    )
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    # Try with datetime format
    test_data["date"] = "2025-08-12T10:30:00Z"
    print("\nTrying with datetime format...")
    
    response = requests.post(
        f"{API_BASE}/warehouse/receipts/",
        headers={'Content-Type': 'application/json'},
        json=test_data
    )
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")

if __name__ == "__main__":
    test_warehouse_receipt()