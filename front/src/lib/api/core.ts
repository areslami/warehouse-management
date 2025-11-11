import type {
  Product,
  Supplier,
  Customer,
  Receiver,
  ShippingCompany,
  Indicator,
  IndicatorSection,
} from "./../interfaces/core";
import { getCoreContext } from "../core-data-context";
import { apiFetch } from "./api-client";
import { getApiBaseUrl } from "./config";

const API_BASE_URL = () => getApiBaseUrl();

// ------------------  Product ------------------
export const fetchProducts = () =>
  apiFetch<Product[]>(`${API_BASE_URL()}products/`);

export const fetchProductById = (id: number) =>
  apiFetch(`${API_BASE_URL()}products/${id}/`);

export const createProduct = async (
  data: Omit<Product, "id" | "created_at" | "updated_at">
) => {
  const result = await apiFetch<Product>(`${API_BASE_URL()}products/`, {
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
  const result = await apiFetch<Product>(`${API_BASE_URL()}products/${id}/`, {
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
  const result = await apiFetch(`${API_BASE_URL()}products/${id}/`, {
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
  apiFetch<Supplier[]>(`${API_BASE_URL()}suppliers/`);

export const fetchSupplierById = (id: number) =>
  apiFetch(`${API_BASE_URL()}suppliers/${id}/`);

export const createSupplier = async (
  data: Omit<Supplier, "id" | "created_at" | "updated_at">
) => {
  const result = await apiFetch<Supplier>(`${API_BASE_URL()}suppliers/`, {
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
  const result = await apiFetch<Supplier>(`${API_BASE_URL()}suppliers/${id}/`, {
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
  const result = await apiFetch(`${API_BASE_URL()}suppliers/${id}/`, {
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
  apiFetch<Customer[]>(`${API_BASE_URL()}customers/`);

export const fetchCustomerById = (id: number) =>
  apiFetch(`${API_BASE_URL()}customers/${id}/`);

export const createCustomer = async (
  data: Omit<Customer, "id" | "created_at" | "updated_at">
) => {
  const result = await apiFetch<Customer>(`${API_BASE_URL()}customers/`, {
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
  const result = await apiFetch<Customer>(`${API_BASE_URL()}customers/${id}/`, {
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
  const result = await apiFetch(`${API_BASE_URL()}customers/${id}/`, {
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
  apiFetch<Receiver[]>(`${API_BASE_URL()}receivers/`);

export const fetchReceiverById = (id: number) =>
  apiFetch(`${API_BASE_URL()}receivers/${id}/`);

export const createReceiver = async (
  data: Omit<Receiver, "id" | "created_at" | "updated_at">
) => {
  const result = await apiFetch<Receiver>(`${API_BASE_URL()}receivers/`, {
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
  const result = await apiFetch<Receiver>(`${API_BASE_URL()}receivers/${id}/`, {
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
  const result = await apiFetch(`${API_BASE_URL()}receivers/${id}/`, {
    method: "DELETE",
  });

  if (result !== null) {
    const context = getCoreContext();
    context?.deleteItem("receivers", id);
  }

  return result;
};

export const fetchShippingCompanies = () =>
  apiFetch<ShippingCompany[]>(`${API_BASE_URL()}warehouse/shipping-companies/`);

export const fetchShippingCompanyById = (id: number) =>
  apiFetch<ShippingCompany>(
    `${API_BASE_URL()}warehouse/shipping-companies/${id}/`
  );

export const createShippingCompany = async (
  data: Omit<ShippingCompany, "id" | "created_at" | "updated_at">
) => {
  const result = await apiFetch<ShippingCompany>(
    `${API_BASE_URL()}warehouse/shipping-companies/`,
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
    `${API_BASE_URL()}warehouse/shipping-companies/${id}/`,
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
    `${API_BASE_URL()}warehouse/shipping-companies/${id}/`,
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

// ------------------  Indicator ------------------
const indicatorsBaseUrl = () => `${API_BASE_URL()}indicators/`;

const buildIndicatorsUrl = (
  params?: Record<string, string | number | boolean>
) => {
  if (!params || Object.keys(params).length === 0) {
    return indicatorsBaseUrl();
  }

  const url = new URL(indicatorsBaseUrl());
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });
  return url.toString();
};

export const fetchIndicators = (params?: {
  belongs?: IndicatorSection;
  is_default?: boolean | string;
}) => apiFetch<Indicator[]>(buildIndicatorsUrl(params));

type IndicatorPayload = {
  name: string;
  belongs: IndicatorSection;
  format_template: string;
};

export const createIndicator = async (data: IndicatorPayload) =>
  apiFetch<Indicator>(indicatorsBaseUrl(), {
    method: "POST",
    body: data,
  });

export const updateIndicator = async (
  id: number,
  data: Partial<IndicatorPayload>
) =>
  apiFetch<Indicator>(`${indicatorsBaseUrl()}${id}/`, {
    method: "PATCH",
    body: data,
  });

export const setDefaultIndicator = async (id: number) =>
  apiFetch<Indicator>(`${indicatorsBaseUrl()}${id}/set-default/`, {
    method: "POST",
  });

export const incrementIndicatorCounter = async (id: number) =>
  apiFetch<Indicator>(`${indicatorsBaseUrl()}${id}/increment/`, {
    method: "POST",
  });

export const deleteIndicator = async (id: number) =>
  apiFetch(`${indicatorsBaseUrl()}${id}/`, { method: "DELETE" });

export const fetchDefaultIndicator = async (
  section: IndicatorSection
): Promise<Indicator | null> => {
  const list = await fetchIndicators({
    belongs: section,
    is_default: "true",
  });
  if (Array.isArray(list) && list.length > 0) {
    return list[0];
  }
  return null;
};
