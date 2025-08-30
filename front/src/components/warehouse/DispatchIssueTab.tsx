'use client';

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell, TableRow as TableRowComponent } from "@/components/ui/table";
import { handleApiErrorWithToast } from "@/lib/api/error-toast-handler";
import { toast } from "@/lib/toast-helper";
import { PersianDateTableCell } from "@/components/ui/persian-date-table-cell";
import { DispatchIssue, DispatchIssueCreate } from "@/lib/interfaces/warehouse";
import {
  fetchDispatchIssues,
  fetchDispatchIssueById,
  createDispatchIssue,
  updateDispatchIssue,
  deleteDispatchIssue
} from "@/lib/api/warehouse";
import { useModal } from "@/lib/modal-context";
import { DispatchIssueModal } from "@/components/modals/warehouse/dispatch-issue-modal";
import {
  filterByWarehouse,
  searchFilter
} from "@/lib/utils/warehouse-utils";
import { formatNumber } from "@/lib/utils/number-format";
import { Button } from "../ui/button";
import { Edit, Plus, Search, Trash2 } from "lucide-react";
import { Input } from "../ui/input";

interface DispatchIssueTabProps {
  selectedWarehouseId?: number;
}

export function DispatchIssueTab({ selectedWarehouseId }: DispatchIssueTabProps) {
  const t = useTranslations("pages.warehouse.issues");
  const { openModal } = useModal();
  const [dispatches, setDispatches] = useState<DispatchIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const loadDispatches = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedDispatches = await fetchDispatchIssues();
      if (fetchedDispatches) {
        const filtered = filterByWarehouse(fetchedDispatches, selectedWarehouseId);
        setDispatches(filtered);
      }
    } catch (error) {
      console.error('Failed to load dispatches:', error);
      handleApiErrorWithToast(error, "Loading dispatch issues");
      
    } finally {
      setLoading(false);
    }
  }, [selectedWarehouseId]);

  useEffect(() => {
    loadDispatches();
  }, [selectedWarehouseId, loadDispatches]);

  // Filter dispatches based on search
  const filteredDispatches = searchFilter(
    dispatches,
    searchTerm,
    ['dispatch_id', 'warehouse_name', 'description']
  );

  const handleCreate = () => {
    openModal(DispatchIssueModal, {
      onSubmit: async (data) => {
        try {
          const data2: DispatchIssueCreate = {
            ...data,
            total_weight: data.items.reduce((sum, item) => sum + (item.weight || 0), 0),
            description: data.description || "",
          }
          await createDispatchIssue(data2);
          await loadDispatches();
          toast.success(tCommon("toast_messages.create_success"));
        } catch (error) {
          console.error("Failed to create dispatch issue:", error);
          handleApiErrorWithToast(error, "Creating dispatch issue");
          
        }
      }
    });
  };

  const handleEdit = async (dispatch: DispatchIssue) => {
    try {
      const detailedDispatch = await fetchDispatchIssueById(dispatch.id);
      if (detailedDispatch) {
        openModal(DispatchIssueModal, {
          initialData: {
            dispatch_id: detailedDispatch.dispatch_id || "",
            warehouse: detailedDispatch.warehouse || 0,
            sales_proforma: detailedDispatch.sales_proforma,
            issue_date: detailedDispatch.issue_date,
            validity_date: detailedDispatch.validity_date,
            description: detailedDispatch.description || "",
            shipping_company: detailedDispatch.shipping_company || 0,
            items: detailedDispatch.items?.map(item => ({
              product: item.product,
              weight: item.weight || 0,
              vehicle_type: item.vehicle_type || "truck",
              receiver: item.receiver,
            })) || []
          },
          onSubmit: async (data) => {
            try {
              await updateDispatchIssue(dispatch.id, data);
              await loadDispatches();
              toast.success(tCommon("toast_messages.update_success"));
            } catch (error) {
              console.error("Failed to update dispatch issue:", error);
              handleApiErrorWithToast(error, "Updating dispatch issue");
              
            }
          }
        });
      }
    } catch (error) {
      console.error("Failed to fetch dispatch details:", error);
      handleApiErrorWithToast(error, "Fetching dispatch details");
      
    }
  };

  const handleDelete = async (dispatch: DispatchIssue) => {
    if (confirm(t("confirm_delete"))) {
      try {
        await deleteDispatchIssue(dispatch.id);
        await loadDispatches();
        toast.success(tCommon("toast_messages.delete_success"));
      } catch (error) {
        console.error("Failed to delete dispatch issue:", error);
        handleApiErrorWithToast(error, "Deleting dispatch issue");
        
      }
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
                <TableHead className="text-right">{t("table.dispatch_id")}</TableHead>
                <TableHead className="text-right">{t("table.warehouse")}</TableHead>
                <TableHead className="text-right">{t("table.issue_date")}</TableHead>
                <TableHead className="text-right">{t("table.validity_date")}</TableHead>
                <TableHead className="text-right">{t("table.total_weight")}</TableHead>
                <TableHead className="text-right">{t("table.operations")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDispatches.map((dispatch) => (
                <TableRowComponent key={dispatch.id}>
                  <TableCell>{dispatch.id}</TableCell>
                  <TableCell>{dispatch.dispatch_id}</TableCell>
                  <TableCell>{dispatch.warehouse_name || '-'}</TableCell>
                  <TableCell><PersianDateTableCell date={dispatch.issue_date} /></TableCell>
                  <TableCell><PersianDateTableCell date={dispatch.validity_date} /></TableCell>
                  <TableCell>{formatNumber(dispatch.total_weight)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(dispatch)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(dispatch)}
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