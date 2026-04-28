"use client";

import { Sheet, SheetContent, SheetClose, SheetTitle } from "@/components/ui/sheet";
import { PendingDispatchItem } from "@/lib/api/dashboard";
import { formatWeight, toPersianDigits } from "@/lib/persian-numbers";
import { Truck, AlertTriangle, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import moment from "moment-jalaali";

function persianDate(d: string) {
  return toPersianDigits(moment(d, "YYYY-MM-DD").format("jYYYY/jMM/jDD"));
}

interface PendingDispatchesSheetProps {
  open: boolean;
  onClose: () => void;
  data: PendingDispatchItem[];
  total: number;
}

export function PendingDispatchesSheet({ open, onClose, data, total }: PendingDispatchesSheetProps) {
  const overdueCount = data.filter((d) => d.is_overdue).length;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="left"
        dir="rtl"
        className="w-full sm:max-w-md overflow-y-auto flex flex-col gap-0 p-0 [&>button]:hidden"
      >
        <SheetTitle className="sr-only">حواله‌های معلق</SheetTitle>
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-800">حواله‌های معلق</h2>
            <div className="flex items-center gap-3 mt-0.5 text-sm">
              <span className="font-light text-gray-500">
                کل: <span className="font-semibold text-rose-600">{toPersianDigits(total)}</span>
              </span>
              {overdueCount > 0 && (
                <span className="flex items-center gap-1 font-light text-gray-500">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                  منقضی: <span className="font-semibold text-rose-600">{toPersianDigits(overdueCount)}</span>
                </span>
              )}
            </div>
          </div>
          <SheetClose className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors mt-0.5">
            <X className="w-4 h-4" />
          </SheetClose>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
              <Truck className="w-10 h-10 opacity-40" />
              <p className="text-sm font-light">هیچ حواله معلقی وجود ندارد</p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {data.map((d) => (
                <li
                  key={d.dispatch_id}
                  className={cn(
                    "rounded-xl border overflow-hidden",
                    d.is_overdue ? "border-rose-200" : "border-gray-100"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-between px-4 py-2.5 border-b",
                      d.is_overdue ? "bg-rose-50 border-rose-100" : "bg-gray-50 border-gray-100"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {d.is_overdue ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                      )}
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          d.is_overdue ? "text-rose-800" : "text-gray-700"
                        )}
                      >
                        {d.dispatch_id}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        d.is_overdue ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"
                      )}
                    >
                      {d.is_overdue ? "منقضی" : "فعال"}
                    </span>
                  </div>
                  <div className="px-4 py-3 space-y-1.5">
                    {d.customer && <DetailRow label="مشتری" value={d.customer} />}
                    {d.warehouse && <DetailRow label="انبار" value={d.warehouse} />}
                    <DetailRow label="وزن" value={formatWeight(d.total_weight)} />
                    <DetailRow label="تاریخ صدور" value={persianDate(d.issue_date)} />
                    <DetailRow
                      label="اعتبار تا"
                      value={persianDate(d.validity_date)}
                      highlight={d.is_overdue}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs font-light text-gray-400">{label}</span>
      <span className={cn("text-xs font-medium text-gray-700", highlight && "text-rose-600")}>
        {value}
      </span>
    </div>
  );
}
