"use client";

import { useEffect, useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { handleApiErrorWithToast } from "@/lib/api/error-toast-handler";
import { toast } from "@/lib/toast-helper";
import { formatNumber } from "@/lib/utils/number-format";
import { Plus, Edit, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { useModal } from "@/lib/modal-context";
import { useCoreData } from "@/lib/core-data-context";
import { PurchaseProformaModal } from "@/components/modals/finance/purchaseproforma-modal";
import { PurchaseProforma } from "@/lib/interfaces/finance";
import { createPurchaseProforma, updatePurchaseProforma, deletePurchaseProforma } from "@/lib/api/finance";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";
import { buildIndicatorPreview } from "@/lib/indicator-format";
import { renderLocalizedValue } from "@/lib/utils/localized-value";

export function PurchaseProformaTab() {
  const t = useTranslations("modals.purchaseProforma");
  const tCommon = useTranslations("common");
  const { openModal } = useModal();
  const { data, refreshData } = useCoreData();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    serial_number: "",
    supplier_name: "",
    date_from: "",
    date_to: "",
    subtotal_min: "",
    subtotal_max: "",
    tax_min: "",
    tax_max: "",
    discount_min: "",
    discount_max: "",
    final_price_min: "",
    final_price_max: "",
  });

  useEffect(() => {
    if (data.purchaseProformas.length === 0) {
      refreshData('purchaseProformas');
    }
  }, [data.purchaseProformas.length, refreshData]);

  const filteredProformas = useMemo(() => {
    return data.purchaseProformas.filter(p => {
      if (filters.serial_number && !p.serial_number.toLowerCase().includes(filters.serial_number.toLowerCase())) return false;
      if (filters.supplier_name && !(p.supplier_name || "").toLowerCase().includes(filters.supplier_name.toLowerCase())) return false;

      const df = filters.date_from ? new Date(filters.date_from).getTime() : 0;
      const dt = filters.date_to ? new Date(filters.date_to).getTime() : 0;
      const d = p.date ? new Date(p.date).getTime() : 0;
      if (df && d < df) return false;
      if (dt && d > dt) return false;

      const smin = filters.subtotal_min ? Number(filters.subtotal_min) : -Infinity;
      const smax = filters.subtotal_max ? Number(filters.subtotal_max) : Infinity;
      if (p.subtotal < smin || p.subtotal > smax) return false;

      const tmin = filters.tax_min ? Number(filters.tax_min) : -Infinity;
      const tmax = filters.tax_max ? Number(filters.tax_max) : Infinity;
      if (p.tax < tmin || p.tax > tmax) return false;

      const dmin = filters.discount_min ? Number(filters.discount_min) : -Infinity;
      const dmax = filters.discount_max ? Number(filters.discount_max) : Infinity;
      if (p.discount < dmin || p.discount > dmax) return false;

      const fmin = filters.final_price_min ? Number(filters.final_price_min) : -Infinity;
      const fmax = filters.final_price_max ? Number(filters.final_price_max) : Infinity;
      if (p.final_price < fmin || p.final_price > fmax) return false;

      return true;
    });
  }, [data.purchaseProformas, filters]);

  const handleCreate = () => {
    openModal(PurchaseProformaModal, {
      onSubmit: async (formData) => {
        try {
          await createPurchaseProforma(formData);
          await refreshData('purchaseProformas');
          toast.success(tCommon("toast_messages.create_success"));
        } catch (error) {
          console.error("Failed to create purchase proforma:", error);
          handleApiErrorWithToast(error, "Creating purchase proforma");
          
        }
      }
    });
  };

  const handleEdit = (proforma: PurchaseProforma) => {
    openModal(PurchaseProformaModal, {
      initialData: proforma,
      onSubmit: async (formData) => {
        try {
          await updatePurchaseProforma(proforma.id, formData);
          await refreshData('purchaseProformas');
          toast.success(tCommon("toast_messages.update_success"));
        } catch (error) {
          console.error("Failed to update purchase proforma:", error);
          handleApiErrorWithToast(error, "Updating purchase proforma");
          
        }
      }
    });
  };

  const handleDelete = async (id: number) => {
    if (confirm(t("confirm_delete"))) {
      try {
        await deletePurchaseProforma(id);
        await refreshData('purchaseProformas');
        toast.success(tCommon("toast_messages.delete_success"));
      } catch (error) {
        console.error("Failed to delete purchase proforma:", error);
        handleApiErrorWithToast(error, "Deleting purchase proforma");
        
      }
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{t("purchase_proformas")}</h3>
        <Button
          className="bg-[#f6d265] hover:bg-[#f5c842] text-white"
          onClick={handleCreate}
        >
          <Plus className="ml-2 h-4 w-4" />
          {t("add_purchase_proforma")}
        </Button>
      </div>

      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <div className="flex justify-end mb-3">
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              {tCommon('filters')}
              {filtersOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent dir="rtl">
          <div className="bg-white border rounded-md p-4 space-y-4 mb-4">
            <div className="grid grid-cols-6 gap-4">
              <div>
                <div className="text-sm font-medium mb-1">{t("serial_number")}</div>
                <Input value={filters.serial_number} onChange={e => setFilters({ ...filters, serial_number: e.target.value })} />
              </div>
              <div>
                <div className="text-sm font-medium mb-1">{t("supplier")}</div>
                <Input value={filters.supplier_name} onChange={e => setFilters({ ...filters, supplier_name: e.target.value })} />
              </div>
              <div>
                <div className="text-sm font-medium mb-1">تاریخ از</div>
                <PersianDatePicker value={filters.date_from} onChange={(v) => setFilters({ ...filters, date_from: v })} />
              </div>
              <div>
                <div className="text-sm font-medium mb-1">تاریخ تا</div>
                <PersianDatePicker value={filters.date_to} onChange={(v) => setFilters({ ...filters, date_to: v })} />
              </div>
              <div>
                <div className="text-sm font-medium mb-1">مجموع</div>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="حداقل" value={filters.subtotal_min} onChange={e => setFilters({ ...filters, subtotal_min: e.target.value })} />
                  <Input placeholder="حداکثر" value={filters.subtotal_max} onChange={e => setFilters({ ...filters, subtotal_max: e.target.value })} />
                </div>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">مالیات</div>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="حداقل" value={filters.tax_min} onChange={e => setFilters({ ...filters, tax_min: e.target.value })} />
                  <Input placeholder="حداکثر" value={filters.tax_max} onChange={e => setFilters({ ...filters, tax_max: e.target.value })} />
                </div>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">تخفیف</div>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="حداقل" value={filters.discount_min} onChange={e => setFilters({ ...filters, discount_min: e.target.value })} />
                  <Input placeholder="حداکثر" value={filters.discount_max} onChange={e => setFilters({ ...filters, discount_max: e.target.value })} />
                </div>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">{t("total_amount")}</div>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="حداقل" value={filters.final_price_min} onChange={e => setFilters({ ...filters, final_price_min: e.target.value })} />
                  <Input placeholder="حداکثر" value={filters.final_price_max} onChange={e => setFilters({ ...filters, final_price_max: e.target.value })} />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end mb-4">
            <Button className="bg-red-100 text-red-700 hover:bg-red-200" onClick={() => setFilters({
              serial_number: "",
              supplier_name: "",
              date_from: "",
              date_to: "",
              subtotal_min: "",
              subtotal_max: "",
              tax_min: "",
              tax_max: "",
              discount_min: "",
              discount_max: "",
              final_price_min: "",
              final_price_max: "",
            })}>ریست</Button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Table>
        <TableCaption>{t("table_caption")}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">{t("serial_number")}</TableHead>
            <TableHead className="text-right">{t("supplier")}</TableHead>
            <TableHead className="text-right">{t("date")}</TableHead>
            <TableHead className="text-right">{t("total_amount")}</TableHead>
            <TableHead className="text-right">{t("status")}</TableHead>
            <TableHead className="text-right">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredProformas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-gray-500">
                {t("no_proformas")}
              </TableCell>
            </TableRow>
          ) : (
            filteredProformas.map((proforma) => (
              <TableRow key={proforma.id}>
                <TableCell className="font-medium" dir="rtl">
                  {renderLocalizedValue(
                    "",
                    buildIndicatorPreview(proforma.serial_number || "", {})?.parts.map((part, partIndex) => (
                      <bdi
                        key={`purchase-proforma-${proforma.id}-${partIndex}`}
                        dir="auto"
                        style={{ unicodeBidi: "plaintext" }}
                        className="leading-none"
                      >
                        {part}
                      </bdi>
                    )),
                    "font-mono"
                  )}
                </TableCell>
                <TableCell>{proforma.supplier}</TableCell>
                <TableCell>{proforma.date}</TableCell>
                <TableCell>{proforma.final_price ? formatNumber(proforma.final_price) : '-'}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-xs ${proforma.status === 'Active' ? 'bg-green-100 text-green-800' :
                    proforma.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                    {t(`status_${proforma.status || 'draft'}`)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(proforma)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(proforma.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}