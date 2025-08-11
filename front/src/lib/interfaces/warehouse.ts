import type { Product, Receiver } from "./core";
import type { SalesProforma, PurchaseProforma } from "./finance";

export interface Warehouse {
  id: number;
  name: string;
  address: string;
  manager: string;
  phone: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface WarehouseReceipt {
  id: number;
  receipt_id: string | null;
  receipt_type: "import_cottage" | "distribution_cottage" | "purchase";
  date: string;
  warehouse: number; // warehouse ID
  warehouse_name?: string; // Only in list view
  description: string;
  total_weight: number;
  cottage_serial_number: string | null;
  proforma: PurchaseProforma | null;
  created_at: string;
  updated_at: string;
  items: WarehouseReceiptItem[];
}

export interface WarehouseReceiptItem {
  id: number;
  receipt: number;
  product: number; // product ID
  product_name?: string;
  product_code?: string;
  weight: number;
}

export interface DispatchIssue {
  id: number;
  dispatch_id: string;
  warehouse: number; // warehouse ID
  warehouse_name: string;
  sales_proforma: SalesProforma;
  issue_date: string;
  validity_date: string;
  description: string;
  shipping_company: number;
  total_weight: number;
  created_at: string;
  updated_at: string;
  items: DispatchIssueItem[];
}

export interface DispatchIssueItem {
  id: number;
  dispatch: number;
  product?: Product; // Can be object or ID
  weight: number;
  vehicle_type: "truck" | "pickup" | "van" | "container" | "other";
  receiver?: Receiver; // Can be object or ID
}

export interface DeliveryFulfillment {
  id: number;
  delivery_id: string;
  issue_date: string;
  validity_date: string;
  warehouse: number; // warehouse ID
  warehouse_name: string;
  sales_proforma: SalesProforma;
  description: string;
  shipping_company: number;
  total_weight: number;
  created_at: string;
  updated_at: string;
  items: DeliveryFulfillmentItem[];
}

export interface DeliveryFulfillmentItem {
  id: number;
  delivery: number;
  shipment_id: string;
  shipment_price: number;
  product?: Product; // Can be object or ID
  weight: number;
  vehicle_type: "truck" | "pickup" | "van" | "container" | "other";
  receiver?: Receiver; // Can be object or ID
}
