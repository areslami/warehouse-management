import type { Customer, Supplier, Product } from "./core";

interface Proforma {
  id: number;
  serial_number: string;
  date: string;
  subtotal: number;
  tax: number;
  discount: number;
  final_price: number;
}

export interface PurchaseProforma extends Proforma {
  supplier: Supplier;
}

export interface SalesProforma extends Proforma {
  payment_type: "cash" | "credit" | "other";
  payment_description: string | null;
  customer: Customer;
}

export interface ProformaLine {
  id: number;

  proforma: SalesProforma | PurchaseProforma;
  product: Product;
  weight: number;
  unit_price: number;

  total_price: number;

  created_at: string;
  updated_at: string;
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
  payment_description: string | null;
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
