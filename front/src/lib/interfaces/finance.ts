export interface Proforma {
  id: number;
  serial_number: string;
  date: string;
  status: "Active" | "Pending" | "Sold" | "Expired";
  subtotal: number;
  tax: number;
  discount: number;
  final_price: number;
  created_at: string;
  updated_at: string;
}

export interface PurchaseProforma extends Proforma {
  supplier: number;
  supplier_name?: string;
  lines?: ProformaLine[];
}

export interface SalesProforma extends Proforma {
  payment_type: "cash" | "credit" | "other";
  payment_description?: string;
  customer: number;
  customer_name?: string;
  lines?: ProformaLine[];
}

export interface ProformaLine {
  id: number;
  proforma?: number;
  product: number;
  product_name?: string;
  product_code?: string;
  weight: number;
  unit_price: number;
  total_price: number;
}

export interface ProformaLineCreate {
  product: number;
  weight: number;
  unit_price: number;
}

export interface SalesProformaCreate {
  serial_number: string;
  date: string;
  subtotal?: number;
  tax?: number;
  discount?: number;
  customer: number;
  payment_type: "cash" | "credit" | "other";
  payment_description?: string;
  lines: ProformaLineCreate[];
}

export interface PurchaseProformaCreate {
  serial_number: string;
  date: string;
  subtotal?: number;
  tax?: number;
  discount?: number;
  supplier: number;
  lines: ProformaLineCreate[];
}
