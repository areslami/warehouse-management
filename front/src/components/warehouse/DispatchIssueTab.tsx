'use client';

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell, TableRow as TableRowComponent } from "@/components/ui/table";
import { PersianDateTableCell } from "@/components/ui/persian-date-table-cell";
import { DispatchIssue } from "@/lib/interfaces/warehouse";
import { 
  fetchDispatchIssues,
  fetchDispatchIssueById,
  createDispatchIssue, 
  updateDispatchIssue, 
  deleteDispatchIssue 
} from "@/lib/api/warehouse";
import { useModal } from "@/lib/modal-context";
import { DispatchIssueModal } from "@/components/modals/dispatch-issue-modal";
import { TableHeader as TableHeaderSection } from "./TableHeader";
import { TableActions } from "./TableActions";
import { 
  prepareDispatchData, 
  filterByWarehouse, 
  searchFilter 
} from "@/lib/utils/warehouse-utils";

interface DispatchIssueTabProps {
  selectedWarehouseId?: number;
}

export function DispatchIssueTab({ selectedWarehouseId }: DispatchIssueTabProps) {
  const t = useTranslations("warehouse_page.issues");
  const { openModal } = useModal();
  const [dispatches, setDispatches] = useState<DispatchIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Load dispatches
  const loadDispatches = async () => {
    setLoading(true);
    try {
      const fetchedDispatches = await fetchDispatchIssues();
      if (fetchedDispatches) {
        const filtered = filterByWarehouse(fetchedDispatches, selectedWarehouseId);
        setDispatches(filtered);
      }
    } catch (error) {
      console.error('Failed to load dispatches:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDispatches();
  }, [selectedWarehouseId]);

  // Filter dispatches based on search
  const filteredDispatches = searchFilter(
    dispatches,
    searchTerm,
    ['dispatch_id', 'warehouse_name', 'description']
  );

  // Handle create dispatch
  const handleCreate = () => {
    openModal(DispatchIssueModal, {
      onSubmit: async (data) => {
        const dispatchData = prepareDispatchData(data);
        await createDispatchIssue(dispatchData);
        await loadDispatches();
      }
    });
  };

  // Handle edit dispatch
  const handleEdit = async (dispatch: DispatchIssue) => {
    try {
      // Fetch detailed dispatch data including items
      const detailedDispatch = await fetchDispatchIssueById(dispatch.id);
      if (detailedDispatch) {
        openModal(DispatchIssueModal, {
          initialData: {
            dispatch_id: detailedDispatch.dispatch_id || "",
            warehouse: detailedDispatch.warehouse || 0,
            sales_proforma: (typeof detailedDispatch.sales_proforma === 'number') ? detailedDispatch.sales_proforma : detailedDispatch.sales_proforma?.id || 0,
            issue_date: detailedDispatch.issue_date,
            validity_date: detailedDispatch.validity_date,
            description: detailedDispatch.description || "",
            shipping_company: detailedDispatch.shipping_company || 0,
            items: detailedDispatch.items?.map(item => ({
              product: (typeof item.product === 'number') ? item.product : item.product?.id || 0,
              weight: item.weight || 0,
              vehicle_type: item.vehicle_type || "truck",
              receiver: (typeof item.receiver === 'number') ? item.receiver : item.receiver?.id || 0
            })) || []
          },
          onSubmit: async (data) => {
            const dispatchData = prepareDispatchData(data);
            await updateDispatchIssue(dispatch.id, dispatchData);
            await loadDispatches();
          }
        });
      }
    } catch (error) {
      console.error("Failed to fetch dispatch details:", error);
    }
  };

  // Handle delete dispatch
  const handleDelete = async (dispatch: DispatchIssue) => {
    if (confirm(t("confirm_delete"))) {
      await deleteDispatchIssue(dispatch.id);
      await loadDispatches();
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
        createButtonLabel={t("new_issue")}
      />

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
                  <TableCell>{dispatch.total_weight}</TableCell>
                  <TableCell>
                    <TableActions
                      onEdit={() => handleEdit(dispatch)}
                      onDelete={() => handleDelete(dispatch)}
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