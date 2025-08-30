"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { handleApiErrorWithToast } from "@/lib/api/error-toast-handler";
import { toast } from "@/lib/toast-helper";
import { formatNumber } from "@/lib/utils/number-format";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useModal } from "@/lib/modal-context";
import { useCoreData } from "@/lib/core-data-context";
import { SalesProformaModal } from "@/components/modals/finance/salesproforma-modal";
import { createSalesProforma, updateSalesProforma, deleteSalesProforma } from "@/lib/api/finance";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SalesProforma } from "@/lib/interfaces/finance";

export function SalesProformaTab() {
  const t = useTranslations("modals.salesProforma");
  const { openModal } = useModal();
  const { data, refreshData } = useCoreData();

  useEffect(() => {
    if (data.salesProformas.length === 0) {
      refreshData('salesProformas');
    }
  }, [data.salesProformas.length, refreshData]);

  const handleCreate = () => {
    openModal(SalesProformaModal, {
      onSubmit: async (formData) => {
        try {
          await createSalesProforma(formData);
          await refreshData('salesProformas');
          toast.success(tCommon("toast_messages.create_success"));
        } catch (error) {
          console.error("Failed to create sales proforma:", error);
          handleApiErrorWithToast(error, "Creating sales proforma");
          
        }
      }
    });
  };

  const handleEdit = (proforma: SalesProforma) => {
    openModal(SalesProformaModal, {
      initialData: proforma,
      onSubmit: async (formData) => {
        try {
          await updateSalesProforma(proforma.id, formData);
          await refreshData('salesProformas');
          toast.success(tCommon("toast_messages.update_success"));
        } catch (error) {
          console.error("Failed to update sales proforma:", error);
          handleApiErrorWithToast(error, "Updating sales proforma");
          
        }
      }
    });
  };

  const handleDelete = async (id: number) => {
    if (confirm(t("confirm_delete"))) {
      try {
        await deleteSalesProforma(id);
        await refreshData('salesProformas');
        toast.success(tCommon("toast_messages.delete_success"));
      } catch (error) {
        console.error("Failed to delete sales proforma:", error);
        handleApiErrorWithToast(error, "Deleting sales proforma");
        
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{t("sales_proformas")}</h3>
        <Button
          className="bg-[#f6d265] hover:bg-[#f5c842] text-white"
          onClick={handleCreate}
        >
          <Plus className="ml-2 h-4 w-4" />
          {t("add_sales_proforma")}
        </Button>
      </div>

      <Table>
        <TableCaption>{t("table_caption")}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">{t("serial_number")}</TableHead>
            <TableHead className="text-right">{t("customer")}</TableHead>
            <TableHead className="text-right">{t("date")}</TableHead>
            <TableHead className="text-right">{t("total_amount")}</TableHead>
            <TableHead className="text-right">{t("status")}</TableHead>
            <TableHead className="text-right">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.salesProformas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-gray-500">
                {t("no_proformas")}
              </TableCell>
            </TableRow>
          ) : (
            data.salesProformas.map((proforma) => (
              <TableRow key={proforma.id}>
                <TableCell className="font-medium">{proforma.serial_number}</TableCell>
                <TableCell>{proforma.customer}</TableCell>
                <TableCell>{proforma.date}</TableCell>
                <TableCell>{formatNumber(proforma.subtotal)}</TableCell>
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