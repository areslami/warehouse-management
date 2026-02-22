export interface Proforma {
  id: number;
  serial_number: string;
  date: string;
  subtotal: number;
  tax?: number;
  discount?: number;
  shipping_cost?: number;
  commission?: number;
  other_cost?: number;
  export_preset?: number | null;
  final_price: number;
  created_at: string;
  updated_at: string;
}

export interface PurchaseProforma extends Proforma {
  supplier: number;
  supplier_name?: string;
  tax?: number;
  discount?: number;
  shipping_cost?: number;
  commission?: number;
  other_cost?: number;
  export_preset?: number | null;
  lines?: ProformaLine[];
}

export interface SalesProforma extends Proforma {
  payment_type: "cash" | "credit" | "other";
  payment_description?: string;
  tax?: number;
  discount?: number;
  shipping_cost?: number;
  commission?: number;
  other_cost?: number;
  export_preset?: number | null;
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
  tax: number;
  discount: number;
  total_price: number;
}

export interface ProformaLineCreate {
  product: number;
  weight: number;
  tax: number;
  discount: number;
  unit_price: number;
}

export interface SalesProformaCreate {
  serial_number: string;
  date: string;
  subtotal?: number;
  tax?: number;
  discount?: number;
  shipping_cost?: number;
  commission?: number;
  other_cost?: number;
  export_preset?: number | null;
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
  shipping_cost?: number;
  commission?: number;
  other_cost?: number;
  export_preset?: number | null;
  supplier: number;
  lines: ProformaLineCreate[];
}

export interface ProformaExportPreset {
  id: number;
  name: string;
  bank_name: string;
  account_number: string;
  sheba_number: string;
  description?: string;
  created_at: string;
  updated_at: string;
}
