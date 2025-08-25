const API_BASE_URL = "http://localhost:8000/b2b/";

async function fetchWithAuth(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export async function uploadExcel(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}excel/upload/`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export async function previewDistribution(rowData: any) {
  return fetchWithAuth(`${API_BASE_URL}excel/preview/`, {
    method: 'POST',
    body: JSON.stringify(rowData),
  });
}

export async function createDistributionsBatch(distributions: any[]) {
  return fetchWithAuth(`${API_BASE_URL}excel/batch-create/`, {
    method: 'POST',
    body: JSON.stringify({ distributions }),
  });
}

export async function searchCustomerByName(name: string) {
  return fetchWithAuth(`${API_BASE_URL}customers/search/?name=${encodeURIComponent(name)}`);
}