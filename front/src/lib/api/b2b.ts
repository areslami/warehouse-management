import {
  B2BOffer,
  B2BAddress,
  B2BDistribution,
  B2BSale,
} from "../interfaces/b2b";

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

  // Handle DELETE requests which might return 204 No Content
  if (response.status === 204 || options?.method === 'DELETE') {
    return;
  }

  // Check if response has content
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  
  return;
}

// B2B Offer APIs
export async function fetchB2BOffers(): Promise<B2BOffer[]> {
  return fetchWithAuth(`${API_BASE_URL}offers/`);
}

export async function fetchB2BOfferById(id: number): Promise<B2BOffer> {
  return fetchWithAuth(`${API_BASE_URL}offers/${id}/`);
}

export async function createB2BOffer(
  offer: Partial<B2BOffer>
): Promise<B2BOffer> {
  return fetchWithAuth(`${API_BASE_URL}offers/`, {
    method: "POST",
    body: JSON.stringify(offer),
  });
}

export async function updateB2BOffer(
  id: number,
  offer: Partial<B2BOffer>
): Promise<B2BOffer> {
  return fetchWithAuth(`${API_BASE_URL}offers/${id}/`, {
    method: "PUT",
    body: JSON.stringify(offer),
  });
}

export async function deleteB2BOffer(id: number): Promise<void> {
  return fetchWithAuth(`${API_BASE_URL}offers/${id}/`, {
    method: "DELETE",
  });
}

// B2B Address APIs
export async function fetchB2BAddresss(): Promise<B2BAddress[]> {
  return fetchWithAuth(`${API_BASE_URL}address/`);
}

export async function fetchB2BAddressById(id: number): Promise<B2BAddress> {
  return fetchWithAuth(`${API_BASE_URL}address/${id}/`);
}

export async function createB2BAddress(
  address: Partial<B2BAddress>
): Promise<B2BAddress> {
  return fetchWithAuth(`${API_BASE_URL}address/`, {
    method: "POST",
    body: JSON.stringify(address),
  });
}

export async function updateB2BAddress(
  id: number,
  address: Partial<B2BAddress>
): Promise<B2BAddress> {
  return fetchWithAuth(`${API_BASE_URL}address/${id}/`, {
    method: "PUT",
    body: JSON.stringify(address),
  });
}

export async function deleteB2BAddress(id: number): Promise<void> {
  return fetchWithAuth(`${API_BASE_URL}address/${id}/`, {
    method: "DELETE",
  });
}

// B2B Distribution APIs
export async function fetchB2BDistributions(): Promise<B2BDistribution[]> {
  return fetchWithAuth(`${API_BASE_URL}distributions/`);
}

export async function fetchB2BDistributionById(
  id: number
): Promise<B2BDistribution> {
  return fetchWithAuth(`${API_BASE_URL}distributions/${id}/`);
}

export async function createB2BDistribution(
  distribution: Partial<B2BDistribution>
): Promise<B2BDistribution> {
  return fetchWithAuth(`${API_BASE_URL}distributions/`, {
    method: "POST",
    body: JSON.stringify(distribution),
  });
}

export async function updateB2BDistribution(
  id: number,
  distribution: Partial<B2BDistribution>
): Promise<B2BDistribution> {
  return fetchWithAuth(`${API_BASE_URL}distributions/${id}/`, {
    method: "PUT",
    body: JSON.stringify(distribution),
  });
}

export async function deleteB2BDistribution(id: number): Promise<void> {
  return fetchWithAuth(`${API_BASE_URL}distributions/${id}/`, {
    method: "DELETE",
  });
}

export async function fetchB2BSales(): Promise<B2BSale[]> {
  return fetchWithAuth(`${API_BASE_URL}sales/`);
}
export async function fetchB2BSaleById(id: number): Promise<B2BSale> {
  return fetchWithAuth(`${API_BASE_URL}sales/${id}/`);
}
export async function createB2BSale(sale: Partial<B2BSale>): Promise<B2BSale> {
  return fetchWithAuth(`${API_BASE_URL}sales/`, {
    method: "POST",
    body: JSON.stringify(sale),
  });
}
export async function updateB2BSale(
  id: number,
  sale: Partial<B2BSale>
): Promise<B2BSale> {
  return fetchWithAuth(`${API_BASE_URL}sales/${id}/`, {
    method: "PUT",
    body: JSON.stringify(sale),
  });
}
export async function deleteB2BSale(id: number): Promise<void> {
  return fetchWithAuth(`${API_BASE_URL}sales/${id}/`, {
    method: "DELETE",
  });
}
