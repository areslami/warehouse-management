import { getApiBaseUrl } from "./config";

const API_BASE_URL = () => `${getApiBaseUrl()}b2b/`;

export class ApiError extends Error {
  code?: string;
  payload?: unknown;
  constructor(message: string, code?: string, payload?: unknown) {
    super(message);
    this.code = code;
    this.payload = payload;
  }
}

async function parseJsonResponse(response: Response) {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new ApiError(
      data?.message || `HTTP error! status: ${response.status}`,
      data?.error,
      data
    );
  }
  return data;
}

async function fetchWithAuth(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  return parseJsonResponse(response);
}

// Sales (B2B Sale) Excel APIs
export async function uploadSalesExcel(
  file: File,
  saleType?: "your_sale" | "distributor_sale",
  context?: { offerId?: number | null; distributionId?: number | null }
) {
  const formData = new FormData();
  formData.append("file", file);
  if (saleType) {
    formData.append("sale_type", saleType);
  }
  if (saleType === "your_sale" && context?.offerId) {
    formData.append("offer_id", String(context.offerId));
  }
  if (saleType === "distributor_sale" && context?.distributionId) {
    formData.append("distribution_id", String(context.distributionId));
  }

  const response = await fetch(`${API_BASE_URL()}sales/upload/`, {
    method: "POST",
    body: formData,
  });

  return parseJsonResponse(response);
}

export async function previewSales(rowData: unknown) {
  return fetchWithAuth(`${API_BASE_URL()}sales/preview/`, {
    method: "POST",
    body: JSON.stringify(rowData),
  });
}

export async function createSalesBatch(sales: object[]) {
  return fetchWithAuth(`${API_BASE_URL()}sales/create/`, {
    method: "POST",
    body: JSON.stringify({ sales }),
  });
}

// Address Excel APIs
export async function uploadAddressExcel(
  file: File,
  params: {
    addressType: "your_address" | "distributor_address";
    offerId?: number | null;
    transferId?: number | null;
  }
) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("address_type", params.addressType);
  if (params.addressType === "your_address" && params.offerId) {
    formData.append("offer_id", String(params.offerId));
  }
  if (params.addressType === "distributor_address" && params.transferId) {
    formData.append("transfer_id", String(params.transferId));
  }

  const response = await fetch(`${API_BASE_URL()}addresses/upload/`, {
    method: "POST",
    body: formData,
  });

  return parseJsonResponse(response);
}

export async function previewAddress(rowData: unknown) {
  return fetchWithAuth(`${API_BASE_URL()}addresses/preview/`, {
    method: "POST",
    body: JSON.stringify(rowData),
  });
}

export async function createAddressBatch(addresses: object[]) {
  return fetchWithAuth(`${API_BASE_URL()}addresses/create/`, {
    method: "POST",
    body: JSON.stringify({ sales: addresses }),
  });
}

// Legacy aliases (for any older imports)
export const uploadDistributionExcel = uploadSalesExcel;
export const previewDistribution = previewSales;
export const createDistributionsBatch = createSalesBatch;
export async function uploadSaleExcel(file: File, saleType?: "your_sale" | "distributor_sale") {
  return uploadSalesExcel(file, saleType);
}
export async function previewSale(rowData: unknown) {
  return previewSales(rowData);
}
export async function createSaleBatch(sales: object[]) {
  return createSalesBatch(sales);
}
