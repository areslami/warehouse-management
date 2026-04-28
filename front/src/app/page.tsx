"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Package,
  Truck,
  Tag,
  AlertCircle,
  Plus,
  Search,
  RefreshCw,
} from "lucide-react";

import { fetchDashboardSummary, DashboardSummary } from "@/lib/api/dashboard";
import { formatToman, formatWeight, toPersianDigits } from "@/lib/persian-numbers";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { WeeklyTrendChart } from "@/components/dashboard/weekly-trend-chart";
import { CommandBar } from "@/components/dashboard/command-bar";
import { DeadlinePanel } from "@/components/dashboard/deadline-panel";
import { InventoryDetailSheet } from "@/components/dashboard/inventory-detail-sheet";
import { RevenueDetailSheet } from "@/components/dashboard/revenue-detail-sheet";
import { ActiveOffersSheet } from "@/components/dashboard/active-offers-sheet";
import { PendingDispatchesSheet } from "@/components/dashboard/pending-dispatches-sheet";
import { useModal } from "@/lib/modal-context";
import { WarehouseReceiptModal } from "@/components/modals/warehouse/warehouse-receipt-modal";
import { DispatchIssueModal } from "@/components/modals/warehouse/dispatch-issue-modal";
import { B2BOfferModal } from "@/components/modals/b2b/b2b-offer-modal";
import { createWarehouseReceipt, createDispatchIssue } from "@/lib/api/warehouse";
import { createB2BOffer } from "@/lib/api/b2b";
import { NotificationBell } from "@/components/notification-bell";


export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [revenueOpen, setRevenueOpen] = useState(false);
  const [offersOpen, setOffersOpen] = useState(false);
  const [dispatchesOpen, setDispatchesOpen] = useState(false);
  const { openModal } = useModal();
  const router = useRouter();

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await fetchDashboardSummary();
      setData(result);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const revenueTooltip = data?.revenue_breakdown?.length ? (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium text-gray-700 mb-1">تفکیک درآمد بر اساس محصول:</p>
      {data.revenue_breakdown.map((row) => {
        const pct = data.realized_revenue
          ? Math.round((row.total / data.realized_revenue) * 100)
          : 0;
        return (
          <div key={row.product} className="flex items-center justify-between gap-4 text-xs">
            <span className="font-light text-gray-600">{row.product}</span>
            <span className="font-medium text-indigo-600">{toPersianDigits(pct)}٪</span>
          </div>
        );
      })}
    </div>
  ) : undefined;

  return (
    <div className="flex-1 min-h-screen bg-gray-50" dir="rtl">
      <CommandBar open={cmdOpen} onClose={() => setCmdOpen(false)} />
      <ActiveOffersSheet
        open={offersOpen}
        onClose={() => setOffersOpen(false)}
        data={data?.active_offers_detail ?? []}
        total={data?.active_offers ?? 0}
      />
      <PendingDispatchesSheet
        open={dispatchesOpen}
        onClose={() => setDispatchesOpen(false)}
        data={data?.pending_dispatches_detail ?? []}
        total={data?.pending_dispatches ?? 0}
      />
      <InventoryDetailSheet
        open={inventoryOpen}
        onClose={() => setInventoryOpen(false)}
        data={data?.inventory_detail ?? []}
        totalWeight={data?.stock_weight ?? 0}
      />
      <RevenueDetailSheet
        open={revenueOpen}
        onClose={() => setRevenueOpen(false)}
        data={data?.revenue_detail}
        pipelineRevenue={data?.pipeline_revenue ?? 0}
      />

      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-50/80 backdrop-blur-sm border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-800">داشبورد مدیریت</h1>
          <p className="text-xs font-light text-gray-400">نمای کلی عملیات شمس</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCmdOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-light text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span>جستجو</span>
            <kbd className="hidden sm:inline text-xs bg-gray-100 px-1.5 py-0.5 rounded">⌘K</kbd>
          </button>
          <NotificationBell />
          <button
            onClick={load}
            disabled={loading}
            className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors disabled:opacity-50"
            title="بارگذاری مجدد"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>خطا در بارگذاری داشبورد. لطفاً دوباره تلاش کنید.</span>
          </div>
        )}

        {/* ── KPI Row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            title="درآمد تحقق‌یافته"
            value={loading ? "…" : formatToman(data?.realized_revenue ?? 0)}
            subtitle={
              loading
                ? undefined
                : `پایپ‌لاین: ${formatToman(data?.pipeline_revenue ?? 0)}`
            }
            icon={<TrendingUp className="w-5 h-5 text-indigo-600" />}
            iconBg="bg-indigo-100"
            loading={loading}
            tooltip={revenueTooltip}
            emphasis
            onClick={!loading ? () => setRevenueOpen(true) : undefined}
          />
          <KpiCard
            title="موجودی انبار"
            value={loading ? "…" : formatWeight(data?.stock_weight ?? 0)}
            subtitle={loading ? undefined : "برای جزئیات کلیک کنید"}
            icon={<Package className="w-5 h-5 text-emerald-600" />}
            iconBg="bg-emerald-100"
            loading={loading}
            onClick={!loading ? () => setInventoryOpen(true) : undefined}
          />
          <KpiCard
            title="عرضه‌های فعال"
            value={loading ? "…" : toPersianDigits(data?.active_offers ?? 0)}
            subtitle={loading ? undefined : "برای جزئیات کلیک کنید"}
            icon={<Tag className="w-5 h-5 text-amber-600" />}
            iconBg="bg-amber-100"
            loading={loading}
            onClick={!loading ? () => setOffersOpen(true) : undefined}
          />
          <KpiCard
            title="حواله‌های معلق"
            value={loading ? "…" : toPersianDigits(data?.pending_dispatches ?? 0)}
            subtitle={loading ? undefined : "برای جزئیات کلیک کنید"}
            icon={<Truck className="w-5 h-5 text-rose-600" />}
            iconBg="bg-rose-100"
            loading={loading}
            onClick={!loading ? () => setDispatchesOpen(true) : undefined}
          />
        </div>

        {/* ── Main Row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <DeadlinePanel
            items={data?.deadline_items ?? []}
            loading={loading}
            onNavigate={(filter) => {
              if (filter === "offer") router.push("/b2b");
              else router.push("/warehouse?tab=dispatches");
            }}
          />

          {/* Quick Actions – 40% */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700">دسترسی سریع</h2>
            </div>
            <div className="p-5 flex flex-col gap-3">
              <QuickActionButton
                label="رسید انبار جدید"
                description="ثبت کالای وارده"
                icon={<Package className="w-4 h-4" />}
                color="indigo"
                onClick={() =>
                  openModal(WarehouseReceiptModal, {
                    onSubmit: async (formData: Parameters<typeof createWarehouseReceipt>[0]) => {
                      await createWarehouseReceipt(formData);
                    },
                  })
                }
              />
              <QuickActionButton
                label="صدور حواله"
                description="اجازه ارسال محموله"
                icon={<Truck className="w-4 h-4" />}
                color="emerald"
                onClick={() =>
                  openModal(DispatchIssueModal, {
                    onSubmit: async (formData: Parameters<typeof createDispatchIssue>[0]) => {
                      await createDispatchIssue(formData);
                    },
                  })
                }
              />
              <QuickActionButton
                label="ایجاد عرضه بازارگاه"
                description="عرضه کالا در بازارگاه"
                icon={<Tag className="w-4 h-4" />}
                color="amber"
                onClick={() =>
                  openModal(B2BOfferModal, {
                    onSubmit: async (formData: Parameters<typeof createB2BOffer>[0]) => {
                      await createB2BOffer(formData);
                    },
                  })
                }
              />
              <button
                onClick={() => router.push("/finance")}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-gray-200 text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors text-sm font-light"
              >
                <Plus className="w-4 h-4" />
                <span>پروفورما فروش</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Chart Row ── */}
        <WeeklyTrendChart
          data={data?.weekly_trend ?? []}
          loading={loading}
        />
      </div>
    </div>
  );
}

interface QuickActionButtonProps {
  label: string;
  description: string;
  icon: React.ReactNode;
  color: "indigo" | "emerald" | "amber";
  onClick: () => void;
}

const COLOR_MAP = {
  indigo: {
    btn: "bg-indigo-50 hover:bg-indigo-100 border-indigo-100",
    icon: "text-indigo-600 bg-indigo-100",
    label: "text-indigo-700",
  },
  emerald: {
    btn: "bg-emerald-50 hover:bg-emerald-100 border-emerald-100",
    icon: "text-emerald-600 bg-emerald-100",
    label: "text-emerald-700",
  },
  amber: {
    btn: "bg-amber-50 hover:bg-amber-100 border-amber-100",
    icon: "text-amber-600 bg-amber-100",
    label: "text-amber-700",
  },
};

function QuickActionButton({ label, description, icon, color, onClick }: QuickActionButtonProps) {
  const c = COLOR_MAP[color];
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-right w-full ${c.btn}`}
    >
      <div className={`p-2 rounded-lg shrink-0 ${c.icon}`}>{icon}</div>
      <div className="flex flex-col items-start">
        <span className={`text-sm font-medium ${c.label}`}>{label}</span>
        <span className="text-xs font-light text-gray-400">{description}</span>
      </div>
    </button>
  );
}
