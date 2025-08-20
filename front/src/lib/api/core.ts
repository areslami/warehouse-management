import type {
  Product,
  Supplier,
  Customer,
  Receiver,
  ShippingCompany,
} from "./../interfaces/core";
import { getCoreContext } from "../core-data-context";
import { apiFetch } from "./api-client";

const API_BASE_URL = "http://localhost:8000/";

// ------------------  Product ------------------
export const fetchProducts = () =>
  apiFetch<Product[]>(`${API_BASE_URL}products/`);

export const fetchProductById = (id: number) =>
  apiFetch(`${API_BASE_URL}products/${id}/`);

export const createProduct = async (
  data: Omit<Product, "id" | "created_at" | "updated_at">
) => {
  const result = await apiFetch<Product>(`${API_BASE_URL}products/`, {
    method: "POST",
    body: data,
  });

  if (result) {
    const context = getCoreContext();
    context?.addItem("products", result);
  }

  return result;
};

export const updateProduct = async (id: number, data: Partial<Product>) => {
  const result = await apiFetch<Product>(`${API_BASE_URL}products/${id}/`, {
    method: "PATCH",
    body: data,
  });

  if (result) {
    const context = getCoreContext();
    context?.updateItem("products", id, result);
  }

  return result;
};

export const deleteProduct = async (id: number) => {
  const result = await apiFetch(`${API_BASE_URL}products/${id}/`, {
    method: "DELETE",
  });

  if (result !== null) {
    const context = getCoreContext();
    context?.deleteItem("products", id);
  }

  return result;
};

// ------------------  Supplier ------------------
export const fetchSuppliers = () =>
  apiFetch<Supplier[]>(`${API_BASE_URL}suppliers/`);

export const fetchSupplierById = (id: number) =>
  apiFetch(`${API_BASE_URL}suppliers/${id}/`);

export const createSupplier = async (
  data: Omit<Supplier, "id" | "created_at" | "updated_at">
) => {
  const result = await apiFetch<Supplier>(`${API_BASE_URL}suppliers/`, {
    method: "POST",
    body: data,
  });

  if (result) {
    const context = getCoreContext();
    context?.addItem("suppliers", result);
  }

  return result;
};

export const updateSupplier = async (id: number, data: Partial<Supplier>) => {
  const result = await apiFetch<Supplier>(`${API_BASE_URL}suppliers/${id}/`, {
    method: "PATCH",
    body: data,
  });

  if (result) {
    const context = getCoreContext();
    context?.updateItem("suppliers", id, result);
  }

  return result;
};

export const deleteSupplier = async (id: number) => {
  const result = await apiFetch(`${API_BASE_URL}suppliers/${id}/`, {
    method: "DELETE",
  });

  if (result !== null) {
    const context = getCoreContext();
    context?.deleteItem("suppliers", id);
  }

  return result;
};

// ------------------  Customer ------------------
export const fetchCustomers = () =>
  apiFetch<Customer[]>(`${API_BASE_URL}customers/`);

export const fetchCustomerById = (id: number) =>
  apiFetch(`${API_BASE_URL}customers/${id}/`);

export const createCustomer = async (
  data: Omit<Customer, "id" | "created_at" | "updated_at">
) => {
  const result = await apiFetch<Customer>(`${API_BASE_URL}customers/`, {
    method: "POST",
    body: data,
  });

  if (result) {
    const context = getCoreContext();
    context?.addItem("customers", result);
  }

  return result;
};

export const updateCustomer = async (id: number, data: Partial<Customer>) => {
  const result = await apiFetch<Customer>(`${API_BASE_URL}customers/${id}/`, {
    method: "PATCH",
    body: data,
  });

  if (result) {
    const context = getCoreContext();
    context?.updateItem("customers", id, result);
  }

  return result;
};

export const deleteCustomer = async (id: number) => {
  const result = await apiFetch(`${API_BASE_URL}customers/${id}/`, {
    method: "DELETE",
  });

  if (result !== null) {
    const context = getCoreContext();
    context?.deleteItem("customers", id);
  }

  return result;
};

// ------------------  Receiver ------------------
export const fetchReceivers = () =>
  apiFetch<Receiver[]>(`${API_BASE_URL}receivers/`);

export const fetchReceiverById = (id: number) =>
  apiFetch(`${API_BASE_URL}receivers/${id}/`);

export const createReceiver = async (
  data: Omit<Receiver, "id" | "created_at" | "updated_at">
) => {
  const result = await apiFetch<Receiver>(`${API_BASE_URL}receivers/`, {
    method: "POST",
    body: data,
  });

  if (result) {
    const context = getCoreContext();
    context?.addItem("receivers", result);
  }

  return result;
};

export const updateReceiver = async (id: number, data: Partial<Receiver>) => {
  const result = await apiFetch<Receiver>(`${API_BASE_URL}receivers/${id}/`, {
    method: "PATCH",
    body: data,
  });

  if (result) {
    const context = getCoreContext();
    context?.updateItem("receivers", id, result);
  }

  return result;
};

export const deleteReceiver = async (id: number) => {
  const result = await apiFetch(`${API_BASE_URL}receivers/${id}/`, {
    method: "DELETE",
  });

  if (result !== null) {
    const context = getCoreContext();
    context?.deleteItem("receivers", id);
  }

  return result;
};

export const fetchShippingCompanies = () =>
  apiFetch<ShippingCompany[]>(`${API_BASE_URL}warehouse/shipping-companies/`);

export const fetchShippingCompanyById = (id: number) =>
  apiFetch<ShippingCompany>(
    `${API_BASE_URL}warehouse/shipping-companies/${id}/`
  );

export const createShippingCompany = async (
  data: Omit<ShippingCompany, "id" | "created_at" | "updated_at">
) => {
  const result = await apiFetch<ShippingCompany>(
    `${API_BASE_URL}warehouse/shipping-companies/`,
    {
      method: "POST",
      body: data,
    }
  );

  if (result) {
    const context = getCoreContext();
    context?.addItem("shippingCompanies", result);
  }

  return result;
};

export const updateShippingCompany = async (
  id: number,
  data: Partial<ShippingCompany>
) => {
  const result = await apiFetch<ShippingCompany>(
    `${API_BASE_URL}warehouse/shipping-companies/${id}/`,
    { method: "PATCH", body: data }
  );

  if (result) {
    const context = getCoreContext();
    context?.updateItem("shippingCompanies", id, result);
  }

  return result;
};

export const deleteShippingCompany = async (id: number) => {
  const result = await apiFetch(
    `${API_BASE_URL}warehouse/shipping-companies/${id}/`,
    {
      method: "DELETE",
    }
  );

  if (result !== null) {
    const context = getCoreContext();
    context?.deleteItem("shippingCompanies", id);
  }

  return result;
};
