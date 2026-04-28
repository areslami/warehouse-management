"use client";

import { DeadlineItem } from "@/lib/api/dashboard";
import { formatWeight, toPersianDigits } from "@/lib/persian-numbers";
import { CheckCircle2, Truck, Tag, AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import moment from "moment-jalaali";
import { useState } from "react";

function persianDate(d: string) {
  return toPersianDigits(moment(d, "YYYY-MM-DD").format("jYYYY/jMM/jDD"));
}

const TYPE_FILTERS = [
  { id: "all", label: "همه" },
  { id: "dispatch", label: "حواله" },
  { id: "offer", label: "عرضه" },
] as const;
type FilterId = (typeof TYPE_FILTERS)[number]["id"];

interface DeadlinePanelProps {
  items: DeadlineItem[];
  loading?: boolean;
  onNavigate: (filter: FilterId) => void;
}

export function DeadlinePanel({ items, loading = false, onNavigate }: DeadlinePanelProps) {
  const [filter, setFilter] = useState<FilterId>("all");

  const filtered = filter === "all" ? items : items.filter((i) => i.type === filter);

  if (loading) {
    return (
      <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="h-4 w-32 bg-gray-100 animate-pulse rounded" />
        </div>
        <div className="p-5 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex-1 h-4 bg-gray-100 animate-pulse rounded" />
              <div className="h-4 w-16 bg-gray-100 animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-sm font-semibold text-gray-700">موارد نزدیک به سررسید</h2>

        <div className="flex items-center gap-2">
          {/* Type filter pills */}
          <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "px-2.5 py-1 text-xs rounded-md font-medium transition-colors",
                  filter === f.id
                    ? "bg-white text-gray-800 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => onNavigate(filter)}
            className="text-xs font-light text-indigo-500 hover:text-indigo-700 transition-colors"
          >
            مشاهده همه
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            <p className="text-sm font-medium text-gray-600">همه چیز به‌روز است!</p>
            <p className="text-xs font-light text-gray-400">هیچ موردی در ۱۴ روز آینده سررسید ندارد.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {filtered.map((item) => (
              <DeadlineRow key={item.id} item={item} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function DeadlineRow({ item }: { item: DeadlineItem }) {
  const urgency =
    item.is_overdue
      ? "overdue"
      : item.days_left <= 3
      ? "critical"
      : item.days_left <= 7
      ? "warning"
      : "normal";

  const dotColor = {
    overdue: "bg-rose-500",
    critical: "bg-orange-400",
    warning: "bg-amber-400",
    normal: "bg-blue-400",
  }[urgency];

  const deadlineColor = {
    overdue: "text-rose-600",
    critical: "text-orange-500",
    warning: "text-amber-600",
    normal: "text-gray-400",
  }[urgency];

  const daysLabel = item.is_overdue
    ? `${toPersianDigits(Math.abs(item.days_left))} روز گذشته`
    : item.days_left === 0
    ? "امروز"
    : `${toPersianDigits(item.days_left)} روز مانده`;

  return (
    <li className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
      {/* Type icon */}
      <div className={cn("p-1.5 rounded-lg shrink-0", item.type === "dispatch" ? "bg-rose-50" : "bg-amber-50")}>
        {item.type === "dispatch" ? (
          <Truck className="w-3.5 h-3.5 text-rose-500" />
        ) : (
          <Tag className="w-3.5 h-3.5 text-amber-500" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColor)} />
          <p className="text-sm font-medium text-gray-700 truncate">
            {item.label}
            {item.customer ? ` — ${item.customer}` : ""}
            {item.product ? ` — ${item.product}` : ""}
          </p>
        </div>
        <p className="text-xs font-light text-gray-400 mt-0.5 pr-3">
          {item.warehouse && `${item.warehouse} · `}
          {formatWeight(item.weight)}
        </p>
      </div>

      {/* Deadline info */}
      <div className="text-left shrink-0 flex flex-col items-end gap-0.5">
        <span className={cn("text-xs font-medium", deadlineColor)}>
          {item.is_overdue ? (
            <span className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {daysLabel}
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {daysLabel}
            </span>
          )}
        </span>
        <span className="text-xs font-light text-gray-400">{persianDate(item.deadline)}</span>
      </div>
    </li>
  );
}
