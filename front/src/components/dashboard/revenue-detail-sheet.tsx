"use client";

import { Sheet, SheetContent, SheetClose, SheetTitle } from "@/components/ui/sheet";
import { RevenueDetail } from "@/lib/api/dashboard";
import { formatToman, toPersianDigits } from "@/lib/persian-numbers";
import { TrendingUp, TrendingDown, Minus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface RevenueDetailSheetProps {
  open: boolean;
  onClose: () => void;
  data: RevenueDetail | undefined;
  pipelineRevenue: number;
}

export function RevenueDetailSheet({ open, onClose, data, pipelineRevenue }: RevenueDetailSheetProps) {
  const net = data?.net ?? 0;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="left"
        dir="rtl"
        className="w-full sm:max-w-md overflow-y-auto flex flex-col gap-0 p-0 [&>button]:hidden"
      >
        <SheetTitle className="sr-only">جزئیات درآمد و هزینه</SheetTitle>
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">جزئیات درآمد و هزینه</h2>
          <SheetClose className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors mt-0.5">
            <X className="w-4 h-4" />
          </SheetClose>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* Summary rows */}
          <div className="space-y-3">
            <SummaryRow
              label="درآمد تحقق‌یافته"
              value={formatToman(data?.total_income ?? 0)}
              icon={<TrendingUp className="w-4 h-4 text-emerald-600" />}
              bg="bg-emerald-50"
              valueColor="text-emerald-700"
            />
            <SummaryRow
              label="پایپ‌لاین فروش"
              value={formatToman(pipelineRevenue)}
              icon={<TrendingUp className="w-4 h-4 text-indigo-500" />}
              bg="bg-indigo-50"
              valueColor="text-indigo-700"
            />
            <SummaryRow
              label="مجموع خرید (هزینه)"
              value={formatToman(data?.total_spent ?? 0)}
              icon={<TrendingDown className="w-4 h-4 text-rose-500" />}
              bg="bg-rose-50"
              valueColor="text-rose-700"
            />
            <div
              className={cn(
                "flex items-center justify-between px-4 py-3 rounded-xl border",
                net >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"
              )}
            >
              <div className="flex items-center gap-2">
                {net === 0 ? (
                  <Minus className="w-4 h-4 text-gray-500" />
                ) : net > 0 ? (
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-rose-600" />
                )}
                <span className="text-sm font-semibold text-gray-700">سود خالص</span>
              </div>
              <span className={cn("text-sm font-bold", net >= 0 ? "text-emerald-700" : "text-rose-700")}>
                {net < 0 ? "−" : "+"}{formatToman(Math.abs(net))}
              </span>
            </div>
          </div>

          {/* Breakdown by product */}
          {(data?.breakdown_by_product?.length ?? 0) > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-3">تفکیک درآمد بر اساس محصول</h3>
              <ul className="space-y-2">
                {data!.breakdown_by_product.map((row) => {
                  const pct =
                    data!.total_income > 0
                      ? Math.round((row.total / data!.total_income) * 100)
                      : 0;
                  return (
                    <li key={row.product} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 truncate">{row.product}</p>
                        <div className="mt-1 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium text-gray-800">{formatToman(row.total)}</p>
                        <p className="text-xs font-light text-gray-400">{toPersianDigits(pct)}٪</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SummaryRow({
  label,
  value,
  icon,
  bg,
  valueColor,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  bg: string;
  valueColor: string;
}) {
  return (
    <div className={cn("flex items-center justify-between px-4 py-3 rounded-xl", bg)}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-light text-gray-600">{label}</span>
      </div>
      <span className={cn("text-sm font-semibold", valueColor)}>{value}</span>
    </div>
  );
}
