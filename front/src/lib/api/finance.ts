import type {
  PurchaseProforma,
  SalesProforma,
  ProformaExportPreset,
  ProformaLine,
  ProformaLineCreate,
  SalesProformaCreate,
  PurchaseProformaCreate,
} from "./../interfaces/finance";
import { getCoreContext } from "../core-data-context";
import { apiFetch } from "./api-client";
import { getApiBaseUrl } from "./config";

const API_BASE_URL = () => `${getApiBaseUrl()}finance/`;

export type SalesProformaExportPresetCreate = {
  name: string;
  bank_name: string;
  account_number: string;
  sheba_number: string;
  description?: string;
};

// ------------------------ PurchaseProforma  ------------------------
export const fetchPurchaseProformas = () =>
  apiFetch<PurchaseProforma[]>(`${API_BASE_URL()}purchase-proformas/`);

export const fetchPurchaseProformaById = (id: number) =>
  apiFetch<PurchaseProforma>(`${API_BASE_URL()}purchase-proformas/${id}/`);

export const createPurchaseProforma = async (data: PurchaseProformaCreate) => {
  const result = await apiFetch<PurchaseProforma>(
    `${API_BASE_URL()}purchase-proformas/`,
    {
      method: "POST",
      body: data,
    }
  );

  if (result) {
    const context = getCoreContext();
    context?.addItem("purchaseProformas", result);
  }

  return result;
};
export const updatePurchaseProforma = async (
  id: number,
  data: Partial<PurchaseProformaCreate>
) => {
  const result = await apiFetch<PurchaseProforma>(
    `${API_BASE_URL()}purchase-proformas/${id}/`,
    {
      method: "PATCH",
      body: data,
    }
  );

  if (result) {
    const context = getCoreContext();
    context?.updateItem("purchaseProformas", id, result);
  }

  return result;
};
export const deletePurchaseProforma = async (id: number) => {
  const result = await apiFetch(`${API_BASE_URL()}purchase-proformas/${id}/`, {
    method: "DELETE",
  });

  if (result !== null) {
    const context = getCoreContext();
    context?.deleteItem("purchaseProformas", id);
  }

  return result;
};

export const fetchPurchaseProformasBySupplier = (supplierId: number) =>
  apiFetch<PurchaseProforma[]>(
    `${API_BASE_URL()}purchase-proformas/by_supplier/?supplier_id=${supplierId}`
  );
export const fetchPurchaseProformasByDateRange = (
  startDate: string,
  endDate: string
) =>
  apiFetch<PurchaseProforma[]>(
    `${API_BASE_URL()}purchase-proformas/by_date_range/?start_date=${startDate}&end_date=${endDate}`
  );

// ------------------------ SalesProforma  ------------------------
export const fetchSalesProformas = () =>
  apiFetch<SalesProforma[]>(`${API_BASE_URL()}sales-proformas/`);
export const fetchSalesProformaById = (id: number) =>
  apiFetch<SalesProforma>(`${API_BASE_URL()}sales-proformas/${id}/`);
export const createSalesProforma = async (data: SalesProformaCreate) => {
  const result = await apiFetch<SalesProforma>(
    `${API_BASE_URL()}sales-proformas/`,
    {
      method: "POST",
      body: data,
    }
  );

  if (result) {
    const context = getCoreContext();
    context?.addItem("salesProformas", result);
  }

  return result;
};
export const updateSalesProforma = async (
  id: number,
  data: Partial<SalesProformaCreate>
) => {
  const result = await apiFetch<SalesProforma>(
    `${API_BASE_URL()}sales-proformas/${id}/`,
    {
      method: "PATCH",
      body: data,
    }
  );

  if (result) {
    const context = getCoreContext();
    context?.updateItem("salesProformas", id, result);
  }

  return result;
};
export const deleteSalesProforma = async (id: number) => {
  const result = await apiFetch(`${API_BASE_URL()}sales-proformas/${id}/`, {
    method: "DELETE",
  });

  if (result !== null) {
    const context = getCoreContext();
    context?.deleteItem("salesProformas", id);
  }

  return result;
};

export const fetchSalesProformasByCustomer = (customerId: number) =>
  apiFetch<SalesProforma[]>(
    `${API_BASE_URL()}sales-proformas/by_customer/?customer_id=${customerId}`
  );
export const fetchSalesProformasByDateRange = (
  startDate: string,
  endDate: string
) =>
  apiFetch<SalesProforma[]>(
    `${API_BASE_URL()}sales-proformas/by_date_range/?start_date=${startDate}&end_date=${endDate}`
  );

// ------------------------ SalesProforma Presets ------------------------
export const fetchSalesProformaPresets = () =>
  apiFetch<ProformaExportPreset[]>(`${API_BASE_URL()}sales-proforma-presets/`);

export const createSalesProformaPreset = (
  data: SalesProformaExportPresetCreate
) =>
  apiFetch<ProformaExportPreset>(`${API_BASE_URL()}sales-proforma-presets/`, {
    method: "POST",
    body: data,
  });

export const exportProformaPdf = async (id: number, type: string) => {
  const url = `${API_BASE_URL()}${type}-proformas/${id}/export_pdf/`;
  const response = await fetch(url);
  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(errorText || `HTTP ${response.status}`);
  }
  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition") || "";
  const match = disposition.match(/filename=\"?([^\";]+)\"?/i);
  const filename = match?.[1] || `${type}-proforma-${id}.pdf`;
  return { blob, filename };
};

// ------------------------ ProformaLine  ------------------------
export const fetchProformaLines = () =>
  apiFetch<ProformaLine[]>(`${API_BASE_URL()}proforma-lines/`);
export const fetchProformaLineById = (id: number) =>
  apiFetch<ProformaLine>(`${API_BASE_URL()}proforma-lines/${id}/`);
export const createProformaLine = (data: Omit<ProformaLineCreate, "id">) =>
  apiFetch<ProformaLine>(`${API_BASE_URL()}proforma-lines/`, {
    method: "POST",
    body: data,
  });
export const updateProformaLine = (
  id: number,
  data: Partial<ProformaLineCreate>
) =>
  apiFetch<ProformaLine>(`${API_BASE_URL()}proforma-lines/${id}/`, {
    method: "PATCH",
    body: data,
  });
export const deleteProformaLine = (id: number) =>
  apiFetch(`${API_BASE_URL()}proforma-lines/${id}/`, { method: "DELETE" });

export const fetchProformaLinesByProduct = (productId: number) =>
  apiFetch<ProformaLine[]>(
    `${API_BASE_URL()}proforma-lines/by_product/?product_id=${productId}`
  );
