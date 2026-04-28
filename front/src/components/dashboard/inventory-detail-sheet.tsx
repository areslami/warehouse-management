"use client";

import { Sheet, SheetContent, SheetClose, SheetTitle } from "@/components/ui/sheet";
import { InventoryWarehouse } from "@/lib/api/dashboard";
import { formatWeight, toPersianDigits } from "@/lib/persian-numbers";
import { Package, Warehouse, X } from "lucide-react";

interface InventoryDetailSheetProps {
  open: boolean;
  onClose: () => void;
  data: InventoryWarehouse[];
  totalWeight: number;
}

export function InventoryDetailSheet({ open, onClose, data, totalWeight }: InventoryDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="left"
        dir="rtl"
        className="w-full sm:max-w-md overflow-y-auto flex flex-col gap-0 p-0 [&>button]:hidden"
      >
        <SheetTitle className="sr-only">جزئیات موجودی انبار</SheetTitle>
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-800">جزئیات موجودی انبار</h2>
            <p className="text-sm font-light text-gray-500 mt-0.5">
              موجودی کل:{" "}
              <span className="font-semibold text-emerald-600">{formatWeight(totalWeight)}</span>
            </p>
          </div>
          <SheetClose className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors mt-0.5">
            <X className="w-4 h-4" />
          </SheetClose>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
              <Package className="w-10 h-10 opacity-40" />
              <p className="text-sm font-light">داده‌ای برای نمایش وجود ندارد</p>
            </div>
          ) : (
            <div className="space-y-5">
              {data.map((wh) => {
                const whTotal = wh.products.reduce((s, p) => s + p.weight, 0);
                return (
                  <div key={wh.warehouse} className="rounded-xl border border-gray-100 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 border-b border-emerald-100">
                      <div className="flex items-center gap-2">
                        <Warehouse className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-semibold text-emerald-800">{wh.warehouse}</span>
                      </div>
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                        {formatWeight(whTotal)}
                      </span>
                    </div>
                    <ul className="divide-y divide-gray-50">
                      {wh.products.map((p) => {
                        const pct = whTotal > 0 ? Math.round((p.weight / whTotal) * 100) : 0;
                        return (
                          <li key={p.product} className="px-4 py-2.5 flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-700 truncate">{p.product}</p>
                              <div className="mt-1 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-medium text-gray-800">{formatWeight(p.weight)}</p>
                              <p className="text-xs font-light text-gray-400">{toPersianDigits(pct)}٪</p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
