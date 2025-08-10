export interface ProductCategory {
  id: number;
  name: string;
  description: string;
  created_at: Date;
  updated_at: Date;
}
export interface ProductReigon {
  id: number;
  name: string;
  description: string;
  created_at: Date;
  updated_at: Date;
}
export interface Product {
  name: string;
  code: string;
  b2bcode: string;
  b2breigon: ProductReigon;
  category: ProductCategory;
  description: string;
  created_at: Date;
  updated_at: Date;
}

export interface Supplier {
  supplier_type: "Individual" | "Corporate";

  company_name: string;
  national_id: string;
  full_name: string;
  personal_code: string;

  economic_code: string;
  phone: string;
  address: string;
  description: string;

  created_at: Date;
  updated_at: Date;
}
export interface Reciever {
  reciever_type: "Individual" | "Corporate";
  system_id: string;
  unique_id: string;

  company_name: string;
  national_id: string;

  full_name: string;
  personal_code: string;

  economic_code: string;
  phone: string;
  address: string;
  description: string;
  postal_code: string;

  created_at: Date;
  updated_at: Date;
}
export interface Customer {
  customer_type: "Individual" | "Corporate";

  company_name: string;
  national_id: string;
  full_name: string;
  personal_code: string;

  economic_code: string;
  phone: string;
  address: string;
  description: string;
  tags: string;

  created_at: Date;
  updated_at: Date;
}
