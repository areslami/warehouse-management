export interface B2BOffer {
  id: number;
  offer_id: string;
  product: number;
  product_name?: string;
  warehouse_receipt: number;
  warehouse_receipt_id?: string;
  offer_weight: number;
  unit_price: number;
  total_price?: number;
  status: "active" | "pending" | "sold" | "expired";
  offer_date: string;
  offer_exp_date: string;
  cottage_number?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface B2BSale {
  id: number;
  product_offer: number;
  cottage_number?: string;
  product_title?: string;
  offer_unit_price?: number;
  total_offer_weight?: number;
  sold_weight_before_transport?: number;
  remaining_weight_before_transport?: number;
  sold_weight_after_transport?: number;
  remaining_weight_after_transport?: number;
  offer_status?: string;
  entry_customs?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface B2BPurchase {
  id: number;
  sale: number;
  purchase_id: string;
  buyer_name: string;
  purchase_weight: number;
  paid_amount: number;
  purchase_date: string;
  purchase_type: "Cash" | "Credit" | "Installment";
  description?: string;
}

export interface B2BPurchaseDetail {
  id: number;
  purchase: number;
  detail_description?: string;
  purchase_info?: B2BPurchase;
}

export interface B2BDistribution {
  id: number;
  purchase_id?: string;
  b2b_offer?: number;
  b2b_offer_id?: string;
  warehouse: number;
  warehouse_name?: string;
  warehouse_receipt: number;
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
