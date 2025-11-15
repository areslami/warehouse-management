export interface Warehouse {
  id: number;
  name: string;
  address: string;
  manager: string;
  phone: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface WarehouseReceipt {
  id: number;
  receipt_id: string | null;
  receipt_type: "import_cottage" | "distribution_cottage" | "purchase";
  date: string;
  warehouse: number | null;
  warehouse_name?: string;
  description?: string;
  total_weight: number;
  cottage_serial_number: string | null;
  proforma: number | null;
  proforma_serial?: string;
  created_at: string;
  updated_at: string;
  items: WarehouseReceiptItem[];
}

export interface WarehouseReceiptItem {
  id: number;
  receipt: number;
  product: number;
  product_name?: string;
  product_code?: string;
  weight: number;
}

export interface DispatchIssue {
  id: number;
  dispatch_id: string;
  warehouse: number | null;
  warehouse_name?: string;
  sales_proforma: number | null;
  sales_proforma_serial?: string;
  issue_date: string;
  validity_date: string;
  description?: string;
  shipping_company: number | null;
  shipping_company_name?: string;
  total_weight: number;
  created_at: string;
  updated_at: string;
  items: DispatchIssueItem[];
}

export interface DispatchIssueItem {
  id: number;
  dispatch: number | null;
  product: number | null;
  product_name?: string;
  weight: number;
  vehicle_type: "single" | "double" | "trailer";
  receiver: number | null;
  receiver_name?: string;
}

export interface DeliveryFulfillment {
  id: number;
  delivery_id: string;
  waybill_serial?: string;
  issue_date: string;
  b2b_address: number | null;
  b2b_address_purchase_id?: string;
  warehouse_receipt: number | null;
  warehouse_receipt_id?: string;
  warehouse?: number | null;
  offer?: number | null;
  offer_id_display?: string;
  distribution?: number | null;
  distribution_id_display?: string;
  description?: string;
  shipping_company: number | null;
  shipping_company_name?: string;
  total_weight: number;
  driver_name: string;
  driver_phone: string;
  driver_license_plate: string;
  created_at: string;
  updated_at: string;
  items: DeliveryFulfillmentItem[];
}

export interface DeliveryFulfillmentItem {
  id: number;
  delivery: number | null;
  product: number | null;
  product_name?: string;
  weight: number;
  destination?: string;
  receiver: string;
  customer: number | null;
  customer_name?: string;
  fare: number;
}
export interface WarehouseReceiptCreate {
  receipt_id?: string;
  receipt_type: "import_cottage" | "distribution_cottage" | "purchase";
  date: string;
  warehouse: number;
  description?: string;
  cottage_serial_number?: string;
  proforma?: number;
  items: { product: number; weight: number }[];
}

export interface DispatchIssueCreate {
  dispatch_id: string;
  warehouse: number;
  sales_proforma: number;
  issue_date: string;
  validity_date: string;
  description: string;
  shipping_company: number;
  total_weight: number;
  items: {
    product: number;
    weight: number;
    vehicle_type: "single" | "double" | "trailer";
    receiver: number;
  }[];
}

export interface DeliveryFulfillmentCreate {
  delivery_id: string;
  issue_date: string;
  b2b_address: number;
  warehouse_receipt: number;
  description: string;
  shipping_company: number;
  driver_name: string;
  driver_phone: string;
  driver_license_plate: string;
  total_weight: number;
  items: {
    product: number;
    weight: number;
    destination?: string;
    receiver: string;
    customer: number;
    fare: number;
  }[];
}

export interface DeliveryColumnMapping {
  id: number;
  name: string;
  shipping_company: number;
  shipping_company_name?: string;
  column_mappings: Record<string, string>;
  created_at: string;
  updated_at: string;
}
