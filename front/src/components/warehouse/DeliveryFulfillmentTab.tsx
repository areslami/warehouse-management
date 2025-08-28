'use client';

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell, TableRow as TableRowComponent } from "@/components/ui/table";
import { handleApiError } from "@/lib/api/error-handler";
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
import {
  filterByWarehouse,
  searchFilter
} from "@/lib/utils/warehouse-utils";
import { formatNumber } from "@/lib/utils/number-format";
import { Edit, Plus, Search, Trash2 } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

interface DeliveryFulfillmentTabProps {
  selectedWarehouseId?: number;
}

export function DeliveryFulfillmentTab({ selectedWarehouseId }: DeliveryFulfillmentTabProps) {
  const t = useTranslations("pages.warehouse.deliveries");
  const { openModal } = useModal();
  const [deliveries, setDeliveries] = useState<DeliveryFulfillment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const loadDeliveries = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedDeliveries = await fetchDeliveryFulfillments();
      if (fetchedDeliveries) {
        const filtered = filterByWarehouse(fetchedDeliveries, selectedWarehouseId);
        setDeliveries(filtered);
      }
    } catch (error) {
      console.error('Failed to load deliveries:', error);
      const errorMessage = handleApiError(error, "Loading delivery fulfillments");
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [selectedWarehouseId]);

  useEffect(() => {
    loadDeliveries();
  }, [selectedWarehouseId, loadDeliveries]);

  const filteredDeliveries = searchFilter(
    deliveries,
    searchTerm,
    ['delivery_id', 'warehouse_name', 'description']
  );

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
          const errorMessage = handleApiError(error, "Creating delivery fulfillment");
          toast.error(errorMessage);
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
            issue_date: detailedDelivery.issue_date,
            validity_date: detailedDelivery.validity_date,
            warehouse: detailedDelivery.warehouse || 0,
            sales_proforma: detailedDelivery.sales_proforma,
            description: detailedDelivery.description || "",
            shipping_company: detailedDelivery.shipping_company || 0,
            items: detailedDelivery.items?.map(item => ({
              shipment_id: item.shipment_id || "",
              shipment_price: item.shipment_price || 0,
              product: item.product,
              weight: item.weight || 0,
              vehicle_type: item.vehicle_type || "truck",
              receiver: item.receiver,
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
              const errorMessage = handleApiError(error, "Updating delivery fulfillment");
              toast.error(errorMessage);
            }
          }
        });
      }
    } catch (error) {
      console.error("Failed to fetch delivery details:", error);
      const errorMessage = handleApiError(error, "Fetching delivery details");
      toast.error(errorMessage);
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
        const errorMessage = handleApiError(error, "Deleting delivery fulfillment");
        toast.error(errorMessage);
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
                <TableHead className="text-right">{t("table.delivery_id")}</TableHead>
                <TableHead className="text-right">{t("table.warehouse")}</TableHead>
                <TableHead className="text-right">{t("table.issue_date")}</TableHead>
                <TableHead className="text-right">{t("table.validity_date")}</TableHead>
                <TableHead className="text-right">{t("table.total_weight")}</TableHead>
                <TableHead className="text-right">{t("table.operations")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDeliveries.map((delivery) => (
                <TableRowComponent key={delivery.id}>
                  <TableCell>{delivery.id}</TableCell>
                  <TableCell>{delivery.delivery_id}</TableCell>
                  <TableCell>{delivery.warehouse_name || '-'}</TableCell>
                  <TableCell><PersianDateTableCell date={delivery.issue_date} /></TableCell>
                  <TableCell><PersianDateTableCell date={delivery.validity_date} /></TableCell>
                  <TableCell>{formatNumber(delivery.total_weight)}</TableCell>
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
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}