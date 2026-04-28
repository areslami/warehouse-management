import { getApiBaseUrl } from "./config";

export interface AppNotification {
  id: number;
  entity_type: "dispatch" | "offer";
  entity_id: string;
  title: string;
  message: string;
  deadline: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationsResponse {
  notifications: AppNotification[];
  unread_count: number;
}

export async function fetchNotifications(): Promise<NotificationsResponse> {
  const res = await fetch(`${getApiBaseUrl()}notifications/`);
  if (!res.ok) throw new Error(`Notifications fetch failed: ${res.status}`);
  return res.json();
}

export async function markNotificationRead(id: number): Promise<void> {
  await fetch(`${getApiBaseUrl()}notifications/${id}/read/`, { method: "PATCH" });
}

export async function markAllNotificationsRead(): Promise<void> {
  await fetch(`${getApiBaseUrl()}notifications/read-all/`, { method: "PATCH" });
}
