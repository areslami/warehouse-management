import type { Product, Reciever } from "./core";
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
  warehouse: Warehouse;
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
  product: Product;
  weight: number;
}

export interface DispatchIssue {
  id: number;
  dispatch_id: string;
  warehouse: Warehouse;
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
  product: Product;
  weight: number;
  vehicle_type: "truck" | "pickup" | "van" | "container" | "other";
  receiver: Reciever;
}

export interface DeliveryFulfillment {
  id: number;
  delivery_id: string;
  issue_date: string;
  validity_date: string;
  warehouse: Warehouse;
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
  shippment_price: number;
  product: Product;
  weight: number;
  vehicle_type: "truck" | "pickup" | "van" | "container" | "other";
  receiver: Reciever;
}
