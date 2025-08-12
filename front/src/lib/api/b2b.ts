import { B2BOffer, B2BSale, B2BPurchase, B2BDistribution } from '../interfaces/b2b';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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

// B2B Offer APIs
export async function fetchB2BOffers(): Promise<B2BOffer[]> {
  return fetchWithAuth(`${API_BASE}/b2b/offers/`);
}

export async function createB2BOffer(offer: Partial<B2BOffer>): Promise<B2BOffer> {
  return fetchWithAuth(`${API_BASE}/b2b/offers/`, {
    method: 'POST',
    body: JSON.stringify(offer),
  });
}

export async function updateB2BOffer(id: number, offer: Partial<B2BOffer>): Promise<B2BOffer> {
  return fetchWithAuth(`${API_BASE}/b2b/offers/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(offer),
  });
}

export async function deleteB2BOffer(id: number): Promise<void> {
  return fetchWithAuth(`${API_BASE}/b2b/offers/${id}/`, {
    method: 'DELETE',
  });
}

// B2B Sale APIs
export async function fetchB2BSales(): Promise<B2BSale[]> {
  return fetchWithAuth(`${API_BASE}/b2b/sales/`);
}

export async function createB2BSale(sale: Partial<B2BSale>): Promise<B2BSale> {
  return fetchWithAuth(`${API_BASE}/b2b/sales/`, {
    method: 'POST',
    body: JSON.stringify(sale),
  });
}

export async function updateB2BSale(id: number, sale: Partial<B2BSale>): Promise<B2BSale> {
  return fetchWithAuth(`${API_BASE}/b2b/sales/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(sale),
  });
}

export async function deleteB2BSale(id: number): Promise<void> {
  return fetchWithAuth(`${API_BASE}/b2b/sales/${id}/`, {
    method: 'DELETE',
  });
}

// B2B Purchase APIs
export async function fetchB2BPurchases(): Promise<B2BPurchase[]> {
  return fetchWithAuth(`${API_BASE}/b2b/purchases/`);
}

export async function createB2BPurchase(purchase: Partial<B2BPurchase>): Promise<B2BPurchase> {
  return fetchWithAuth(`${API_BASE}/b2b/purchases/`, {
    method: 'POST',
    body: JSON.stringify(purchase),
  });
}

export async function updateB2BPurchase(id: number, purchase: Partial<B2BPurchase>): Promise<B2BPurchase> {
  return fetchWithAuth(`${API_BASE}/b2b/purchases/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(purchase),
  });
}

export async function deleteB2BPurchase(id: number): Promise<void> {
  return fetchWithAuth(`${API_BASE}/b2b/purchases/${id}/`, {
    method: 'DELETE',
  });
}

// B2B Distribution APIs
export async function fetchB2BDistributions(): Promise<B2BDistribution[]> {
  return fetchWithAuth(`${API_BASE}/b2b/distributions/`);
}

export async function createB2BDistribution(distribution: Partial<B2BDistribution>): Promise<B2BDistribution> {
  return fetchWithAuth(`${API_BASE}/b2b/distributions/`, {
    method: 'POST',
    body: JSON.stringify(distribution),
  });
}

export async function updateB2BDistribution(id: number, distribution: Partial<B2BDistribution>): Promise<B2BDistribution> {
  return fetchWithAuth(`${API_BASE}/b2b/distributions/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(distribution),
  });
}

export async function deleteB2BDistribution(id: number): Promise<void> {
  return fetchWithAuth(`${API_BASE}/b2b/distributions/${id}/`, {
    method: 'DELETE',
  });
}