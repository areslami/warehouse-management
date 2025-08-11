'use client';

import { useEffect, useState } from "react";
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
import { WarehouseReceiptModal } from "@/components/modals/warehouse-receipt-modal";
import { TableHeader as TableHeaderSection } from "./TableHeader";
import { TableActions } from "./TableActions";
import { 
  prepareReceiptData, 
  filterByWarehouse, 
  searchFilter 
} from "@/lib/utils/warehouse-utils";

interface WarehouseReceiptTabProps {
  selectedWarehouseId?: number;
}

export function WarehouseReceiptTab({ selectedWarehouseId }: WarehouseReceiptTabProps) {
  const t = useTranslations("warehouse_page.receipts");
  const tReceipt = useTranslations("warehouseReceipt");
  const { openModal } = useModal();
  const [receipts, setReceipts] = useState<WarehouseReceiptType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Load receipts
  const loadReceipts = async () => {
    setLoading(true);
    try {
      const fetchedReceipts = await fetchWarehouseReceipts();
      if (fetchedReceipts) {
        const filtered = filterByWarehouse(fetchedReceipts, selectedWarehouseId);
        setReceipts(filtered);
      }
    } catch (error) {
      console.error('Failed to load receipts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReceipts();
  }, [selectedWarehouseId]);

  // Filter receipts based on search
  const filteredReceipts = searchFilter(
    receipts,
    searchTerm,
    ['receipt_id', 'receipt_type', 'warehouse_name', 'description']
  );

  // Get receipt type label from translations
  const getReceiptTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'import_cottage': tReceipt('type-import'),
      'distribution_cottage': tReceipt('type-distribution'),
      'purchase': tReceipt('type-purchase')
    };
    return typeMap[type] || type;
  };

  // Handle create receipt
  const handleCreate = () => {
    openModal(WarehouseReceiptModal, {
      onSubmit: async (data) => {
        try {
          const receiptData = prepareReceiptData(data);
          await createWarehouseReceipt(receiptData);
          await loadReceipts();
        } catch (error) {
          console.error("Failed to create receipt:", error);
        }
      }
    });
  };

  // Handle edit receipt
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
            const receiptData = prepareReceiptData(data);
            await updateWarehouseReceipt(receipt.id, receiptData);
            await loadReceipts();
          }
        });
      }
    } catch (error) {
      console.error("Failed to fetch receipt details:", error);
    }
  };

  // Handle delete receipt
  const handleDelete = async (receipt: WarehouseReceiptType) => {
    if (confirm(t("confirm_delete"))) {
      await deleteWarehouseReceipt(receipt.id);
      await loadReceipts();
    }
  };

  return (
    <div className="p-4 h-full" dir="rtl">
      <TableHeaderSection
        title={t("title")}
        searchPlaceholder={t("search_placeholder")}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        onCreateClick={handleCreate}
        createButtonLabel={t("new_receipt")}
      />

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
                    <TableActions
                      onEdit={() => handleEdit(receipt)}
                      onDelete={() => handleDelete(receipt)}
                    />
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