# Database Schema Documentation

This document provides a comprehensive overview of the database schema for the Shams Warehouse Management ERP system.

## Database Configuration

- **Database Type:** PostgreSQL
- **Database Name:** `shams-erp`
- **Database User:** `pguser`
- **Django ORM:** Models are organized into 4 main apps: `core`, `warehouse`, `finance`, `b2b`

## Global Constants & Enumerations

Defined in `back/core/models/base.py`:

```python
# Party type choices (for Supplier, Customer, Receiver)
PARTY_TYPES = [
    ('individual', 'individual'),  # For individual persons
    ('corporate', 'corporate'),    # For companies/organizations
]

# Transaction/Payment type choices
TRANSACTION_TYPES = [
    ('cash', 'cash'),           # Immediate cash payment
    ('credit', 'credit'),       # Credit/deferred payment
    ('agreement', 'agreement'), # Agreement-based payment
    ('other', 'other'),         # Other payment methods
]

# Vehicle type choices (for deliveries)
VEICHLE_TYPES = [
    ('single', 'single'),   # Single-axle truck
    ('double', 'double'),   # Double-axle truck
    ('trailer', 'trailer'), # Trailer truck
]

# Status choices (for B2B offers)
STATUS_TYPES = [
    ('pending', 'pending'),   # Offer is pending
    ('active', 'active'),     # Offer is active
    ('sold', 'sold'),         # Offer has been sold
    ('expired', 'expired'),   # Offer has expired
]
```

---

## 1. Core App Models

The `core` app contains foundational entities used throughout the system.

**Location:** `back/core/models/`

### 1.1 Product

**File:** `back/core/models/product.py`

Represents products/goods managed in the warehouse system.

**Fields:**

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | AutoField | PK | Auto-generated primary key |
| `name` | CharField(100) | NOT NULL | Product name |
| `code` | CharField(10) | NOT NULL, UNIQUE | Internal product code/SKU |
| `b2bcode` | CharField(10) | NOT NULL | Product code on B2B platform |
| `b2bregion` | CharField(10) | NOT NULL | Region code for B2B platform |
| `category` | CharField(10) | NOT NULL | Product category |
| `description` | TextField | NULLABLE | Product description |
| `created_at` | DateTimeField | AUTO | Creation timestamp |
| `updated_at` | DateTimeField | AUTO | Last update timestamp |

**String Representation:** `"{name} ({code})"`

**Example:** "White Cement (WC001)"

---

### 1.2 Supplier

**File:** `back/core/models/parties.py`

Represents suppliers that provide products to the company. Can be either individual or corporate entities.

**Fields:**

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | AutoField | PK | Auto-generated primary key |
| `supplier_type` | CharField(10) | NOT NULL, choices=PARTY_TYPES | Type: 'individual' or 'corporate' |
| **Corporate-specific fields** |
| `company_name` | CharField(200) | NULLABLE | Company name (for corporate) |
| `national_id` | CharField(11) | NULLABLE, UNIQUE | National company ID (for corporate) |
| **Individual-specific fields** |
| `full_name` | CharField(100) | NULLABLE | Full name (for individual) |
| `personal_code` | CharField(10) | NULLABLE, UNIQUE | Personal/national code (for individual) |
| **Common fields** |
| `economic_code` | CharField(20) | NOT NULL, UNIQUE | Economic/tax identifier |
| `phone` | CharField(20) | NOT NULL | Contact phone number |
| `address` | TextField | NOT NULL | Physical address |
| `description` | TextField | NULLABLE | Additional notes |
| `created_at` | DateTimeField | AUTO | Creation timestamp |
| `updated_at` | DateTimeField | AUTO | Last update timestamp |

**String Representation:**
- Corporate: `"{company_name} ({economic_code})"`
- Individual: `"{full_name} ({economic_code})"`

**Business Rules:**
- Must provide either `company_name` + `national_id` (corporate) OR `full_name` + `personal_code` (individual)
- `economic_code` is required for all suppliers and must be unique

---

### 1.3 Customer

**File:** `back/core/models/parties.py`

Represents customers who purchase products from the company. Structure similar to Supplier.

**Fields:**

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | AutoField | PK | Auto-generated primary key |
| `customer_type` | CharField(10) | NOT NULL, choices=PARTY_TYPES | Type: 'individual' or 'corporate' |
| **Corporate-specific fields** |
| `company_name` | CharField(200) | NULLABLE | Company name (for corporate) |
| `national_id` | CharField(11) | NULLABLE, UNIQUE | National company ID (for corporate) |
| **Individual-specific fields** |
| `full_name` | CharField(100) | NULLABLE | Full name (for individual) |
| `personal_code` | CharField(10) | NULLABLE, UNIQUE | Personal/national code (for individual) |
| **Common fields** |
| `economic_code` | CharField(20) | NOT NULL, UNIQUE | Economic/tax identifier |
| `phone` | CharField(20) | NOT NULL | Contact phone number |
| `address` | TextField | NOT NULL | Physical address |
| `postal_code` | CharField(20) | NOT NULL | Postal/ZIP code |
| `tags` | CharField(200) | NULLABLE | Tags for categorization |
| `description` | TextField | NULLABLE | Additional notes |
| `created_at` | DateTimeField | AUTO | Creation timestamp |
| `updated_at` | DateTimeField | AUTO | Last update timestamp |

**String Representation:**
- Corporate: `"{company_name} ({economic_code})"`
- Individual: `"{full_name} ({economic_code})"`

**Differences from Supplier:**
- Has `postal_code` (required)
- Has `tags` field for categorization

---

### 1.4 Receiver

**File:** `back/core/models/parties.py`

Represents the final recipients of delivered goods (may differ from the customer). Structure similar to Supplier/Customer.

**Fields:**

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | AutoField | PK | Auto-generated primary key |
| `receiver_type` | CharField(10) | NOT NULL, choices=PARTY_TYPES | Type: 'individual' or 'corporate' |
| **Corporate-specific fields** |
| `company_name` | CharField(200) | NULLABLE | Company name (for corporate) |
| `national_id` | CharField(11) | NULLABLE, UNIQUE | National company ID (for corporate) |
| **Individual-specific fields** |
| `full_name` | CharField(100) | NULLABLE | Full name (for individual) |
| `personal_code` | CharField(10) | NULLABLE, UNIQUE | Personal/national code (for individual) |
| **Common fields** |
| `economic_code` | CharField(20) | NOT NULL, UNIQUE | Economic/tax identifier |
| `phone` | CharField(20) | NOT NULL | Contact phone number |
| `address` | TextField | NOT NULL | Physical delivery address |
| `postal_code` | CharField(20) | NOT NULL | Postal/ZIP code |
| `description` | TextField | NULLABLE | Additional notes |
| `created_at` | DateTimeField | AUTO | Creation timestamp |
| `updated_at` | DateTimeField | AUTO | Last update timestamp |

**String Representation:**
- Corporate: `"{company_name} ({economic_code})"`
- Individual: `"{full_name} ({economic_code})"`

**Use Case:**
- A customer may purchase goods but have them delivered to a different receiver
- Useful for B2B scenarios where billing and delivery addresses differ

---

## 2. Warehouse App Models

The `warehouse` app manages inventory movements and logistics.

**Location:** `back/warehouse/models/`

### 2.1 Warehouse

**File:** `back/warehouse/models/base.py`

Represents physical warehouse locations where inventory is stored.

**Fields:**

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | AutoField | PK | Auto-generated primary key |
| `name` | CharField(100) | NOT NULL | Warehouse name |
| `address` | TextField | NOT NULL | Physical address |
| `manager` | CharField(100) | NOT NULL | Warehouse manager name |
| `phone` | CharField(20) | NOT NULL | Contact phone number |
| `description` | TextField | NULLABLE | Additional notes |
| `created_at` | DateTimeField | AUTO | Creation timestamp |
| `updated_at` | DateTimeField | AUTO | Last update timestamp |

**String Representation:** `"{name}"`

**Example:** "Main Warehouse - Tehran"

---

### 2.2 ShippingCompany

**File:** `back/warehouse/models/base.py`

Represents third-party shipping/logistics companies used for deliveries.

**Fields:**

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | AutoField | PK | Auto-generated primary key |
| `name` | CharField(200) | NOT NULL | Company name |
| `contact_person` | CharField(100) | NOT NULL | Primary contact person |
| `phone` | CharField(20) | NOT NULL | Contact phone number |
| `address` | TextField | NULLABLE | Company address |
| `description` | TextField | NULLABLE | Additional notes |
| `created_at` | DateTimeField | AUTO | Creation timestamp |
| `updated_at` | DateTimeField | AUTO | Last update timestamp |

**String Representation:** `"{name}"`

**Example:** "Express Logistics Co."

---

### 2.3 WarehouseReceipt

**File:** `back/warehouse/models/inventory.py`

Represents incoming inventory receipts (goods entering the warehouse). This is the starting point of inventory tracking.

**Receipt Types:**

```python
RECEIPT_TYPES = [
    ('import_cottage', 'import_cottage'),           # Imported goods from cottage industry
    ('distribution_cottage', 'distribution_cottage'), # Distribution from cottage source
    ('purchase', 'purchase'),                        # Regular purchase from supplier
]
```

**Fields:**

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | AutoField | PK | Auto-generated primary key |
| `receipt_id` | CharField(50) | NULLABLE, UNIQUE | Receipt document number |
| `receipt_type` | CharField(20) | NOT NULL, choices=RECEIPT_TYPES | Type of receipt |
| `date` | DateTimeField | NOT NULL | Receipt date/time |
| `warehouse` | ForeignKey | → Warehouse, SET_NULL | Target warehouse |
| `cottage_serial_number` | CharField(100) | NULLABLE, UNIQUE | Cottage document serial (for cottage types) |
| `proforma` | ForeignKey | → PurchaseProforma, SET_NULL | Associated purchase proforma |
| `total_weight` | DecimalField(20,0) | DEFAULT 0 | Total weight of all items (kg) |
| `description` | TextField | NULLABLE | Additional notes |
| `created_at` | DateTimeField | AUTO | Creation timestamp |
| `updated_at` | DateTimeField | AUTO | Last update timestamp |

**Relationships:**
- **One-to-Many:** One receipt has many `WarehouseReceiptItem` entries (via `items` related name)
- **Many-to-One:** Many receipts belong to one `Warehouse`
- **Many-to-One:** Many receipts can reference one `PurchaseProforma`
- **One-to-Many:** One cottage receipt can have many `B2BOffer` entries

**String Representation:** `"{receipt_id or 'Receipt'} - {warehouse.name} - {cottage_serial_number}"`

**Business Rules:**
- For cottage-type receipts, `cottage_serial_number` is typically required
- For purchase-type receipts, `proforma` should be linked
- `total_weight` should match sum of all related `WarehouseReceiptItem` weights

---

### 2.4 WarehouseReceiptItem

**File:** `back/warehouse/models/inventory.py`

Line items for warehouse receipts. Each item represents a product and quantity received.

**Fields:**

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | AutoField | PK | Auto-generated primary key |
| `receipt` | ForeignKey | → WarehouseReceipt, CASCADE, related_name='items' | Parent receipt |
| `product` | ForeignKey | → Product, CASCADE | Product received |
| `weight` | DecimalField(20,0) | DEFAULT 0 | Weight/quantity received (kg) |

**Relationships:**
- **Many-to-One:** Many items belong to one `WarehouseReceipt` (CASCADE delete)
- **Many-to-One:** Many items reference one `Product`

**Business Rules:**
- Automatically deleted when parent receipt is deleted (CASCADE)
- Sum of all item weights should equal parent receipt's `total_weight`

---

### 2.5 DispatchIssue

**File:** `back/warehouse/models/inventory.py`

Represents dispatch orders (goods leaving the warehouse). This is the authorization to ship products.

**Fields:**

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | AutoField | PK | Auto-generated primary key |
| `dispatch_id` | CharField(50) | NOT NULL, UNIQUE | Dispatch document number |
| `warehouse` | ForeignKey | → Warehouse, SET_NULL | Source warehouse |
| `sales_proforma` | ForeignKey | → SalesProforma, SET_NULL | Associated sales proforma |
| `issue_date` | DateTimeField | NOT NULL | Date dispatch was issued |
| `validity_date` | DateTimeField | NOT NULL | Date until dispatch is valid |
| `shipping_company` | ForeignKey | → ShippingCompany, SET_NULL | Assigned shipping company |
| `total_weight` | DecimalField(20,0) | DEFAULT 0 | Total weight dispatched (kg) |
| `description` | TextField | NULLABLE | Additional notes |
| `created_at` | DateTimeField | AUTO | Creation timestamp |
| `updated_at` | DateTimeField | AUTO | Last update timestamp |

**Relationships:**
- **One-to-Many:** One dispatch has many `DispatchIssueItem` entries (via `items` related name)
- **Many-to-One:** Many dispatches from one `Warehouse`
- **Many-to-One:** Many dispatches can reference one `SalesProforma`
- **Many-to-One:** Many dispatches can use one `ShippingCompany`

**String Representation:** `"{dispatch_id} - {customer} - {warehouse.name} ({total_weight} kg)"`

**Business Rules:**
- `validity_date` should be after `issue_date`
- Dispatch must be fulfilled (converted to DeliveryFulfillment) before validity expires
- `total_weight` should match sum of all related `DispatchIssueItem` weights

---

### 2.6 DispatchIssueItem

**File:** `back/warehouse/models/inventory.py`

Line items for dispatch orders. Each item represents a product being dispatched to a receiver.

**Fields:**

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | AutoField | PK | Auto-generated primary key |
| `dispatch` | ForeignKey | → DispatchIssue, SET_NULL, related_name='items' | Parent dispatch |
| `product` | ForeignKey | → Product, SET_NULL | Product being dispatched |
| `weight` | DecimalField(20,0) | DEFAULT 0 | Weight/quantity (kg) |
| `vehicle_type` | CharField(20) | NOT NULL, choices=VEICHLE_TYPES | Vehicle type for delivery |
| `receiver` | ForeignKey | → Receiver, SET_NULL | Delivery recipient |

**Relationships:**
- **Many-to-One:** Many items belong to one `DispatchIssue`
- **Many-to-One:** Many items reference one `Product`
- **Many-to-One:** Many items delivered to one `Receiver`

**Business Rules:**
- Each item specifies its own receiver (allows split deliveries)
- Each item specifies vehicle type needed for transport

---

### 2.7 DeliveryFulfillment

**File:** `back/warehouse/models/inventory.py`

Represents actual deliveries completed (final stage of order fulfillment). Confirms goods were delivered.

**Fields:**

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | AutoField | PK | Auto-generated primary key |
| `delivery_id` | CharField(50) | NOT NULL, UNIQUE | Delivery document number |
| `issue_date` | DateTimeField | NOT NULL | Date delivery was issued |
| `validity_date` | DateTimeField | NOT NULL | Date until delivery is valid |
| `warehouse` | ForeignKey | → Warehouse, SET_NULL | Source warehouse |
| `sales_proforma` | ForeignKey | → SalesProforma, SET_NULL | Associated sales proforma |
| `shipping_company` | ForeignKey | → ShippingCompany, SET_NULL | Shipping company used |
| `total_weight` | DecimalField(20,0) | DEFAULT 0 | Total weight delivered (kg) |
| `description` | TextField | NULLABLE | Additional notes |
| `created_at` | DateTimeField | AUTO | Creation timestamp |
| `updated_at` | DateTimeField | AUTO | Last update timestamp |

**Relationships:**
- **One-to-Many:** One delivery has many `DeliveryFulfillmentItem` entries (via `items` related name)
- **Many-to-One:** Many deliveries from one `Warehouse`
- **Many-to-One:** Many deliveries reference one `SalesProforma`
- **Many-to-One:** Many deliveries use one `ShippingCompany`

**String Representation:** `"{delivery_id} - {customer} - {warehouse.name} ({total_weight} kg)"`

**Business Rules:**
- Typically created after a DispatchIssue
- Records actual shipment details including costs
- `total_weight` should match sum of all related `DeliveryFulfillmentItem` weights

---

### 2.8 DeliveryFulfillmentItem

**File:** `back/warehouse/models/inventory.py`

Line items for delivery fulfillments. Each item represents actual shipped product with tracking information.

**Fields:**

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | AutoField | PK | Auto-generated primary key |
| `delivery` | ForeignKey | → DeliveryFulfillment, SET_NULL, related_name='items' | Parent delivery |
| `shipment_id` | CharField(50) | NOT NULL, UNIQUE | Tracking/waybill number |
| `shipment_price` | DecimalField(20,0) | DEFAULT 0 | Shipping cost for this item |
| `product` | ForeignKey | → Product, SET_NULL | Product delivered |
| `weight` | DecimalField(20,0) | DEFAULT 0 | Weight/quantity delivered (kg) |
| `vehicle_type` | CharField(20) | NOT NULL, choices=VEICHLE_TYPES | Vehicle type used |
| `receiver` | ForeignKey | → Receiver, SET_NULL | Actual recipient |

**Relationships:**
- **Many-to-One:** Many items belong to one `DeliveryFulfillment`
- **Many-to-One:** Many items reference one `Product`
- **Many-to-One:** Many items delivered to one `Receiver`

**Business Rules:**
- Each item has unique `shipment_id` (tracking number)
- Records actual shipping cost per item
- Provides proof of delivery with receiver information

---

## 3. Finance App Models

The `finance` app manages financial documents (proformas and invoices).

**Location:** `back/finance/models/`

### 3.1 Proforma (Abstract Base)

**File:** `back/finance/models/proforma.py`

Abstract base model for all proforma invoices. Not instantiated directly.

**Fields:**

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | AutoField | PK | Auto-generated primary key |
| `serial_number` | CharField(20) | NOT NULL, UNIQUE | Proforma document number |
| `date` | DateTimeField | NOT NULL | Proforma date |
| `subtotal` | DecimalField(20,0) | DEFAULT 0 | Sum of line items before tax/discount |
| `tax` | DecimalField(20,0) | DEFAULT 0 | Tax amount |
| `discount` | DecimalField(20,0) | DEFAULT 0 | Discount amount |
| `final_price` | DecimalField(20,0) | DEFAULT 0 | Final price (subtotal + tax - discount) |
| `created_at` | DateTimeField | AUTO | Creation timestamp |
| `updated_at` | DateTimeField | AUTO | Last update timestamp |

**Relationships:**
- **One-to-Many:** One proforma has many `ProformaLine` entries (via `lines` related name)

**String Representation:** `"{serial_number}"`

**Business Rules:**
- This is an abstract model - only child models (PurchaseProforma, SalesProforma) are used
- Financial calculations should be performed at application level before saving
- `final_price` = `subtotal` + `tax` - `discount`

---

### 3.2 PurchaseProforma

**File:** `back/finance/models/proforma.py`

Purchase order/proforma sent to suppliers. Extends Proforma.

**Fields:**

Inherits all fields from `Proforma`, plus:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `supplier` | ForeignKey | → Supplier, PROTECT | Supplier for this purchase |

**Relationships:**
- **Many-to-One:** Many purchase proformas from one `Supplier` (PROTECT - cannot delete supplier with proformas)
- **One-to-Many:** One purchase proforma can have many `WarehouseReceipt` entries
- **One-to-Many:** One proforma has many `ProformaLine` entries (inherited)

**String Representation:** `"Purchase {serial_number} - {supplier_name} (${final_price})"`

**Business Rules:**
- Cannot delete supplier if they have associated purchase proformas (PROTECT)
- Typically linked to subsequent WarehouseReceipt when goods arrive

---

### 3.3 SalesProforma

**File:** `back/finance/models/proforma.py`

Sales quote/order to customers. Extends Proforma.

**Payment Types:**

```python
PAYMENT_TYPES = [
    ('cash', 'cash'),     # Cash payment
    ('credit', 'credit'), # Credit payment
    ('other', 'other'),   # Other payment method
]
```

**Fields:**

Inherits all fields from `Proforma`, plus:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `customer` | ForeignKey | → Customer, PROTECT | Customer for this sale |
| `payment_type` | CharField(6) | NOT NULL, choices=PAYMENT_TYPES | Payment method |
| `payment_description` | CharField(200) | NULLABLE | Payment details/notes |

**Relationships:**
- **Many-to-One:** Many sales proformas to one `Customer` (PROTECT)
- **One-to-Many:** One sales proforma can have many `DispatchIssue` entries
- **One-to-Many:** One sales proforma can have many `DeliveryFulfillment` entries
- **One-to-Many:** One sales proforma can have many `B2BDistribution` entries
- **One-to-Many:** One sales proforma can have many `B2BSale` entries
- **One-to-Many:** One proforma has many `ProformaLine` entries (inherited)

**String Representation:** `"Sales {serial_number} - {customer_name} (${final_price})"`

**Business Rules:**
- Cannot delete customer if they have associated sales proformas (PROTECT)
- Payment type and description track how customer will pay
- Linked to warehouse operations (dispatch/delivery) for fulfillment

---

### 3.4 ProformaLine

**File:** `back/finance/models/proforma.py`

Line items for proformas. Each line represents a product with quantity and price.

**Fields:**

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | AutoField | PK | Auto-generated primary key |
| `proforma` | ForeignKey | → Proforma, CASCADE, related_name='lines' | Parent proforma |
| `product` | ForeignKey | → Product, PROTECT | Product on this line |
| `weight` | DecimalField(20,0) | DEFAULT 0 | Weight/quantity (kg) |
| `unit_price` | DecimalField(20,0) | DEFAULT 0 | Price per kg |
| `total_price` | Property | COMPUTED | Line total (weight × unit_price) |
| `created_at` | DateTimeField | AUTO | Creation timestamp |
| `updated_at` | DateTimeField | AUTO | Last update timestamp |

**Relationships:**
- **Many-to-One:** Many lines belong to one `Proforma` (CASCADE delete)
- **Many-to-One:** Many lines reference one `Product` (PROTECT)

**Computed Property:**
```python
@property
def total_price(self):
    return self.weight * self.unit_price
```

**Business Rules:**
- Automatically deleted when parent proforma is deleted (CASCADE)
- `total_price` is computed dynamically, not stored
- Sum of all line `total_price` values should equal proforma's `subtotal`
- Cannot delete product if it's used in any proforma lines (PROTECT)

---

### 3.5 SalesInvoice & PurchaseInvoice

**File:** `back/finance/models/invoice.py`

**Status:** Placeholder models - not yet implemented.

```python
class SalesInvoice(models.Model):
    pass

class PurchaseInvoice(models.Model):
    pass
```

**Future Use:**
- Will represent actual invoices (vs. proformas which are quotes/orders)
- Likely to have similar structure to proformas but with additional fields for invoicing
- May link to payment records and accounting entries

---

## 4. B2B App Models

The `b2b` app manages B2B sales operations, particularly cottage industry imports and distributions.

**Location:** `back/b2b/models/`

### 4.1 B2BOffer

**File:** `back/b2b/models/base.py`

Represents offers created from cottage industry imports for sale on B2B platforms.

**Fields:**

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | AutoField | PK | Auto-generated primary key |
| `offer_id` | CharField(100) | NOT NULL, UNIQUE | Offer identifier |
| `warehouse_receipt` | ForeignKey | → WarehouseReceipt, SET_NULL | Source cottage receipt (limited to cottage types) |
| `offer_date` | DateTimeField | NOT NULL | Date offer was created |
| `offer_exp_date` | DateTimeField | NOT NULL | Offer expiration date |
| `offer_weight` | DecimalField(20,0) | NOT NULL | Total weight offered (kg) |
| `unit_price` | DecimalField(20,0) | NOT NULL | Price per kg |
| `total_price` | DecimalField(20,0) | NOT NULL | Total offer price (auto-calculated) |
| `offer_type` | CharField(10) | NOT NULL, choices=TRANSACTION_TYPES, DEFAULT 'cash' | Transaction type |
| `status` | CharField(10) | NOT NULL, choices=STATUS_TYPES, DEFAULT 'pending' | Offer status |
| `description` | TextField | NULLABLE | Additional notes |
| `created_at` | DateTimeField | AUTO | Creation timestamp |
| `updated_at` | DateTimeField | AUTO | Last update timestamp |

**Relationships:**
- **Many-to-One:** Many offers from one `WarehouseReceipt` (limited to receipt_type 'import_cottage' or 'distribution_cottage')
- **One-to-Many:** One offer can have many `B2BAddress` entries (via `sales` related name)
- **One-to-Many:** One offer can have many `B2BSale` entries (via `b2b_sales` related name)

**String Representation:** `"{offer_id} - {cottage_serial_number} - {product_name} ({offer_weight} kg) - {status}"`

**Save Method:**
```python
def save(self, *args, **kwargs):
    if self.unit_price and self.offer_weight:
        self.total_price = self.unit_price * self.offer_weight
    super().save(*args, **kwargs)
```

**Business Rules:**
- Automatically calculates `total_price` from `unit_price` × `offer_weight`
- Only links to cottage-type warehouse receipts
- Status lifecycle: pending → active → sold/expired
- Cannot create offer without a cottage warehouse receipt

---

### 4.2 B2BAddress

**File:** `back/b2b/models/base.py`

Detailed B2B sales records with address and delivery tracking. This is the most complex model, storing comprehensive information about each sale.

**Fields:**

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| **Identification** |
| `id` | AutoField | PK | Auto-generated primary key |
| `purchase_id` | CharField(100) | NOT NULL, UNIQUE, DEFAULT '' | Sale/purchase identifier |
| `allocation_id` | CharField(100) | NULLABLE, DEFAULT '' | Allocation reference |
| `cottage_code` | CharField(50) | NOT NULL | Cottage source code |
| **Relationships** |
| `product_offer` | ForeignKey | → B2BOffer, SET_NULL, related_name='sales' | Source offer |
| `product` | ForeignKey | → Product, CASCADE | Product sold |
| `customer` | ForeignKey | → Customer, CASCADE | Buyer |
| `receiver` | ForeignKey | → Receiver, SET_NULL | Delivery recipient |
| **Financial** |
| `total_weight_purchased` | DecimalField(20,0) | DEFAULT 0 | Total weight purchased (kg) |
| `purchase_date` | DateField | NULLABLE | Date of purchase |
| `unit_price` | DecimalField(20,0) | DEFAULT 0 | Price per kg (auto-calculated if 0) |
| `payment_amount` | DecimalField(20,0) | DEFAULT 0 | Total payment amount |
| `payment_method` | CharField(50) | NULLABLE | Payment method description |
| `customer_account_number` | CharField(50) | NULLABLE, DEFAULT '' | Customer account reference |
| `deposit_id` | CharField(50) | NULLABLE, DEFAULT '' | Deposit reference |
| **Location** |
| `province` | CharField(100) | NULLABLE | Delivery province |
| `city` | CharField(100) | NULLABLE | Delivery city |
| `tracking_number` | CharField(100) | NULLABLE | Shipment tracking number |
| **Vehicle Information** |
| `single` | CharField(10) | NULLABLE, DEFAULT '' | Single-axle vehicle count/ID |
| `double` | CharField(10) | NULLABLE, DEFAULT '' | Double-axle vehicle count/ID |
| `trailer` | CharField(10) | NULLABLE, DEFAULT '' | Trailer vehicle count/ID |
| **Weight Breakdown** |
| `purchase_weight` | DecimalField(20,0) | DEFAULT 0 | Total purchase weight |
| `waybilled_weight` | DecimalField(20,0) | DEFAULT 0 | Weight with waybill |
| `non_waybilled_weight` | DecimalField(20,0) | DEFAULT 0 | Weight without waybill |
| **Agreement Terms** (up to 3 installments) |
| `agreement_period_1` | CharField(100) | NULLABLE, DEFAULT '' | First payment period |
| `agreement_amount_1` | CharField(100) | NULLABLE, DEFAULT '' | First payment amount |
| `agreement_period_2` | CharField(100) | NULLABLE, DEFAULT '' | Second payment period |
| `agreement_amount_2` | CharField(100) | NULLABLE, DEFAULT '' | Second payment amount |
| `agreement_period_3` | CharField(100) | NULLABLE, DEFAULT '' | Third payment period |
| `agreement_amount_3` | CharField(100) | NULLABLE, DEFAULT '' | Third payment amount |
| **Other** |
| `address_register_date` | DateField | NULLABLE | Registration date |
| `credit_description` | TextField | NULLABLE | Credit terms description |
| `description` | TextField | NULLABLE | Additional notes |
| `created_at` | DateTimeField | AUTO | Creation timestamp |
| `updated_at` | DateTimeField | AUTO | Last update timestamp |

**Relationships:**
- **Many-to-One:** Many addresses from one `B2BOffer`
- **Many-to-One:** Many addresses for one `Product` (CASCADE)
- **Many-to-One:** Many addresses for one `Customer` (CASCADE)
- **Many-to-One:** Many addresses to one `Receiver`

**String Representation:** `"Sale {purchase_id} - {customer_name} ({total_weight_purchased} kg)"`

**Save Method:**
```python
def save(self, *args, **kwargs):
    # Calculate unit_price if it's 0 and we have payment_amount and weight
    if (not self.unit_price or self.unit_price == 0) and self.payment_amount and self.total_weight_purchased:
        self.unit_price = self.payment_amount / self.total_weight_purchased
    super().save(*args, **kwargs)
```

**Business Rules:**
- Automatically calculates `unit_price` from `payment_amount` ÷ `total_weight_purchased` if unit_price is 0
- Supports installment/agreement-based payments (up to 3 periods)
- Tracks detailed vehicle usage for logistics
- Weight breakdown tracks waybilled vs. non-waybilled shipments
- Used for Excel export/import in B2B operations

---

### 4.3 B2BDistribution

**File:** `back/b2b/models/base.py`

Represents distribution/agency arrangements where cottage imports are transferred to customers for resale.

**Fields:**

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | AutoField | PK | Auto-generated primary key |
| `transfer_id` | CharField(100) | NOT NULL, UNIQUE | Distribution transfer identifier |
| `warehouse_receipt` | ForeignKey | → WarehouseReceipt, PROTECT | Source cottage receipt (limited to 'import_cottage') |
| `sales_proforma` | ForeignKey | → SalesProforma, PROTECT | Associated sales proforma |
| `customer` | ForeignKey | → Customer, PROTECT | Distributor/agent customer |
| `agency_date` | DateTimeField | NOT NULL | Date of distribution |
| `agency_weight` | DecimalField(20,0) | DEFAULT 0 | Weight distributed (kg) |
| `unit_price` | DecimalField(20,0) | DEFAULT 0 | Distribution price per kg |
| `description` | TextField | NULLABLE | Additional notes |
| `created_at` | DateTimeField | AUTO | Creation timestamp |
| `updated_at` | DateTimeField | AUTO | Last update timestamp |

**Relationships:**
- **Many-to-One:** Many distributions from one `WarehouseReceipt` (PROTECT, limited to 'import_cottage')
- **Many-to-One:** Many distributions reference one `SalesProforma` (PROTECT)
- **Many-to-One:** Many distributions to one `Customer` (PROTECT)
- **One-to-Many:** One distribution can have many `B2BSale` entries (via `b2b_sales` related name)

**String Representation:** `"Distribution {receipt_id} - {customer_name} - {product_name} ({agency_weight} kg)"`

**Business Rules:**
- Only links to 'import_cottage' type warehouse receipts
- PROTECT on all foreign keys prevents deletion of referenced records
- Represents transfer of goods to distributor/agent for resale
- Customer here is the distributor, not end consumer
- Subsequent B2BSale records track individual sales from this distribution

---

### 4.4 B2BSale

**File:** `back/b2b/models/base.py`

Individual B2B sales records. Can be either direct sales from offers or distributor sales.

**Fields:**

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | AutoField | PK | Auto-generated primary key |
| `purchase_id` | CharField(100) | NOT NULL, UNIQUE | Sale identifier |
| `is_distributor` | BooleanField | DEFAULT False | True if sale is from distributor |
| `b2b_distribution` | ForeignKey | → B2BDistribution, CASCADE, related_name='b2b_sales' | Parent distribution (for distributor sales) |
| `offer` | ForeignKey | → B2BOffer, CASCADE, related_name='b2b_sales' | Source offer (for direct sales) |
| `sales_proforma` | ForeignKey | → SalesProforma, SET_NULL, related_name='b2b_sales' | Associated sales proforma |
| `product` | ForeignKey | → Product, CASCADE | Product sold |
| `weight` | DecimalField(20,0) | DEFAULT 0 | Weight sold (kg) |
| `unit_price` | DecimalField(20,0) | DEFAULT 0 | Price per kg |
| `total_price` | DecimalField(20,0) | DEFAULT 0 | Total sale price (auto-calculated) |
| `sale_date` | DateField | NULLABLE | Date of sale |
| `customer` | ForeignKey | → Customer, CASCADE | Buyer customer |
| `purchase_type` | CharField(10) | NOT NULL, choices=TRANSACTION_TYPES, DEFAULT 'cash' | Payment type |
| `description` | TextField | NULLABLE | Additional notes |

**Relationships:**
- **Many-to-One:** Many sales from one `B2BDistribution` (CASCADE, for distributor sales)
- **Many-to-One:** Many sales from one `B2BOffer` (CASCADE, for direct sales)
- **Many-to-One:** Many sales reference one `SalesProforma`
- **Many-to-One:** Many sales for one `Product` (CASCADE)
- **Many-to-One:** Many sales to one `Customer` (CASCADE)

**String Representation:** `"Sale {purchase_id} - {customer_name} - {product_name} ({weight} kg)"`

**Save Method:**
```python
def save(self, *args, **kwargs):
    if self.unit_price and self.weight:
        self.total_price = self.unit_price * self.weight
    super().save(*args, **kwargs)
```

**Business Rules:**
- Automatically calculates `total_price` from `unit_price` × `weight`
- **Two sale types:**
  - **Distributor Sale:** `is_distributor=True`, links to `b2b_distribution`, customer is end consumer
  - **Direct Sale:** `is_distributor=False`, links to `offer`, customer buys directly
- Only one of `b2b_distribution` or `offer` should be set, not both
- Used for Excel export/import in B2B operations

---

## Business Flow Diagrams

### Purchase to Inventory Flow

```
1. PurchaseProforma → created with Supplier
   └─ ProformaLine(s) → specify products and quantities

2. WarehouseReceipt → goods arrive, linked to proforma
   └─ WarehouseReceiptItem(s) → actual products and weights received
```

### Sales to Delivery Flow

```
1. SalesProforma → created with Customer
   └─ ProformaLine(s) → specify products and quantities

2. DispatchIssue → authorize shipment, linked to proforma
   └─ DispatchIssueItem(s) → products, weights, receivers, vehicle types

3. DeliveryFulfillment → confirm delivery
   └─ DeliveryFulfillmentItem(s) → tracking numbers, costs, actual weights
```

### B2B Cottage Import Flow (Direct Sale)

```
1. WarehouseReceipt (type: import_cottage) → cottage goods arrive
   └─ WarehouseReceiptItem(s)

2. B2BOffer → create offer from cottage receipt

3. B2BSale (is_distributor=False) → direct sale to customer
   └─ Links to: offer, customer, product

4. B2BAddress → detailed sale/delivery tracking (optional)
```

### B2B Cottage Import Flow (Distribution)

```
1. WarehouseReceipt (type: import_cottage) → cottage goods arrive
   └─ WarehouseReceiptItem(s)

2. SalesProforma → create proforma for distributor

3. B2BDistribution → transfer to distributor/agent
   └─ Links to: warehouse_receipt, sales_proforma, customer (distributor)

4. B2BSale (is_distributor=True) → individual sales from distributor
   └─ Links to: b2b_distribution, customer (end consumer), product
```

---

## Foreign Key Cascade Behavior

Understanding the cascade behavior is crucial for data integrity:

### CASCADE (Delete children when parent is deleted)
- ProformaLine → Proforma
- WarehouseReceiptItem → WarehouseReceipt
- B2BSale → B2BDistribution
- B2BSale → B2BOffer
- B2BSale → Product
- B2BSale → Customer
- B2BAddress → Product
- B2BAddress → Customer

### PROTECT (Prevent deletion of parent if children exist)
- ProformaLine → Product
- PurchaseProforma → Supplier
- SalesProforma → Customer
- B2BDistribution → WarehouseReceipt
- B2BDistribution → SalesProforma
- B2BDistribution → Customer

### SET_NULL (Set reference to NULL when parent is deleted)
- WarehouseReceipt → Warehouse
- WarehouseReceipt → PurchaseProforma
- DispatchIssue → Warehouse
- DispatchIssue → SalesProforma
- DispatchIssue → ShippingCompany
- DispatchIssueItem → DispatchIssue
- DispatchIssueItem → Product
- DispatchIssueItem → Receiver
- DeliveryFulfillment → Warehouse
- DeliveryFulfillment → SalesProforma
- DeliveryFulfillment → ShippingCompany
- DeliveryFulfillmentItem → DeliveryFulfillment
- DeliveryFulfillmentItem → Product
- DeliveryFulfillmentItem → Receiver
- B2BOffer → WarehouseReceipt
- B2BAddress → B2BOffer
- B2BAddress → Receiver
- B2BSale → SalesProforma

**Philosophy:**
- **CASCADE:** Used for line items that have no meaning without their parent document
- **PROTECT:** Used for master data (parties, products) and critical financial documents
- **SET_NULL:** Used for operational data to preserve historical records while allowing cleanup

---

## Decimal Field Precision

All monetary and weight fields use:
```python
DecimalField(max_digits=20, decimal_places=0)
```

**Implications:**
- **No decimal places:** All amounts are whole numbers (integers)
- **Large numbers:** Supports up to 20 digits (very large values)
- **Weight:** Measured in kilograms (no fractional kilograms)
- **Currency:** Likely Iranian Rial (no fractional currency needed)

---

## Unique Constraints Summary

Fields that must be unique across all records:

| Model | Field(s) | Scope |
|-------|----------|-------|
| Product | `code` | System-wide |
| Supplier | `economic_code` | System-wide |
| Supplier | `national_id` | System-wide (if set) |
| Supplier | `personal_code` | System-wide (if set) |
| Customer | `economic_code` | System-wide |
| Customer | `national_id` | System-wide (if set) |
| Customer | `personal_code` | System-wide (if set) |
| Receiver | `economic_code` | System-wide |
| Receiver | `national_id` | System-wide (if set) |
| Receiver | `personal_code` | System-wide (if set) |
| WarehouseReceipt | `receipt_id` | System-wide (if set) |
| WarehouseReceipt | `cottage_serial_number` | System-wide (if set) |
| DispatchIssue | `dispatch_id` | System-wide |
| DeliveryFulfillment | `delivery_id` | System-wide |
| DeliveryFulfillmentItem | `shipment_id` | System-wide |
| Proforma | `serial_number` | System-wide |
| B2BOffer | `offer_id` | System-wide |
| B2BAddress | `purchase_id` | System-wide |
| B2BDistribution | `transfer_id` | System-wide |
| B2BSale | `purchase_id` | System-wide |

---

## Index Recommendations

While not explicitly defined in the models, these fields should be indexed for performance:

**Foreign Keys** (Django automatically indexes these):
- All ForeignKey fields

**Frequently Queried Fields:**
- Product: `code`, `b2bcode`
- Customer: `economic_code`
- Supplier: `economic_code`
- WarehouseReceipt: `date`, `receipt_type`
- DispatchIssue: `issue_date`, `validity_date`
- DeliveryFulfillment: `issue_date`
- Proforma: `date`
- B2BOffer: `offer_date`, `status`
- B2BSale: `sale_date`

**Add indexes with:**
```python
class Meta:
    indexes = [
        models.Index(fields=['date']),
        models.Index(fields=['status']),
    ]
```

---

## Data Integrity Considerations

### Weight Validation
Application logic should ensure:
- `WarehouseReceipt.total_weight` = sum of `WarehouseReceiptItem.weight`
- `DispatchIssue.total_weight` = sum of `DispatchIssueItem.weight`
- `DeliveryFulfillment.total_weight` = sum of `DeliveryFulfillmentItem.weight`

### Financial Validation
Application logic should ensure:
- `Proforma.subtotal` = sum of `ProformaLine.total_price`
- `Proforma.final_price` = `subtotal` + `tax` - `discount`
- `B2BOffer.total_price` = `unit_price` × `offer_weight` (auto-calculated)
- `B2BSale.total_price` = `unit_price` × `weight` (auto-calculated)

### Date Validation
Application logic should ensure:
- `DispatchIssue.validity_date` > `issue_date`
- `DeliveryFulfillment.validity_date` > `issue_date`
- `B2BOffer.offer_exp_date` > `offer_date`

### Party Type Validation
Application logic should ensure:
- If `party_type` = 'corporate': `company_name` and `national_id` are set
- If `party_type` = 'individual': `full_name` and `personal_code` are set

---

## Excel Export/Import

The B2B app has specialized Excel export/import functionality:

**Configuration:** `back/b2b/excel_config.py`
**Views:** `back/b2b/excel_views.py`

**Three Export Formats:**

1. **Sale (Distributor)** - B2BSale records where `is_distributor=True`
2. **Sale (Your)** - B2BSale records where `is_distributor=False`
3. **Address** - B2BAddress records with comprehensive tracking

**Persian Field Mappings:**
- Excel headers are in Persian (Farsi)
- Backend handles Jalaali (Persian calendar) date conversions
- Uses `pandas` + `openpyxl` + `jdatetime` libraries

---

## Migration Notes

To apply this schema to your database:

```bash
cd back
python manage.py makemigrations
python manage.py migrate
```

To inspect the current database schema:

```bash
# View all tables
python manage.py dbshell
\dt

# View specific model
python manage.py inspectdb warehouse_warehousereceipt
```

---

## Future Enhancements

Based on placeholder models and business logic:

1. **Invoices:** Implement SalesInvoice and PurchaseInvoice models
2. **Payments:** Add payment tracking linked to invoices
3. **Inventory Tracking:** Add current stock levels per warehouse/product
4. **Serial Numbers:** Add support for serialized inventory items
5. **Multi-currency:** Add currency field and exchange rates
6. **Audit Trail:** Add change history for critical documents
7. **Document Attachments:** Link PDFs/images to financial documents
8. **Approval Workflows:** Add approval status and workflow tracking

---

## Summary Statistics

**Total Models:** 25
- Core App: 4 models (Product, Supplier, Customer, Receiver)
- Warehouse App: 8 models (Warehouse, ShippingCompany, WarehouseReceipt, WarehouseReceiptItem, DispatchIssue, DispatchIssueItem, DeliveryFulfillment, DeliveryFulfillmentItem)
- Finance App: 5 models (Proforma, PurchaseProforma, SalesProforma, ProformaLine, SalesInvoice, PurchaseInvoice)
- B2B App: 4 models (B2BOffer, B2BAddress, B2BDistribution, B2BSale)

**Total Tables:** 23 (excluding abstract Proforma, excluding unimplemented Invoice models)

**Foreign Key Relationships:** 40+

**Unique Constraints:** 20+

**Auto-calculated Fields:** 4 (in save methods)
- B2BOffer.total_price
- B2BAddress.unit_price
- B2BSale.total_price
- ProformaLine.total_price (property)

---

*Last Updated: 2025-10-20*
*Django Version: 3.x+*
*Database: PostgreSQL*
