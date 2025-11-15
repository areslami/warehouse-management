'use client';

import { useCallback, useEffect, useState, useMemo } from "react";
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
} from "@/lib/utils/warehouse-utils";
import { formatNumber } from "@/lib/utils/number-format";
import { Button } from "../ui/button";
import { Edit, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { Input } from "../ui/input";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";
import { buildIndicatorPreview, compactIndicatorValue } from "@/lib/indicator-format";
import { renderLocalizedValue } from "@/lib/utils/localized-value";

interface DispatchIssueTabProps {
  selectedWarehouseId?: number;
}

export function DispatchIssueTab({ selectedWarehouseId }: DispatchIssueTabProps) {
  const t = useTranslations("pages.warehouse.issues");
  const tCommon = useTranslations("common");
  const { openModal } = useModal();
  const [dispatches, setDispatches] = useState<DispatchIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    dispatch_id: "",
    warehouse_name: "",
    sales_proforma_serial: "",
    issue_date_from: "",
    issue_date_to: "",
    validity_date_from: "",
    validity_date_to: "",
    weight_min: "",
    weight_max: "",
    shipping_company_name: "",
  });

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

  const filteredDispatches = useMemo(() => {
    return dispatches.filter(d => {
      if (filters.dispatch_id && !d.dispatch_id.toLowerCase().includes(filters.dispatch_id.toLowerCase())) return false;
      if (filters.warehouse_name && !(d.warehouse_name || "").toLowerCase().includes(filters.warehouse_name.toLowerCase())) return false;
      if (filters.sales_proforma_serial && !(d.sales_proforma_serial || "").toLowerCase().includes(filters.sales_proforma_serial.toLowerCase())) return false;
      if (filters.shipping_company_name && !(d.shipping_company_name || "").toLowerCase().includes(filters.shipping_company_name.toLowerCase())) return false;

      const idf = filters.issue_date_from ? new Date(filters.issue_date_from).getTime() : 0;
      const idt = filters.issue_date_to ? new Date(filters.issue_date_to).getTime() : 0;
      const id = d.issue_date ? new Date(d.issue_date).getTime() : 0;
      if (idf && id < idf) return false;
      if (idt && id > idt) return false;

      const vdf = filters.validity_date_from ? new Date(filters.validity_date_from).getTime() : 0;
      const vdt = filters.validity_date_to ? new Date(filters.validity_date_to).getTime() : 0;
      const vd = d.validity_date ? new Date(d.validity_date).getTime() : 0;
      if (vdf && vd < vdf) return false;
      if (vdt && vd > vdt) return false;

      const wmin = filters.weight_min ? Number(filters.weight_min) : -Infinity;
      const wmax = filters.weight_max ? Number(filters.weight_max) : Infinity;
      if (d.total_weight < wmin || d.total_weight > wmax) return false;

      return true;
    });
  }, [dispatches, filters]);

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
                <div className="text-sm font-medium mb-1">{t("table.dispatch_id")}</div>
                <Input value={filters.dispatch_id} onChange={e => setFilters({ ...filters, dispatch_id: e.target.value })} />
              </div>
              <div>
                <div className="text-sm font-medium mb-1">{t("table.warehouse")}</div>
                <Input value={filters.warehouse_name} onChange={e => setFilters({ ...filters, warehouse_name: e.target.value })} />
              </div>
              <div>
                <div className="text-sm font-medium mb-1">شماره پیش‌فاکتور فروش</div>
                <Input value={filters.sales_proforma_serial} onChange={e => setFilters({ ...filters, sales_proforma_serial: e.target.value })} />
              </div>
              <div>
                <div className="text-sm font-medium mb-1">تاریخ صدور از</div>
                <PersianDatePicker value={filters.issue_date_from} onChange={(v) => setFilters({ ...filters, issue_date_from: v })} />
              </div>
              <div>
                <div className="text-sm font-medium mb-1">تاریخ صدور تا</div>
                <PersianDatePicker value={filters.issue_date_to} onChange={(v) => setFilters({ ...filters, issue_date_to: v })} />
              </div>
              <div>
                <div className="text-sm font-medium mb-1">تاریخ اعتبار از</div>
                <PersianDatePicker value={filters.validity_date_from} onChange={(v) => setFilters({ ...filters, validity_date_from: v })} />
              </div>
              <div>
                <div className="text-sm font-medium mb-1">تاریخ اعتبار تا</div>
                <PersianDatePicker value={filters.validity_date_to} onChange={(v) => setFilters({ ...filters, validity_date_to: v })} />
              </div>
              <div>
                <div className="text-sm font-medium mb-1">{t("table.total_weight")}</div>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="حداقل" value={filters.weight_min} onChange={e => setFilters({ ...filters, weight_min: e.target.value })} />
                  <Input placeholder="حداکثر" value={filters.weight_max} onChange={e => setFilters({ ...filters, weight_max: e.target.value })} />
                </div>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">شرکت حمل و نقل</div>
                <Input value={filters.shipping_company_name} onChange={e => setFilters({ ...filters, shipping_company_name: e.target.value })} />
              </div>
            </div>
          </div>
          <div className="flex justify-end mb-4">
            <Button className="bg-red-100 text-red-700 hover:bg-red-200" onClick={() => setFilters({
              dispatch_id: "",
              warehouse_name: "",
              sales_proforma_serial: "",
              issue_date_from: "",
              issue_date_to: "",
              validity_date_from: "",
              validity_date_to: "",
              weight_min: "",
              weight_max: "",
              shipping_company_name: "",
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
                <TableHead className="text-right">{t("table.dispatch_id")}</TableHead>
                <TableHead className="text-right">{t("table.warehouse")}</TableHead>
                <TableHead className="text-right">{t("table.issue_date")}</TableHead>
                <TableHead className="text-right">{t("table.validity_date")}</TableHead>
                <TableHead className="text-right">{t("table.total_weight")}</TableHead>
                <TableHead className="text-right">{t("table.operations")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDispatches.map((dispatch, index) => (
                <TableRowComponent key={dispatch.id}>
                  <TableCell className="text-right font-medium">{index + 1}</TableCell>
                  <TableCell>{dispatch.id}</TableCell>
                  <TableCell dir="rtl">
                    {renderLocalizedValue(
                      "",
                      buildIndicatorPreview(compactIndicatorValue(dispatch.dispatch_id), {})?.parts.map((part, partIndex) => (
                        <bdi
                          key={`dispatch-${dispatch.id}-${partIndex}`}
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
