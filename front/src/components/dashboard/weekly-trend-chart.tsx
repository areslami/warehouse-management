"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { WeeklyTrendPoint } from "@/lib/api/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { toPersianDigits, formatTomanAxis, formatToman } from "@/lib/persian-numbers";
import { cn } from "@/lib/utils";
import moment from "moment-jalaali";

function formatDay(dateStr: string): string {
  return toPersianDigits(moment(dateStr, "YYYY-MM-DD").format("jMM/jDD"));
}

const TOOLTIP_STYLE = {
  direction: "rtl" as const,
  fontFamily: "Vazirmatn, sans-serif",
  fontSize: 12,
  borderRadius: 8,
  border: "1px solid #e5e7eb",
};

const TABS = [
  { id: "weight", label: "وزن (کیلوگرم)" },
  { id: "revenue", label: "درآمد" },
  { id: "offers", label: "عرضه‌ها" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface WeeklyTrendChartProps {
  data: WeeklyTrendPoint[];
  loading?: boolean;
}

export function WeeklyTrendChart({ data, loading = false }: WeeklyTrendChartProps) {
  const [active, setActive] = useState<TabId>("weight");

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-gray-100">
          <Skeleton className="h-5 w-32" />
          <div className="flex gap-2">
            {TABS.map((t) => <Skeleton key={t.id} className="h-7 w-20 rounded-lg" />)}
          </div>
        </div>
        <div className="p-5">
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const chartData = data.map((d) => ({ ...d, label: formatDay(d.date) }));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      {/* Header + tabs */}
      <div className="px-5 pt-4 pb-3 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700">روند هفتگی</h3>
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={cn(
                "px-3 py-1 text-xs rounded-lg font-medium transition-colors",
                active === tab.id
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart area */}
      <div className="px-5 py-5">
        {active === "weight" && (
          <WeightChart data={chartData} />
        )}
        {active === "revenue" && (
          <RevenueChart data={chartData} />
        )}
        {active === "offers" && (
          <OffersChart data={chartData} />
        )}
      </div>
    </div>
  );
}

/* ── Weight: dual line (received vs delivered) ── */
function WeightChart({ data }: { data: (WeeklyTrendPoint & { label: string })[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => toPersianDigits(v.toLocaleString())}
          width={55}
        />
        <Tooltip
          formatter={(value: number, name: string) => [
            `${toPersianDigits(value.toLocaleString())} کیلوگرم`,
            name === "received" ? "دریافت‌شده" : "تحویل‌داده‌شده",
          ]}
          labelFormatter={(l) => `تاریخ: ${l}`}
          contentStyle={TOOLTIP_STYLE}
        />
        <Legend
          formatter={(v) => (v === "received" ? "دریافت‌شده" : "تحویل‌داده‌شده")}
          wrapperStyle={{ fontSize: 12, fontFamily: "Vazirmatn, sans-serif" }}
        />
        <Line type="monotone" dataKey="received" name="received" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        <Line type="monotone" dataKey="delivered" name="delivered" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ── Revenue: bar chart (daily B2BSale totals) ── */
function RevenueChart({ data }: { data: (WeeklyTrendPoint & { label: string })[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => formatTomanAxis(v)}
          width={65}
        />
        <Tooltip
          formatter={(value: number) => [formatToman(value), "درآمد"]}
          labelFormatter={(l) => `تاریخ: ${l}`}
          contentStyle={TOOLTIP_STYLE}
        />
        <Bar dataKey="revenue" name="درآمد" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── Offers: bar chart (daily new offer count) ── */
function OffersChart({ data }: { data: (WeeklyTrendPoint & { label: string })[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => toPersianDigits(v)}
          width={35}
        />
        <Tooltip
          formatter={(value: number) => [toPersianDigits(value), "تعداد عرضه"]}
          labelFormatter={(l) => `تاریخ: ${l}`}
          contentStyle={TOOLTIP_STYLE}
        />
        <Bar dataKey="offers" name="تعداد عرضه" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}
