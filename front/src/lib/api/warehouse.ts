import type {
  Warehouse,
  WarehouseReceipt,
  DispatchIssue,
  DeliveryFulfillment,
  WarehouseReceiptItem,
  DispatchIssueItem,
  DeliveryFulfillmentItem,
} from "./../interfaces/warehouse";

const API_BASE_URL = "http://127.0.0.1:8000/warehouse/";

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

export const fetchWarehouses = () =>
  apiFetch<Warehouse[]>(`${API_BASE_URL}warehouses/`);

export const fetchWarehouseById = (id: number) =>
  apiFetch<Warehouse>(`${API_BASE_URL}warehouses/${id}/`);

export const createWarehouse = (
  data: Omit<Warehouse, "id" | "created_at" | "updated_at">
) =>
  apiFetch<Warehouse>(`${API_BASE_URL}warehouses/`, {
    method: "POST",
    body: data,
  });

export const updateWarehouse = (id: number, data: Partial<Warehouse>) =>
  apiFetch<Warehouse>(`${API_BASE_URL}warehouses/${id}/`, {
    method: "PATCH",
    body: data,
  });

export const deleteWarehouse = (id: number) =>
  apiFetch(`${API_BASE_URL}warehouses/${id}/`, { method: "DELETE" });

// --------------- WarehouseReceipt  ---------------
export const fetchWarehouseReceipts = () =>
  apiFetch<WarehouseReceipt[]>(`${API_BASE_URL}receipts/`);

export const fetchWarehouseReceiptById = (id: number) =>
  apiFetch<WarehouseReceipt>(`${API_BASE_URL}receipts/${id}/`);

export const createWarehouseReceipt = (
  data: Omit<WarehouseReceipt, "id" | "created_at" | "updated_at" | "items"> & {
    items: Omit<WarehouseReceiptItem, "id" | "receipt">[];
  }
) =>
  apiFetch<WarehouseReceipt>(`${API_BASE_URL}receipts/`, {
    method: "POST",
    body: data,
  });

export const updateWarehouseReceipt = (
  id: number,
  data: {
    receipt_id?: string;
    receipt_type?: "import_cottage" | "distribution_cottage" | "purchase";
    date?: string;
    warehouse?: number;
    description?: string;
    cottage_serial_number?: string;
    proforma?: number;
    items?: { product: number; weight: number }[];
  }
) =>
  apiFetch<WarehouseReceipt>(`${API_BASE_URL}receipts/${id}/`, {
    method: "PATCH",
    body: data,
  });

export const deleteWarehouseReceipt = (id: number) =>
  apiFetch(`${API_BASE_URL}receipts/${id}/`, { method: "DELETE" });

export const fetchWarehouseReceiptsByDateRange = (
  startDate: string,
  endDate: string
) =>
  apiFetch<WarehouseReceipt[]>(
    `${API_BASE_URL}receipts/by_date_range/?start_date=${startDate}&end_date=${endDate}`
  );

// --------------- DispatchIssue  ---------------
export const fetchDispatchIssues = () =>
  apiFetch<DispatchIssue[]>(`${API_BASE_URL}dispatches/`);

export const fetchDispatchIssueById = (id: number) =>
  apiFetch<DispatchIssue>(`${API_BASE_URL}dispatches/${id}/`);

export const createDispatchIssue = (
  data: Omit<DispatchIssue, "id" | "created_at" | "updated_at" | "items"> & {
    items: Omit<DispatchIssueItem, "id" | "dispatch">[];
  }
) =>
  apiFetch<DispatchIssue>(`${API_BASE_URL}dispatches/`, {
    method: "POST",
    body: data,
  });

export const updateDispatchIssue = (
  id: number,
  data: {
    dispatch_id?: string;
    warehouse?: number;
    sales_proforma?: number;
    issue_date?: string;
    validity_date?: string;
    description?: string;
    shipping_company?: number;
    items?: {
      product: number;
      weight: number;
      vehicle_type: "truck" | "pickup" | "van" | "container" | "other";
      receiver: number;
    }[];
  }
) =>
  apiFetch<DispatchIssue>(`${API_BASE_URL}dispatches/${id}/`, {
    method: "PATCH",
    body: data,
  });

export const deleteDispatchIssue = (id: number) =>
  apiFetch(`${API_BASE_URL}dispatches/${id}/`, { method: "DELETE" });

// --------------- DeliveryFulfillment  ---------------
export const fetchDeliveryFulfillments = () =>
  apiFetch<DeliveryFulfillment[]>(`${API_BASE_URL}deliveries/`);

export const fetchDeliveryFulfillmentById = (id: number) =>
  apiFetch<DeliveryFulfillment>(`${API_BASE_URL}deliveries/${id}/`);

export const createDeliveryFulfillment = (
  data: Omit<
    DeliveryFulfillment,
    "id" | "created_at" | "updated_at" | "items"
  > & { items: Omit<DeliveryFulfillmentItem, "id" | "delivery">[] }
) =>
  apiFetch<DeliveryFulfillment>(`${API_BASE_URL}deliveries/`, {
    method: "POST",
    body: data,
  });

export const updateDeliveryFulfillment = (
  id: number,
  data: {
    delivery_id?: string;
    issue_date?: string;
    validity_date?: string;
    warehouse?: number;
    sales_proforma?: number;
    description?: string;
    shipping_company?: number;
    items?: {
      shipment_id: string;
      shipment_price: number;
      product: number;
      weight: number;
      vehicle_type: "truck" | "pickup" | "van" | "container" | "other";
      receiver: number;
    }[];
  }
) =>
  apiFetch<DeliveryFulfillment>(`${API_BASE_URL}deliveries/${id}/`, {
    method: "PATCH",
    body: data,
  });

export const deleteDeliveryFulfillment = (id: number) =>
  apiFetch(`${API_BASE_URL}deliveries/${id}/`, { method: "DELETE" });
