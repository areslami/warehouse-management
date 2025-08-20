'use client';

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell, TableRow as TableRowComponent } from "@/components/ui/table";
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
  searchFilter
} from "@/lib/utils/warehouse-utils";
import { Button } from "../ui/button";
import { Edit, Plus, Search, Trash2 } from "lucide-react";
import { Input } from "../ui/input";

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
  const [searchTerm, setSearchTerm] = useState("");

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
      toast.error(tCommon('toast_messages.receipt_loading_error'));
    } finally {
      setLoading(false);
    }
  }, [selectedWarehouseId, tCommon]);

  useEffect(() => {
    loadReceipts();
  }, [selectedWarehouseId, loadReceipts]);

  const filteredReceipts = searchFilter(
    receipts,
    searchTerm,
    ['receipt_id', 'receipt_type', 'warehouse_name', 'description']
  );

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
          toast.success(tCommon('toast_messages.receipt_create_success'));
        } catch (error) {
          console.error("Failed to create receipt:", error);
          toast.error(tCommon('toast_messages.receipt_create_error'));
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
            toast.success(tCommon('toast_messages.receipt_update_success'));
          }
        });
      }
    } catch (error) {
      console.error("Failed to fetch receipt details:", error);
      toast.error(tCommon('toast_messages.receipt_detail_error'));
    }
  };

  const handleDelete = async (receipt: WarehouseReceiptType) => {
    if (confirm(t("confirm_delete"))) {
      await deleteWarehouseReceipt(receipt.id);
      await loadReceipts();
      toast.success(tCommon('toast_messages.receipt_delete_success'));
    }
  };

  return (
    <div className="p-4 h-full" dir="rtl">

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{t("title")}</h3>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t("search_placeholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 w-64"
            />
          </div>
          <Button
            className="bg-[#f6d265] hover:bg-[#f5c842] text-white"
            onClick={handleCreate}
          >
            <Plus className="ml-2 h-4 w-4" />
            {t("new_issue")}
          </Button>
        </div>
      </div>


      {loading ? (
        <div>{t("loading")}</div>
      ) : (
        <div className="overflow-x-auto">
          <Table className="w-full min-w-[800px]">
            <TableHeader>
              <TableRow>
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
              {filteredReceipts.map((receipt) => (
                <TableRowComponent key={receipt.id}>
                  <TableCell>{receipt.id}</TableCell>
                  <TableCell>{receipt.receipt_id || '-'}</TableCell>
                  <TableCell>{getReceiptTypeLabel(receipt.receipt_type)}</TableCell>
                  <TableCell>{receipt.warehouse_name || '-'}</TableCell>
                  <TableCell><PersianDateTableCell date={receipt.date} /></TableCell>
                  <TableCell>{receipt.total_weight}</TableCell>
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