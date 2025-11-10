'use client';

import { useCallback, useEffect, useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell, TableRow as TableRowComponent } from "@/components/ui/table";
import { handleApiErrorWithToast } from "@/lib/api/error-toast-handler";
import { PersianDateTableCell } from "@/components/ui/persian-date-table-cell";
import { WarehouseReceipt as WarehouseReceiptType } from "@/lib/interfaces/warehouse";
import {
  fetchWarehouseReceipts,
  fetchWarehouseReceiptById,
  createWarehouseReceipt,
  updateWarehouseReceipt,
  deleteWarehouseReceipt
} from "@/lib/api/warehouse";
import { useModal } from "@/lib/modal-context";
import { toast } from "@/lib/toast-helper";
import { WarehouseReceiptModal } from "@/components/modals/warehouse/warehouse-receipt-modal";
import {
  filterByWarehouse,
} from "@/lib/utils/warehouse-utils";
import { formatNumber, convertEnglishToPersianNumbers } from "@/lib/utils/number-format";
import { Button } from "../ui/button";
import { Edit, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { Input } from "../ui/input";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";

interface WarehouseReceiptTabProps {
  selectedWarehouseId?: number;
}

export function WarehouseReceiptTab({ selectedWarehouseId }: WarehouseReceiptTabProps) {
  const t = useTranslations("pages.warehouse.receipts");
  const tReceipt = useTranslations("modals.warehouseReceipt");
  const tCommon = useTranslations("common");
  const { openModal } = useModal();
  const [receipts, setReceipts] = useState<WarehouseReceiptType[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    receipt_id: "",
    receipt_type: "",
    warehouse_name: "",
    date_from: "",
    date_to: "",
    weight_min: "",
    weight_max: "",
    cottage_serial_number: "",
    proforma_serial: "",
  });

  const toPersianDigits = (value: string | number | null | undefined, fallback = "") => {
    if (value === null || value === undefined || value === "") return fallback;
    return convertEnglishToPersianNumbers(String(value));
  };

  const loadReceipts = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedReceipts = await fetchWarehouseReceipts();
      if (fetchedReceipts) {
        const filtered = filterByWarehouse(fetchedReceipts, selectedWarehouseId);
        setReceipts(filtered);
      }
    } catch (error) {
      console.error('Failed to load receipts:', error);
      handleApiErrorWithToast(error, "Loading warehouse receipts");
      
    } finally {
      setLoading(false);
    }
  }, [selectedWarehouseId]);

  useEffect(() => {
    loadReceipts();
  }, [selectedWarehouseId, loadReceipts]);

  const filteredReceipts = useMemo(() => {
    return receipts.filter(r => {
      if (filters.receipt_id && !(r.receipt_id || "").toLowerCase().includes(filters.receipt_id.toLowerCase())) return false;
      if (filters.receipt_type && r.receipt_type !== filters.receipt_type) return false;
      if (filters.warehouse_name && !(r.warehouse_name || "").toLowerCase().includes(filters.warehouse_name.toLowerCase())) return false;
      if (filters.cottage_serial_number && !(r.cottage_serial_number || "").toLowerCase().includes(filters.cottage_serial_number.toLowerCase())) return false;
      if (filters.proforma_serial && !(r.proforma_serial || "").toLowerCase().includes(filters.proforma_serial.toLowerCase())) return false;

      const df = filters.date_from ? new Date(filters.date_from).getTime() : 0;
      const dt = filters.date_to ? new Date(filters.date_to).getTime() : 0;
      const d = r.date ? new Date(r.date).getTime() : 0;
      if (df && d < df) return false;
      if (dt && d > dt) return false;

      const wmin = filters.weight_min ? Number(filters.weight_min) : -Infinity;
      const wmax = filters.weight_max ? Number(filters.weight_max) : Infinity;
      if (r.total_weight < wmin || r.total_weight > wmax) return false;

      return true;
    });
  }, [receipts, filters]);

  const getReceiptTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'import_cottage': tReceipt('type-import'),
      'distribution_cottage': tReceipt('type-distribution'),
      'purchase': tReceipt('type-purchase')
    };
    return typeMap[type] || type;
  };

  const handleCreate = () => {
    openModal(WarehouseReceiptModal, {
      onSubmit: async (data) => {
        try {
          await createWarehouseReceipt(data);
          await loadReceipts();
          toast.success(tCommon("toast_messages.create_success"));
        } catch (error) {
          console.error("Failed to create receipt:", error);
          handleApiErrorWithToast(error, "Creating warehouse receipt");
          
        }
      }
    });
  };

  const handleEdit = async (receipt: WarehouseReceiptType) => {
    try {
      const detailedReceipt = await fetchWarehouseReceiptById(receipt.id);
      if (detailedReceipt) {
        openModal(WarehouseReceiptModal, {
          initialData: {
            id: detailedReceipt.id,
            receipt_id: detailedReceipt.receipt_id || "",
            receipt_type: detailedReceipt.receipt_type,
            date: detailedReceipt.date,
            warehouse: detailedReceipt.warehouse || 0,
            description: detailedReceipt.description,
            cottage_serial_number: detailedReceipt.cottage_serial_number || "",
            proforma: (typeof detailedReceipt.proforma === 'number') ? detailedReceipt.proforma : 0,
            items: detailedReceipt.items?.map(item => ({
              product: item.product || 0,
              weight: item.weight || 0
            })) || []
          },
          onSubmit: async (data) => {
            await updateWarehouseReceipt(receipt.id, data);
            await loadReceipts();
            toast.success(tCommon("toast_messages.update_success"));
          }
        });
      }
    } catch (error) {
      console.error("Failed to fetch receipt details:", error);
      handleApiErrorWithToast(error, "Fetching receipt details");

    }
  };

  const handleDelete = async (receipt: WarehouseReceiptType) => {
    if (confirm(t("confirm_delete"))) {
      try {
        await deleteWarehouseReceipt(receipt.id);
        await loadReceipts();
        toast.success(tCommon("toast_messages.delete_success"));
      } catch (error) {
        console.error("Failed to delete receipt:", error);
        handleApiErrorWithToast(error, "Deleting warehouse receipt");
        
      }
    }
  };

  return (
    <div className="p-4 h-full" dir="rtl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{t("title")}</h3>
        <div className="flex gap-2 items-center">
          <Button
            className="bg-[#f6d265] hover:bg-[#f5c842] text-white"
            onClick={handleCreate}
          >
            <Plus className="ml-2 h-4 w-4" />
            {t("new_issue")}
          </Button>
        </div>
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
                <div className="text-sm font-medium mb-1">{t("table.receipt_id")}</div>
                <Input value={filters.receipt_id} onChange={e => setFilters({ ...filters, receipt_id: e.target.value })} />
              </div>
              <div>
                <div className="text-sm font-medium mb-1">{t("table.receipt_type")}</div>
                <SearchableSelect
                  options={[
                    { value: '', label: 'همه انواع رسید' },
                    { value: 'import_cottage', label: tReceipt('type-import') },
                    { value: 'distribution_cottage', label: tReceipt('type-distribution') },
                    { value: 'purchase', label: tReceipt('type-purchase') }
                  ]}
                  value={filters.receipt_type}
                  onValueChange={(v) => setFilters({ ...filters, receipt_type: v })}
                />
              </div>
              <div>
                <div className="text-sm font-medium mb-1">{t("table.warehouse")}</div>
                <Input value={filters.warehouse_name} onChange={e => setFilters({ ...filters, warehouse_name: e.target.value })} />
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
                <div className="text-sm font-medium mb-1">{t("table.total_weight")}</div>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="حداقل" value={filters.weight_min} onChange={e => setFilters({ ...filters, weight_min: e.target.value })} />
                  <Input placeholder="حداکثر" value={filters.weight_max} onChange={e => setFilters({ ...filters, weight_max: e.target.value })} />
                </div>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">شماره سریال کلبه</div>
                <Input value={filters.cottage_serial_number} onChange={e => setFilters({ ...filters, cottage_serial_number: e.target.value })} />
              </div>
              <div>
                <div className="text-sm font-medium mb-1">شماره پیش‌فاکتور</div>
                <Input value={filters.proforma_serial} onChange={e => setFilters({ ...filters, proforma_serial: e.target.value })} />
              </div>
            </div>
          </div>
          <div className="flex justify-end mb-4">
            <Button className="bg-red-100 text-red-700 hover:bg-red-200" onClick={() => setFilters({
              receipt_id: "",
              receipt_type: "",
              warehouse_name: "",
              date_from: "",
              date_to: "",
              weight_min: "",
              weight_max: "",
              cottage_serial_number: "",
              proforma_serial: "",
            })}>ریست</Button>
          </div>
        </CollapsibleContent>
      </Collapsible>


      {loading ? (
        <div>{t("loading")}</div>
      ) : (
        <div className="overflow-x-auto">
          <Table className="w-full min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead className="text-right w-16">ردیف</TableHead>
                <TableHead className="text-right">{t("table.id")}</TableHead>
                <TableHead className="text-right">{t("table.receipt_id")}</TableHead>
                <TableHead className="text-right">{t("table.receipt_type")}</TableHead>
                <TableHead className="text-right">{t("table.warehouse")}</TableHead>
                <TableHead className="text-right">{t("table.date")}</TableHead>
                <TableHead className="text-right">{t("table.total_weight")}</TableHead>
                <TableHead className="text-right">{t("table.operations")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReceipts.map((receipt, index) => (
                <TableRowComponent key={receipt.id}>
                  <TableCell className="text-right font-medium">{toPersianDigits(index + 1)}</TableCell>
                  <TableCell>{toPersianDigits(receipt.id)}</TableCell>
                  <TableCell>{toPersianDigits(receipt.receipt_id, '-')}</TableCell>
                  <TableCell>{getReceiptTypeLabel(receipt.receipt_type)}</TableCell>
                  <TableCell>{receipt.warehouse_name || '-'}</TableCell>
                  <TableCell><PersianDateTableCell date={receipt.date} /></TableCell>
                  <TableCell>{formatNumber(receipt.total_weight)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(receipt)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(receipt)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRowComponent>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
