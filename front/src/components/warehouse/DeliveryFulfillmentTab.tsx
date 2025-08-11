'use client';

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell, TableRow as TableRowComponent } from "@/components/ui/table";
import { PersianDateTableCell } from "@/components/ui/persian-date-table-cell";
import { DeliveryFulfillment } from "@/lib/interfaces/warehouse";
import {
  fetchDeliveryFulfillments,
  fetchDeliveryFulfillmentById,
  createDeliveryFulfillment,
  updateDeliveryFulfillment,
  deleteDeliveryFulfillment
} from "@/lib/api/warehouse";
import { useModal } from "@/lib/modal-context";
import { DeliveryFulfillmentModal } from "@/components/modals/delivery-fulfillment-modal";
import { TableHeader as TableHeaderSection } from "./TableHeader";
import { TableActions } from "./TableActions";
import {
  prepareDeliveryData,
  filterByWarehouse,
  searchFilter
} from "@/lib/utils/warehouse-utils";

interface DeliveryFulfillmentTabProps {
  selectedWarehouseId?: number;
}

export function DeliveryFulfillmentTab({ selectedWarehouseId }: DeliveryFulfillmentTabProps) {
  const t = useTranslations("warehouse_page.deliveries");
  const { openModal } = useModal();
  const [deliveries, setDeliveries] = useState<DeliveryFulfillment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Load deliveries
  const loadDeliveries = async () => {
    setLoading(true);
    try {
      const fetchedDeliveries = await fetchDeliveryFulfillments();
      if (fetchedDeliveries) {
        const filtered = filterByWarehouse(fetchedDeliveries, selectedWarehouseId);
        setDeliveries(filtered);
      }
    } catch (error) {
      console.error('Failed to load deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeliveries();
  }, [selectedWarehouseId]);

  // Filter deliveries based on search
  const filteredDeliveries = searchFilter(
    deliveries,
    searchTerm,
    ['delivery_id', 'warehouse_name', 'description']
  );

  // Handle create delivery
  const handleCreate = () => {
    openModal(DeliveryFulfillmentModal, {
      onSubmit: async (data) => {
        const deliveryData = prepareDeliveryData(data);
        await createDeliveryFulfillment(deliveryData);
        await loadDeliveries();
      }
    });
  };

  // Handle edit delivery
  const handleEdit = async (delivery: DeliveryFulfillment) => {
    try {
      // Fetch detailed delivery data including items
      const detailedDelivery = await fetchDeliveryFulfillmentById(delivery.id);
      if (detailedDelivery) {
        openModal(DeliveryFulfillmentModal, {
          initialData: {
            delivery_id: detailedDelivery.delivery_id || "",
            issue_date: detailedDelivery.issue_date,
            validity_date: detailedDelivery.validity_date,
            warehouse: detailedDelivery.warehouse || 0,
            sales_proforma: (typeof detailedDelivery.sales_proforma === 'number') ? detailedDelivery.sales_proforma : detailedDelivery.sales_proforma?.id || 0,
            description: detailedDelivery.description || "",
            shipping_company: detailedDelivery.shipping_company || 0,
            items: detailedDelivery.items?.map(item => ({
              shipment_id: item.shipment_id || "",
              shipment_price: item.shipment_price || 0,
              product: (typeof item.product === 'number') ? item.product : item.product?.id || 0,
              weight: item.weight || 0,
              vehicle_type: item.vehicle_type || "truck",
              receiver: (typeof item.receiver === 'number') ? item.receiver : item.receiver?.id || 0
            })) || []
          },
          onSubmit: async (data) => {
            const deliveryData = prepareDeliveryData(data);
            await updateDeliveryFulfillment(delivery.id, deliveryData);
            await loadDeliveries();
          }
        });
      }
    } catch (error) {
      console.error("Failed to fetch delivery details:", error);
    }
  };

  // Handle delete delivery
  const handleDelete = async (delivery: DeliveryFulfillment) => {
    if (confirm(t("confirm_delete"))) {
      await deleteDeliveryFulfillment(delivery.id);
      await loadDeliveries();
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
        createButtonLabel={t("new_delivery")}
      />

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
                  <TableCell>{delivery.total_weight}</TableCell>
                  <TableCell>
                    <TableActions
                      onEdit={() => handleEdit(delivery)}
                      onDelete={() => handleDelete(delivery)}
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