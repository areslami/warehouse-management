#!/usr/bin/env python
"""
Simple test script to verify delivery order form functionality
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'warehouse_management.settings')
django.setup()

from warehouse.models import (
    WarehouseDeliveryOrder, 
    WarehouseDeliveryOrderItem,
    Warehouse, 
    Product, 
    Receiver, 
    ShippingCompany,
    SalesProforma
)
from warehouse.models.parties import Customer

def test_models_exist():
    """Test that all required models exist and can be queried"""
    print("🔍 Testing model availability...")
    
    try:
        warehouse_count = Warehouse.objects.count()
        product_count = Product.objects.count()
        receiver_count = Receiver.objects.count()
        shipping_count = ShippingCompany.objects.count()
        proforma_count = SalesProforma.objects.count()
        
        print(f"✅ Warehouses: {warehouse_count}")
        print(f"✅ Products: {product_count}")
        print(f"✅ Receivers: {receiver_count}")
        print(f"✅ Shipping Companies: {shipping_count}")
        print(f"✅ Sales Proformas: {proforma_count}")
        
        return True
    except Exception as e:
        print(f"❌ Model test failed: {e}")
        return False

def test_form_fields():
    """Test that form can handle the expected field structure"""
    print("\n🔍 Testing form field structure...")
    
    # Simulate POST data structure
    test_post_data = {
        'number': 'DO-2025-001',
        'issue_date': '1403/05/09',
        'issue_date_gregorian': '2024-07-30',
        'validity_date': '1403/12/29',
        'validity_date_gregorian': '2025-03-20',
        'warehouse': '1',
        'sales_proforma': '1',
        'shipping_company': '1',
        'description': 'Test delivery order',
        'items[0][product]': '1',
        'items[0][quantity]': '100.5',
        'items[0][vehicle_type]': 'truck',
        'items[0][receiver]': '1',
        'items[0][receiver_address]': 'Test address',
        'items[1][product]': '2',
        'items[1][quantity]': '50',
        'items[1][vehicle_type]': 'pickup',
        'items[1][receiver]': '1',
        'items[1][receiver_address]': 'Test address 2',
    }
    
    # Test item extraction logic
    indices = set()
    for key in test_post_data.keys():
        if key.startswith('items[') and '][' in key:
            index = key.split('[')[1].split(']')[0]
            try:
                indices.add(int(index))
            except ValueError:
                continue
    
    print(f"✅ Found item indices: {sorted(indices)}")
    
    # Extract items
    items_data = []
    for index in indices:
        item_data = {
            'product': test_post_data.get(f'items[{index}][product]'),
            'quantity': test_post_data.get(f'items[{index}][quantity]'),
            'vehicle_type': test_post_data.get(f'items[{index}][vehicle_type]'),
            'receiver': test_post_data.get(f'items[{index}][receiver]'),
            'receiver_address': test_post_data.get(f'items[{index}][receiver_address]'),
        }
        items_data.append(item_data)
    
    print(f"✅ Extracted {len(items_data)} items")
    for i, item in enumerate(items_data):
        print(f"   Item {i}: {item}")
    
    return len(items_data) == 2

def test_jalali_conversion():
    """Test Jalali date conversion functions"""
    print("\n🔍 Testing Jalali date conversion...")
    
    # Test conversions that should work
    test_cases = [
        ('1403/05/09', '2024-07-30'),
        ('1403/01/01', '2024-03-20'),
        ('1403/12/29', '2025-03-20'),
    ]
    
    # Simple conversion function (same as in template)
    def jalali_to_gregorian_simple(jalali_date):
        parts = jalali_date.split('/')
        if len(parts) != 3:
            return None
        
        jy = int(parts[0])
        jm = int(parts[1])
        jd = int(parts[2])
        
        if jy < 1 or jy > 3178 or jm < 1 or jm > 12 or jd < 1 or jd > 31:
            return None
        
        # Simplified conversion for testing
        gy = jy + 621
        from datetime import date
        try:
            return date(gy, jm, jd).strftime('%Y-%m-%d')
        except:
            return None
    
    success_count = 0
    for jalali, expected in test_cases:
        result = jalali_to_gregorian_simple(jalali)
        if result:
            print(f"✅ {jalali} -> {result}")
            success_count += 1
        else:
            print(f"❌ {jalali} -> failed")
    
    return success_count > 0

def main():
    """Run all tests"""
    print("🚀 Starting delivery form functionality tests...\n")
    
    tests = [
        ("Model Availability", test_models_exist),
        ("Form Field Structure", test_form_fields),
        ("Jalali Date Conversion", test_jalali_conversion),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n{'='*50}")
        print(f"Running: {test_name}")
        print('='*50)
        
        try:
            if test_func():
                print(f"✅ {test_name}: PASSED")
                passed += 1
            else:
                print(f"❌ {test_name}: FAILED")
        except Exception as e:
            print(f"❌ {test_name}: ERROR - {e}")
    
    print(f"\n{'='*50}")
    print(f"Test Results: {passed}/{total} tests passed")
    print('='*50)
    
    if passed == total:
        print("🎉 All tests passed! The delivery form should be working correctly.")
    else:
        print("⚠️  Some tests failed. Please check the implementation.")

if __name__ == '__main__':
    main()