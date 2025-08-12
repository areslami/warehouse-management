"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import { useModal } from "@/lib/modal-context";
import { useCoreData } from "@/lib/core-data-context";
import { PurchaseProformaModal } from "@/components/modals/purchaseproforma-modal";
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

export function PurchaseProformaTab() {
  const t = useTranslations("purchaseProforma");
  const { openModal } = useModal();
  const { data, refreshData } = useCoreData();

  useEffect(() => {
    if (data.purchaseProformas.length === 0) {
      refreshData('purchaseProformas');
    }
  }, []);

  const handleCreate = () => {
    openModal(PurchaseProformaModal, {
      onSubmit: async (formData) => {
        await createPurchaseProforma(formData);
        await refreshData('purchaseProformas');
      }
    });
  };

  const handleEdit = (proforma: any) => {
    openModal(PurchaseProformaModal, {
      initialData: proforma,
      onSubmit: async (formData) => {
        await updatePurchaseProforma(proforma.id, formData);
        await refreshData('purchaseProformas');
      }
    });
  };

  const handleDelete = async (id: number) => {
    if (confirm(t("confirm_delete"))) {
      await deletePurchaseProforma(id);
      await refreshData('purchaseProformas');
    }
  };

  return (
    <div className="space-y-4">
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
          {data.purchaseProformas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-gray-500">
                {t("no_proformas")}
              </TableCell>
            </TableRow>
          ) : (
            data.purchaseProformas.map((proforma) => (
              <TableRow key={proforma.id}>
                <TableCell className="font-medium">{proforma.serial_number}</TableCell>
                <TableCell>{proforma.supplier_display || proforma.supplier}</TableCell>
                <TableCell>{proforma.date}</TableCell>
                <TableCell>{proforma.total_amount || '-'}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-xs ${
                    proforma.status === 'approved' ? 'bg-green-100 text-green-800' :
                    proforma.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
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