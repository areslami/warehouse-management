export interface Product {
  id: number;
  name: string;
  code: string;
  b2bcode: string;
  b2bregion: string;
  category: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: number;
  supplier_type: "individual" | "corporate";
  company_name?: string;
  national_id?: string;
  full_name?: string;
  personal_code?: string;
  economic_code: string;
  phone: string;
  address: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Receiver {
  id: number;
  receiver_type: "individual" | "corporate";
  receiver_veichle_type: "single" | "double" | "trailer";
  unique_id: string;
  company_name?: string;
  national_id?: string;
  full_name?: string;
  personal_code?: string;
  economic_code: string;
  phone: string;
  address: string;
  description?: string;
  postal_code: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: number;
  customer_type: "individual" | "corporate";
  company_name?: string;
  national_id?: string;
  full_name?: string;
  personal_code?: string;
  economic_code: string;
  phone: string;
  address: string;
  postal_code: string;
  description?: string;
  tags?: string;
  created_at: string;
  updated_at: string;
}

export interface ShippingCompany {
  id: number;
  name: string;
  contact_person: string;
  phone: string;
  email?: string;
  address?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}
