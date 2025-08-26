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

export async function uploadDistributionExcel(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}distribution/upload/`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export async function previewDistribution(rowData: unknown) {
  return fetchWithAuth(`${API_BASE_URL}distribution/preview/`, {
    method: "POST",
    body: JSON.stringify(rowData),
  });
}

export async function createDistributionsBatch(distributions: object[]) {
  return fetchWithAuth(`${API_BASE_URL}distribution/create/`, {
    method: "POST",
    body: JSON.stringify({ distributions }),
  });
}

export async function uploadSaleExcel(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}sale/upload/`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export async function previewSale(rowData: unknown) {
  return fetchWithAuth(`${API_BASE_URL}sale/preview/`, {
    method: "POST",
    body: JSON.stringify(rowData),
  });
}

export async function createSaleBatch(sales: object[]) {
  return fetchWithAuth(`${API_BASE_URL}sale/create/`, {
    method: "POST",
    body: JSON.stringify({ sales }),
  });
}
