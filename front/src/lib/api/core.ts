// api/core.ts
import type {
  Product,
  ProductCategory,
  ProductReigon,
  Supplier,
  Customer,
  Reciever,
  ShippingCompany,
} from "./../interfaces/core";

const API_BASE_URL = "http://127.0.0.1:8000/";

interface FetchOptions {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
}

const apiFetch = async <T>(
  url: string,
  options: FetchOptions = { method: "GET" }
): Promise<T | null> => {
  const headers = {
    "Content-Type": "application/json",
  };

  const config: RequestInit = {
    method: options.method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

// ------------------  Product Category ------------------
export const fetchProductCategories = () =>
  apiFetch(`${API_BASE_URL}product-categories/`);

export const fetchProductCategoryById = (id: number) =>
  apiFetch(`${API_BASE_URL}product-categories/${id}/`);

export const createProductCategory = (
  data: Omit<ProductCategory, "id" | "created_at" | "updated_at">
) =>
  apiFetch(`${API_BASE_URL}product-categories/`, {
    method: "POST",
    body: data,
  });

export const updateProductCategory = (
  id: number,
  data: Partial<ProductCategory>
) =>
  apiFetch(`${API_BASE_URL}product-categories/${id}/`, {
    method: "PATCH",
    body: data,
  });

export const deleteProductCategory = (id: number) =>
  apiFetch(`${API_BASE_URL}product-categories/${id}/`, { method: "DELETE" });

// ------------------  Product Reigon ------------------
export const fetchProductReigons = () =>
  apiFetch(`${API_BASE_URL}product-regions/`);

export const fetchProductReigonById = (id: number) =>
  apiFetch(`${API_BASE_URL}product-regions/${id}/`);

export const createProductReigon = (
  data: Omit<ProductReigon, "id" | "created_at" | "updated_at">
) =>
  apiFetch(`${API_BASE_URL}product-regions/`, { method: "POST", body: data });

export const updateProductReigon = (id: number, data: Partial<ProductReigon>) =>
  apiFetch(`${API_BASE_URL}product-regions/${id}/`, {
    method: "PATCH",
    body: data,
  });

export const deleteProductReigon = (id: number) =>
  apiFetch(`${API_BASE_URL}product-regions/${id}/`, { method: "DELETE" });

// ------------------  Product ------------------
export const fetchProducts = () => apiFetch(`${API_BASE_URL}products/`);

export const fetchProductById = (id: number) =>
  apiFetch(`${API_BASE_URL}products/${id}/`);

export const createProduct = (
  data: Omit<Product, "id" | "created_at" | "updated_at">
) => apiFetch(`${API_BASE_URL}products/`, { method: "POST", body: data });

export const updateProduct = (id: number, data: Partial<Product>) =>
  apiFetch(`${API_BASE_URL}products/${id}/`, { method: "PATCH", body: data });

export const deleteProduct = (id: number) =>
  apiFetch(`${API_BASE_URL}products/${id}/`, { method: "DELETE" });

export const fetchProductsByCategory = (categoryId: number) =>
  apiFetch(`${API_BASE_URL}products/by_category/?category_id=${categoryId}`);

// ------------------  Supplier ------------------
export const fetchSuppliers = () => apiFetch(`${API_BASE_URL}suppliers/`);

export const fetchSupplierById = (id: number) =>
  apiFetch(`${API_BASE_URL}suppliers/${id}/`);

export const createSupplier = (
  data: Omit<Supplier, "id" | "created_at" | "updated_at">
) => apiFetch(`${API_BASE_URL}suppliers/`, { method: "POST", body: data });

export const updateSupplier = (id: number, data: Partial<Supplier>) =>
  apiFetch(`${API_BASE_URL}suppliers/${id}/`, { method: "PATCH", body: data });

export const deleteSupplier = (id: number) =>
  apiFetch(`${API_BASE_URL}suppliers/${id}/`, { method: "DELETE" });

// ------------------  Customer ------------------
export const fetchCustomers = () => apiFetch(`${API_BASE_URL}customers/`);

export const fetchCustomerById = (id: number) =>
  apiFetch(`${API_BASE_URL}customers/${id}/`);

export const createCustomer = (
  data: Omit<Customer, "id" | "created_at" | "updated_at">
) => apiFetch(`${API_BASE_URL}customers/`, { method: "POST", body: data });

export const updateCustomer = (id: number, data: Partial<Customer>) =>
  apiFetch(`${API_BASE_URL}customers/${id}/`, { method: "PATCH", body: data });

export const deleteCustomer = (id: number) =>
  apiFetch(`${API_BASE_URL}customers/${id}/`, { method: "DELETE" });

// ------------------  Reviever ------------------
export const fetchRecievers = () => apiFetch(`${API_BASE_URL}receivers/`);

export const fetchRecieverById = (id: number) =>
  apiFetch(`${API_BASE_URL}receivers/${id}/`);

export const createReciever = (
  data: Omit<Reciever, "id" | "created_at" | "updated_at">
) => apiFetch(`${API_BASE_URL}receivers/`, { method: "POST", body: data });

export const updateReciever = (id: number, data: Partial<Reciever>) =>
  apiFetch(`${API_BASE_URL}receivers/${id}/`, { method: "PATCH", body: data });

export const deleteReciever = (id: number) =>
  apiFetch(`${API_BASE_URL}receivers/${id}/`, { method: "DELETE" });

export const fetchShippingCompanies = () =>
  apiFetch<ShippingCompany[]>(`${API_BASE_URL}warehouse/shipping-companies/`);

export const fetchShippingCompanyById = (id: number) =>
  apiFetch<ShippingCompany>(
    `${API_BASE_URL}warehouse/shipping-companies/${id}/`
  );

export const createShippingCompany = (
  data: Omit<ShippingCompany, "id" | "created_at" | "updated_at">
) =>
  apiFetch<ShippingCompany>(`${API_BASE_URL}warehouse/shipping-companies/`, {
    method: "POST",
    body: data,
  });

export const updateShippingCompany = (
  id: number,
  data: Partial<ShippingCompany>
) =>
  apiFetch<ShippingCompany>(
    `${API_BASE_URL}warehouse/shipping-companies/${id}/`,
    { method: "PATCH", body: data }
  );

export const deleteShippingCompany = (id: number) =>
  apiFetch(`${API_BASE_URL}warehouse/shipping-companies/${id}/`, {
    method: "DELETE",
  });
