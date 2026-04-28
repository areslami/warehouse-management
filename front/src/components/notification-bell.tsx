"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Truck, Tag, CheckCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AppNotification,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/api/notifications";
import { toPersianDigits } from "@/lib/persian-numbers";
import moment from "moment-jalaali";

function persianDatetime(iso: string) {
  return toPersianDigits(moment(iso).format("jYYYY/jMM/jDD - HH:mm"));
}

const POLL_INTERVAL = 60_000; // 1 minute

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unread_count);
    } catch {
      // silently fail — bell is non-critical
    }
  }, []);

  // Initial load + polling
  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [load]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  async function handleMarkRead(id: number) {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  async function handleMarkAll() {
    setLoading(true);
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    setLoading(false);
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "relative p-2 rounded-lg border transition-colors",
          open
            ? "bg-indigo-50 border-indigo-200 text-indigo-600"
            : "bg-white border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600"
        )}
        title="اعلان‌ها"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold leading-none">
            {unreadCount > 9 ? "۹+" : toPersianDigits(unreadCount)}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute left-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 flex flex-col overflow-hidden"
          dir="rtl"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-semibold text-gray-700">اعلان‌ها</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-600 rounded-full">
                  {toPersianDigits(unreadCount)} جدید
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAll}
                  disabled={loading}
                  className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 transition-colors disabled:opacity-50 px-2 py-1 rounded-lg hover:bg-indigo-50"
                  title="همه را خوانده‌شده علامت بزن"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>همه خوانده شد</span>
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-96">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                <Bell className="w-8 h-8 text-gray-200" />
                <p className="text-sm font-medium text-gray-400">اعلانی وجود ندارد</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {notifications.map((n) => (
                  <NotificationRow
                    key={n.id}
                    notification={n}
                    onMarkRead={() => handleMarkRead(n.id)}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationRow({
  notification: n,
  onMarkRead,
}: {
  notification: AppNotification;
  onMarkRead: () => void;
}) {
  const isDispatch = n.entity_type === "dispatch";

  return (
    <li
      className={cn(
        "flex gap-3 px-4 py-3 transition-colors",
        n.is_read
          ? "bg-gray-50/60"
          : "bg-white hover:bg-indigo-50/30 cursor-pointer"
      )}
      onClick={!n.is_read ? onMarkRead : undefined}
    >
      {/* Left colored bar */}
      <div
        className={cn(
          "w-0.5 rounded-full shrink-0 self-stretch",
          n.is_read ? "bg-gray-200" : isDispatch ? "bg-rose-400" : "bg-amber-400"
        )}
      />

      {/* Icon */}
      <div
        className={cn(
          "p-1.5 rounded-lg shrink-0 mt-0.5",
          n.is_read
            ? "bg-gray-100"
            : isDispatch
            ? "bg-rose-50"
            : "bg-amber-50"
        )}
      >
        {isDispatch ? (
          <Truck className={cn("w-3.5 h-3.5", n.is_read ? "text-gray-400" : "text-rose-500")} />
        ) : (
          <Tag className={cn("w-3.5 h-3.5", n.is_read ? "text-gray-400" : "text-amber-500")} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-xs font-semibold leading-snug",
            n.is_read ? "text-gray-400" : "text-gray-700"
          )}
        >
          {n.title}
        </p>
        <p
          className={cn(
            "text-xs mt-0.5 leading-relaxed",
            n.is_read ? "text-gray-400" : "text-gray-500"
          )}
        >
          {n.message}
        </p>
        <p className="text-[10px] text-gray-300 mt-1">{persianDatetime(n.created_at)}</p>
      </div>

      {/* Unread dot */}
      {!n.is_read && (
        <div className="w-2 h-2 rounded-full bg-indigo-400 shrink-0 mt-1.5" />
      )}
    </li>
  );
}
