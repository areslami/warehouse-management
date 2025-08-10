import type {
  PurchaseProforma,
  SalesProforma,
  ProformaLine,
  ProformaLineCreate,
  SalesProformaCreate,
  PurchaseProformaCreate,
} from "./../interfaces/finance";

const API_BASE_URL = "http://127.0.0.1:8000/finance/";

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

// ------------------------ PurchaseProforma  ------------------------
export const fetchPurchaseProformas = () =>
  apiFetch<PurchaseProforma[]>(`${API_BASE_URL}purchase-proformas/`);
export const fetchPurchaseProformaById = (id: number) =>
  apiFetch<PurchaseProforma>(`${API_BASE_URL}purchase-proformas/${id}/`);
export const createPurchaseProforma = (data: PurchaseProformaCreate) =>
  apiFetch<PurchaseProforma>(`${API_BASE_URL}purchase-proformas/`, {
    method: "POST",
    body: data,
  });
export const updatePurchaseProforma = (
  id: number,
  data: Partial<PurchaseProformaCreate>
) =>
  apiFetch<PurchaseProforma>(`${API_BASE_URL}purchase-proformas/${id}/`, {
    method: "PATCH",
    body: data,
  });
export const deletePurchaseProforma = (id: number) =>
  apiFetch(`${API_BASE_URL}purchase-proformas/${id}/`, { method: "DELETE" });

export const fetchPurchaseProformasBySupplier = (supplierId: number) =>
  apiFetch<PurchaseProforma[]>(
    `${API_BASE_URL}purchase-proformas/by_supplier/?supplier_id=${supplierId}`
  );
export const fetchPurchaseProformasByDateRange = (
  startDate: string,
  endDate: string
) =>
  apiFetch<PurchaseProforma[]>(
    `${API_BASE_URL}purchase-proformas/by_date_range/?start_date=${startDate}&end_date=${endDate}`
  );

// ------------------------ SalesProforma  ------------------------
export const fetchSalesProformas = () =>
  apiFetch<SalesProforma[]>(`${API_BASE_URL}sales-proformas/`);
export const fetchSalesProformaById = (id: number) =>
  apiFetch<SalesProforma>(`${API_BASE_URL}sales-proformas/${id}/`);
export const createSalesProforma = (data: SalesProformaCreate) =>
  apiFetch<SalesProforma>(`${API_BASE_URL}sales-proformas/`, {
    method: "POST",
    body: data,
  });
export const updateSalesProforma = (
  id: number,
  data: Partial<SalesProformaCreate>
) =>
  apiFetch<SalesProforma>(`${API_BASE_URL}sales-proformas/${id}/`, {
    method: "PATCH",
    body: data,
  });
export const deleteSalesProforma = (id: number) =>
  apiFetch(`${API_BASE_URL}sales-proformas/${id}/`, { method: "DELETE" });

export const fetchSalesProformasByCustomer = (customerId: number) =>
  apiFetch<SalesProforma[]>(
    `${API_BASE_URL}sales-proformas/by_customer/?customer_id=${customerId}`
  );
export const fetchSalesProformasByPaymentType = (paymentType: string) =>
  apiFetch<SalesProforma[]>(
    `${API_BASE_URL}sales-proformas/by_payment_type/?payment_type=${paymentType}`
  );
export const fetchSalesProformasByDateRange = (
  startDate: string,
  endDate: string
) =>
  apiFetch<SalesProforma[]>(
    `${API_BASE_URL}sales-proformas/by_date_range/?start_date=${startDate}&end_date=${endDate}`
  );

// ------------------------ ProformaLine  ------------------------
export const fetchProformaLines = () =>
  apiFetch<ProformaLine[]>(`${API_BASE_URL}proforma-lines/`);
export const fetchProformaLineById = (id: number) =>
  apiFetch<ProformaLine>(`${API_BASE_URL}proforma-lines/${id}/`);
export const createProformaLine = (data: Omit<ProformaLineCreate, "id">) =>
  apiFetch<ProformaLine>(`${API_BASE_URL}proforma-lines/`, {
    method: "POST",
    body: data,
  });
export const updateProformaLine = (
  id: number,
  data: Partial<ProformaLineCreate>
) =>
  apiFetch<ProformaLine>(`${API_BASE_URL}proforma-lines/${id}/`, {
    method: "PATCH",
    body: data,
  });
export const deleteProformaLine = (id: number) =>
  apiFetch(`${API_BASE_URL}proforma-lines/${id}/`, { method: "DELETE" });

export const fetchProformaLinesByProduct = (productId: number) =>
  apiFetch<ProformaLine[]>(
    `${API_BASE_URL}proforma-lines/by_product/?product_id=${productId}`
  );
