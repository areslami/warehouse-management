"use client";

import { Sheet, SheetContent, SheetClose, SheetTitle } from "@/components/ui/sheet";
import { ActiveOfferItem } from "@/lib/api/dashboard";
import { formatToman, formatWeight, toPersianDigits } from "@/lib/persian-numbers";
import { Tag, X } from "lucide-react";
import { cn } from "@/lib/utils";
import moment from "moment-jalaali";

const OFFER_TYPE_LABEL: Record<string, string> = {
  cash: "نقدی",
  credit: "اعتباری",
  agreement: "قراردادی",
  other: "سایر",
};

function persianDate(d: string) {
  return toPersianDigits(moment(d, "YYYY-MM-DD").format("jYYYY/jMM/jDD"));
}

interface ActiveOffersSheetProps {
  open: boolean;
  onClose: () => void;
  data: ActiveOfferItem[];
  total: number;
}

export function ActiveOffersSheet({ open, onClose, data, total }: ActiveOffersSheetProps) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="left"
        dir="rtl"
        className="w-full sm:max-w-md overflow-y-auto flex flex-col gap-0 p-0 [&>button]:hidden"
      >
        <SheetTitle className="sr-only">عرضه‌های فعال بازارگاه</SheetTitle>
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-800">عرضه‌های فعال بازارگاه</h2>
            <p className="text-sm font-light text-gray-500 mt-0.5">
              تعداد:{" "}
              <span className="font-semibold text-amber-600">{toPersianDigits(total)} عرضه</span>
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
              <Tag className="w-10 h-10 opacity-40" />
              <p className="text-sm font-light">هیچ عرضه فعالی وجود ندارد</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {data.map((o) => (
                <li key={o.offer_id} className="rounded-xl border border-gray-100 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-amber-50 border-b border-amber-100">
                    <div className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-amber-600" />
                      <span className="text-sm font-semibold text-amber-800">{o.offer_id}</span>
                    </div>
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        o.offer_type === "cash"
                          ? "bg-emerald-100 text-emerald-700"
                          : o.offer_type === "credit"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                      )}
                    >
                      {OFFER_TYPE_LABEL[o.offer_type] ?? o.offer_type}
                    </span>
                  </div>
                  <div className="px-4 py-3 space-y-1.5">
                    <DetailRow label="محصول" value={o.product} />
                    {o.warehouse && <DetailRow label="انبار" value={o.warehouse} />}
                    <DetailRow label="وزن عرضه" value={formatWeight(o.weight)} />
                    <DetailRow label="قیمت واحد" value={formatToman(o.unit_price)} />
                    <DetailRow label="ارزش کل" value={formatToman(o.total_price)} highlight />
                    <DetailRow label="تاریخ عرضه" value={persianDate(o.offer_date)} />
                    <DetailRow label="تاریخ انقضا" value={persianDate(o.exp_date)} />
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
      <span className={cn("text-xs font-medium text-gray-700", highlight && "text-amber-700")}>
        {value}
      </span>
    </div>
  );
}
