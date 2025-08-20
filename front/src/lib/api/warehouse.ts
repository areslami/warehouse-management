import type {
  Warehouse,
  WarehouseReceipt,
  DispatchIssue,
  DeliveryFulfillment,
  WarehouseReceiptCreate,
  DispatchIssueCreate,
  DeliveryFulfillmentCreate,
} from "./../interfaces/warehouse";

import { getCoreContext } from "../core-data-context";
import { apiFetch } from "./api-client";

const API_BASE_URL = "http://localhost:8000/warehouse/";

export const fetchWarehouses = () =>
  apiFetch<Warehouse[]>(`${API_BASE_URL}warehouses/`);

export const fetchWarehouseById = (id: number) =>
  apiFetch<Warehouse>(`${API_BASE_URL}warehouses/${id}/`);

export const createWarehouse = async (
  data: Omit<Warehouse, "id" | "created_at" | "updated_at">
) => {
  const result = await apiFetch<Warehouse>(`${API_BASE_URL}warehouses/`, {
    method: "POST",
    body: data,
  });

  if (result) {
    const context = getCoreContext();
    context?.addItem("warehouses", result);
  }

  return result;
};

export const updateWarehouse = async (id: number, data: Partial<Warehouse>) => {
  const result = await apiFetch<Warehouse>(`${API_BASE_URL}warehouses/${id}/`, {
    method: "PATCH",
    body: data,
  });

  if (result) {
    const context = getCoreContext();
    context?.updateItem("warehouses", id, result);
  }

  return result;
};

export const deleteWarehouse = async (id: number) => {
  const result = await apiFetch(`${API_BASE_URL}warehouses/${id}/`, {
    method: "DELETE",
  });

  if (result !== null) {
    const context = getCoreContext();
    context?.deleteItem("warehouses", id);
  }

  return result;
};

// --------------- WarehouseReceipt  ---------------
export const fetchWarehouseReceipts = () =>
  apiFetch<WarehouseReceipt[]>(`${API_BASE_URL}receipts/`);

export const fetchWarehouseReceiptById = (id: number) =>
  apiFetch<WarehouseReceipt>(`${API_BASE_URL}receipts/${id}/`);

export const createWarehouseReceipt = (data: WarehouseReceiptCreate) =>
  apiFetch<WarehouseReceipt>(`${API_BASE_URL}receipts/`, {
    method: "POST",
    body: data,
  });

export const updateWarehouseReceipt = (
  id: number,
  data: Partial<WarehouseReceiptCreate>
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

export const createDispatchIssue = (data: DispatchIssueCreate) =>
  apiFetch<DispatchIssue>(`${API_BASE_URL}dispatches/`, {
    method: "POST",
    body: data,
  });

export const updateDispatchIssue = (
  id: number,
  data: Partial<DispatchIssueCreate>
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

export const createDeliveryFulfillment = (data: DeliveryFulfillmentCreate) =>
  apiFetch<DeliveryFulfillment>(`${API_BASE_URL}deliveries/`, {
    method: "POST",
    body: data,
  });

export const updateDeliveryFulfillment = (
  id: number,
  data: Partial<DeliveryFulfillmentCreate>
) =>
  apiFetch<DeliveryFulfillment>(`${API_BASE_URL}deliveries/${id}/`, {
    method: "PATCH",
    body: data,
  });

export const deleteDeliveryFulfillment = (id: number) =>
  apiFetch(`${API_BASE_URL}deliveries/${id}/`, { method: "DELETE" });
