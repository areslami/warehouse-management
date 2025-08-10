export interface ProductCategory {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface ProductReigon {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  name: string;
  code: string;
  b2bcode: string;
  b2breigon: ProductReigon;
  category: ProductCategory;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: number;
  supplier_type: "Individual" | "Corporate";
  company_name: string;
  national_id: string;
  full_name: string;
  personal_code: string;
  economic_code: string;
  phone: string;
  address: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Reciever {
  id: number;
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
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: number;
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
  created_at: string;
  updated_at: string;
}

export interface ShippingCompany {
  id: number;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  description: string;
  created_at: string;
  updated_at: string;
}
