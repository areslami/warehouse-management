'use client';

import { useCallback, useEffect, useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell, TableRow as TableRowComponent } from "@/components/ui/table";
import { handleApiErrorWithToast } from "@/lib/api/error-toast-handler";
import { toast } from "@/lib/toast-helper";
import { PersianDateTableCell } from "@/components/ui/persian-date-table-cell";
import { DeliveryFulfillment, DeliveryFulfillmentCreate } from "@/lib/interfaces/warehouse";
import {
  fetchDeliveryFulfillments,
  fetchDeliveryFulfillmentById,
  createDeliveryFulfillment,
  updateDeliveryFulfillment,
  deleteDeliveryFulfillment
} from "@/lib/api/warehouse";
import { useModal } from "@/lib/modal-context";
import { DeliveryFulfillmentModal } from "@/components/modals/warehouse/delivery-fulfillment-modal";
import { formatNumber } from "@/lib/utils/number-format";
import { Edit, Plus, Trash2, Upload, ChevronUp, ChevronDown } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import UploadDeliveryModal from "../modals/warehouse/upload-delivery-modal";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";
import { buildIndicatorPreview, compactIndicatorValue } from "@/lib/indicator-format";
import { renderLocalizedValue } from "@/lib/utils/localized-value";

interface DeliveryFulfillmentTabProps {
  selectedWarehouseId?: number;
}

export function DeliveryFulfillmentTab({ selectedWarehouseId }: DeliveryFulfillmentTabProps) {
  const t = useTranslations("pages.warehouse.deliveries");
  const tCommon = useTranslations("common");
  const { openModal } = useModal();
  const [deliveries, setDeliveries] = useState<DeliveryFulfillment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    delivery_id: "",
    waybill_serial: "",
    b2b_address_purchase_id: "",
    warehouse_receipt_id: "",
    issue_date_from: "",
    issue_date_to: "",
    weight_min: "",
    weight_max: "",
    shipping_company_name: "",
    driver_name: "",
    driver_phone: "",
    driver_license_plate: "",
  });

  const loadDeliveries = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedDeliveries = await fetchDeliveryFulfillments();
      if (fetchedDeliveries) {
        setDeliveries(fetchedDeliveries);
      }
    } catch (error) {
      console.error('Failed to load deliveries:', error);
      handleApiErrorWithToast(error, "Loading delivery fulfillments");

    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDeliveries();
  }, [loadDeliveries]);

  const filteredDeliveries = useMemo(() => {
    return deliveries.filter(d => {
      if (filters.delivery_id && !d.delivery_id.toLowerCase().includes(filters.delivery_id.toLowerCase())) return false;
      if (filters.waybill_serial && !(d.waybill_serial || "").toLowerCase().includes(filters.waybill_serial.toLowerCase())) return false;
      if (filters.b2b_address_purchase_id && !(d.b2b_address_purchase_id || "").toLowerCase().includes(filters.b2b_address_purchase_id.toLowerCase())) return false;
      if (filters.warehouse_receipt_id && !(d.warehouse_receipt_id || "").toLowerCase().includes(filters.warehouse_receipt_id.toLowerCase())) return false;
      if (filters.shipping_company_name && !(d.shipping_company_name || "").toLowerCase().includes(filters.shipping_company_name.toLowerCase())) return false;
      if (filters.driver_name && !d.driver_name.toLowerCase().includes(filters.driver_name.toLowerCase())) return false;
      if (filters.driver_phone && !d.driver_phone.toLowerCase().includes(filters.driver_phone.toLowerCase())) return false;
      if (filters.driver_license_plate && !d.driver_license_plate.toLowerCase().includes(filters.driver_license_plate.toLowerCase())) return false;

      const idf = filters.issue_date_from ? new Date(filters.issue_date_from).getTime() : 0;
      const idt = filters.issue_date_to ? new Date(filters.issue_date_to).getTime() : 0;
      const id = d.issue_date ? new Date(d.issue_date).getTime() : 0;
      if (idf && id < idf) return false;
      if (idt && id > idt) return false;

      const wmin = filters.weight_min ? Number(filters.weight_min) : -Infinity;
      const wmax = filters.weight_max ? Number(filters.weight_max) : Infinity;
      if (d.total_weight < wmin || d.total_weight > wmax) return false;

      return true;
    });
  }, [deliveries, filters]);

  const handleCreate = () => {
    openModal(DeliveryFulfillmentModal, {
      onSubmit: async (data) => {
        try {
          const data2: DeliveryFulfillmentCreate = {
            ...data,
            total_weight: data.items.reduce(
              (sum: number, item: { weight?: number }) => sum + (item.weight || 0),
              0
            ),
            description: data.description || "",
          }
          await createDeliveryFulfillment(data2);
          await loadDeliveries();
          toast.success(tCommon("toast_messages.create_success"));
        } catch (error) {
          console.error("Failed to create delivery fulfillment:", error);
          handleApiErrorWithToast(error, "Creating delivery fulfillment");
          
        }
      }
    });
  };

  const handleEdit = async (delivery: DeliveryFulfillment) => {
    try {
      const detailedDelivery = await fetchDeliveryFulfillmentById(delivery.id);
      if (detailedDelivery) {
        openModal(DeliveryFulfillmentModal, {
          initialData: {
            delivery_id: detailedDelivery.delivery_id || "",
            waybill_serial: detailedDelivery.waybill_serial || "",
            issue_date: detailedDelivery.issue_date,
            b2b_address: detailedDelivery.b2b_address || 0,
            warehouse_receipt: detailedDelivery.warehouse_receipt || 0,
            warehouse: detailedDelivery.warehouse || 0,
            description: detailedDelivery.description || "",
            shipping_company: detailedDelivery.shipping_company || 0,
            driver_name: detailedDelivery.driver_name || "",
            driver_phone: detailedDelivery.driver_phone || "",
            driver_license_plate: detailedDelivery.driver_license_plate || "",
            items: detailedDelivery.items?.map(item => ({
              product: item.product,
              weight: item.weight || 0,
              destination: item.destination || "",
              receiver: item.receiver,
              customer: item.customer,
              fare: item.fare || 0,
            })) || []
          },
          onSubmit: async (data) => {
            try {
              const data2: DeliveryFulfillmentCreate = {
                ...data,
                total_weight: data.items.reduce(
                  (sum: number, item: { weight?: number }) => sum + (item.weight || 0),
                  0
                ),
                description: data.description || "",
              };
              await updateDeliveryFulfillment(delivery.id, data2);
              await loadDeliveries();
              toast.success(tCommon("toast_messages.update_success"));
            } catch (error) {
              console.error("Failed to update delivery fulfillment:", error);
              handleApiErrorWithToast(error, "Updating delivery fulfillment");

            }
          }
        });
      }
    } catch (error) {
      console.error("Failed to fetch delivery details:", error);
      handleApiErrorWithToast(error, "Fetching delivery details");

    }
  };

  const handleDelete = async (delivery: DeliveryFulfillment) => {
    if (confirm(t("confirm_delete"))) {
      try {
        await deleteDeliveryFulfillment(delivery.id);
        await loadDeliveries();
        toast.success(tCommon("toast_messages.delete_success"));
      } catch (error) {
        console.error("Failed to delete delivery fulfillment:", error);
        handleApiErrorWithToast(error, "Deleting delivery fulfillment");
        
      }
    }
  };

  return (
    <div className="p-4 h-full" dir="rtl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{t("title")}</h3>
        <div className="flex gap-2 items-center">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowUploadModal(true)}
          >
            <Upload className="w-4 h-4 mr-1" />
            {t("import_excel")}
          </Button>
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
                <div className="text-sm font-medium mb-1">{t("table.delivery_id")}</div>
                <Input value={filters.delivery_id} onChange={e => setFilters({ ...filters, delivery_id: e.target.value })} />
              </div>
              <div>
                <div className="text-sm font-medium mb-1">شماره بارنامه</div>
                <Input value={filters.waybill_serial} onChange={e => setFilters({ ...filters, waybill_serial: e.target.value })} />
              </div>
              <div>
                <div className="text-sm font-medium mb-1">شناسه خرید B2B</div>
                <Input value={filters.b2b_address_purchase_id} onChange={e => setFilters({ ...filters, b2b_address_purchase_id: e.target.value })} />
              </div>
              <div>
                <div className="text-sm font-medium mb-1">شناسه رسید انبار</div>
                <Input value={filters.warehouse_receipt_id} onChange={e => setFilters({ ...filters, warehouse_receipt_id: e.target.value })} />
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
              <div>
                <div className="text-sm font-medium mb-1">نام راننده</div>
                <Input value={filters.driver_name} onChange={e => setFilters({ ...filters, driver_name: e.target.value })} />
              </div>
              <div>
                <div className="text-sm font-medium mb-1">تلفن راننده</div>
                <Input value={filters.driver_phone} onChange={e => setFilters({ ...filters, driver_phone: e.target.value })} />
              </div>
              <div>
                <div className="text-sm font-medium mb-1">پلاک راننده</div>
                <Input value={filters.driver_license_plate} onChange={e => setFilters({ ...filters, driver_license_plate: e.target.value })} />
              </div>
            </div>
          </div>
          <div className="flex justify-end mb-4">
            <Button className="bg-red-100 text-red-700 hover:bg-red-200" onClick={() => setFilters({
              delivery_id: "",
              waybill_serial: "",
              b2b_address_purchase_id: "",
              warehouse_receipt_id: "",
              issue_date_from: "",
              issue_date_to: "",
              weight_min: "",
              weight_max: "",
              shipping_company_name: "",
              driver_name: "",
              driver_phone: "",
              driver_license_plate: "",
            })}>ریست</Button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {loading ? (
        <div>{t("loading")}</div>
      ) : (
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="text-right w-16">ردیف</TableHead>
                <TableHead className="text-right">{t("table.delivery_id")}</TableHead>
                <TableHead className="text-right">{t("table.b2b_address")}</TableHead>
                <TableHead className="text-right">{t("table.warehouse_receipt")}</TableHead>
                <TableHead className="text-right">{t("table.issue_date")}</TableHead>
                <TableHead className="text-right">{t("table.total_weight")}</TableHead>
                <TableHead className="text-right">{t("table.product")}</TableHead>
                <TableHead className="text-right">{t("table.receiver")}</TableHead>
                <TableHead className="text-right">{t("table.operations")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDeliveries.map((delivery, index) => {
                const firstItem = delivery.items?.[0];

                return (
                  <TableRowComponent key={delivery.id}>
                    <TableCell className="text-right font-medium">{index + 1}</TableCell>
                    <TableCell dir="rtl">
                      {renderLocalizedValue(
                        "",
                        buildIndicatorPreview(compactIndicatorValue(delivery.delivery_id), {})?.parts.map((part, partIndex) => (
                          <bdi
                            key={`delivery-${delivery.id}-${partIndex}`}
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
                    <TableCell>{delivery.b2b_address_purchase_id || '-'}</TableCell>
                    <TableCell>{delivery.warehouse_receipt_id || '-'}</TableCell>
                    <TableCell><PersianDateTableCell date={delivery.issue_date} /></TableCell>
                    <TableCell>{formatNumber(delivery.total_weight)}</TableCell>
                    <TableCell>{firstItem?.product_name || '-'}</TableCell>
                    <TableCell>{firstItem?.receiver || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(delivery)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(delivery)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRowComponent>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {showUploadModal && (
        <UploadDeliveryModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            loadDeliveries();
            setShowUploadModal(false);
          }}
        />
      )}
    </div>
  );
}
