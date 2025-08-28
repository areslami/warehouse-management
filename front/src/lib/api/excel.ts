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

export async function uploadDistributionExcel(file: File, saleType?: "your_sale" | "distributor_sale") {
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

export async function previewDistribution(rowData: unknown) {
  return fetchWithAuth(`${API_BASE_URL}sales/preview/`, {
    method: "POST",
    body: JSON.stringify(rowData),
  });
}

export async function createDistributionsBatch(distributions: object[]) {
  return fetchWithAuth(`${API_BASE_URL}sales/create/`, {
    method: "POST",
    body: JSON.stringify({ distributions }),
  });
}

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

// Legacy function name for backward compatibility
export async function uploadSaleExcel(file: File) {
  return uploadAddressExcel(file);
}

export async function previewAddress(rowData: unknown) {
  return fetchWithAuth(`${API_BASE_URL}addresses/preview/`, {
    method: "POST",
    body: JSON.stringify(rowData),
  });
}

// Legacy function name for backward compatibility
export async function previewSale(rowData: unknown) {
  return previewAddress(rowData);
}

export async function createAddressBatch(addresses: object[]) {
  return fetchWithAuth(`${API_BASE_URL}addresses/create/`, {
    method: "POST",
    body: JSON.stringify({ sales: addresses }),
  });
}

// Legacy function name for backward compatibility
export async function createSaleBatch(sales: object[]) {
  return createAddressBatch(sales);
}
