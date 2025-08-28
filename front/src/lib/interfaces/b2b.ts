export interface B2BOffer {
  id: number;
  offer_id: string;
  product: number;
  product_name?: string;
  warehouse_receipt?: number;
  warehouse_receipt_id?: string;
  offer_weight: number;
  unit_price: number;
  total_price?: number;
  offer_type: "cash" | "credit" | "agreement" | "other";
  status: "active" | "pending" | "sold" | "expired";
  offer_date: string;
  offer_exp_date: string;
  cottage_number?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface B2BAddress {
  id: number;
  purchase_id: string;
  allocation_id?: string;
  cottage_code?: string;
  product_offer?: number;
  product: number | null;
  customer: number | null;
  receiver?: number;
  total_weight_purchased: number;
  purchase_date: string | null;
  unit_price: number;
  payment_amount: number;
  payment_method?: string;
  province?: string;
  city?: string;
  tracking_number?: string;
  credit_description?: string;
  product_name?: string;
  customer_name?: string;
  receiver_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface B2BSale {
  id: number;
  purchase_id: string;
  offer: number | null;
  offer_id?: string;
  product: number;
  product_name?: string;
  customer: number;
  customer_id?: string;
  customer_name?: string;
  cottage_code?: string;
  weight: number;
  unit_price: number;
  total_price: number;
  sale_date: string;
  purchase_type: "cash" | "credit" | "agreement" | "other";
  description?: string;
}

export interface B2BDistribution {
  id: number;
  purchase_id?: string;
  b2b_offer: number | null;
  b2b_offer_id?: string;
  warehouse: number;
  warehouse_name?: string;
  warehouse_receipt?: number;
  product: number;
  product_name?: string;
  customer: number;
  customer_name?: string;
  cottage_number?: string;
  agency_weight: number;
  agency_date: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}
