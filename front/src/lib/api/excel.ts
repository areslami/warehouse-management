const API_BASE_URL = "http://localhost:8000/b2b/";

async function fetchWithAuth(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Sales (B2B Sale) Excel APIs
export async function uploadSalesExcel(file: File, saleType?: "your_sale" | "distributor_sale") {
  const formData = new FormData();
  formData.append("file", file);
  if (saleType) {
    formData.append("sale_type", saleType);
  }

  const response = await fetch(`${API_BASE_URL}sales/upload/`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export async function previewSales(rowData: unknown) {
  return fetchWithAuth(`${API_BASE_URL}sales/preview/`, {
    method: "POST",
    body: JSON.stringify(rowData),
  });
}

export async function createSalesBatch(sales: object[]) {
  return fetchWithAuth(`${API_BASE_URL}sales/create/`, {
    method: "POST",
    body: JSON.stringify({ sales }),
  });
}

// Address Excel APIs
export async function uploadAddressExcel(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}addresses/upload/`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export async function previewAddress(rowData: unknown) {
  return fetchWithAuth(`${API_BASE_URL}addresses/preview/`, {
    method: "POST",
    body: JSON.stringify(rowData),
  });
}

export async function createAddressBatch(addresses: object[]) {
  return fetchWithAuth(`${API_BASE_URL}addresses/create/`, {
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
