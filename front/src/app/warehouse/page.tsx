'use client';

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Tabs, TabsTrigger, TabsList, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useModal } from "@/lib/modal-context";
import { useCoreData } from "@/lib/core-data-context";
import { WarehouseModal } from "@/components/modals/warehouse-modal";
import { createWarehouse, updateWarehouse, deleteWarehouse } from "@/lib/api/warehouse";
import { WarehouseReceiptTab } from "@/components/warehouse/WarehouseReceiptTab";
import { DispatchIssueTab } from "@/components/warehouse/DispatchIssueTab";
import { DeliveryFulfillmentTab } from "@/components/warehouse/DeliveryFulfillmentTab";

export default function WarehousePage() {
  const t = useTranslations("warehouse_page");
  const { openModal } = useModal();
  const { data: coreData, refreshData } = useCoreData();
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | undefined>(undefined);
  
  const selectedWarehouse = coreData.warehouses.find(w => w.id === selectedWarehouseId);

  useEffect(() => {
    // Ensure warehouses are loaded
    if (coreData.warehouses.length === 0) {
      refreshData('warehouses');
    }
  }, [coreData.warehouses.length, refreshData]);

  const handleCreateWarehouse = () => {
    openModal(WarehouseModal, {
      onSubmit: async (data) => {
        await createWarehouse(data);
        await refreshData('warehouses');
      }
    });
  };

  const handleEditWarehouse = () => {
    if (!selectedWarehouse) return;
    
    openModal(WarehouseModal, {
      initialData: selectedWarehouse,
      onSubmit: async (data) => {
        if (selectedWarehouseId) {
          await updateWarehouse(selectedWarehouseId, data);
          await refreshData('warehouses');
        }
      }
    });
  };

  const handleDeleteWarehouse = async () => {
    if (selectedWarehouseId && confirm(t("confirm_delete_warehouse"))) {
      await deleteWarehouse(selectedWarehouseId);
      await refreshData('warehouses');
      setSelectedWarehouseId(undefined);
    }
  };

  return (
    <div className="min-h-screen p-4" dir="rtl">
      <h2 className="text-2xl font-bold mb-6">{t("title")}</h2>
      
      {/* Warehouse Selection Section */}
      <div className="flex items-center gap-4 mb-4">
        <p>{t("select_warehouse_label")}</p>
        <Select 
          value={selectedWarehouseId ? String(selectedWarehouseId) : "all"}
          onValueChange={(value) => setSelectedWarehouseId(value === "all" ? undefined : Number(value))} 
          dir="rtl"
        >
          <SelectTrigger className="w-[250px] text-right">
            <SelectValue placeholder={t("select_warehouse_placeholder")} />
          </SelectTrigger>
          <SelectContent dir="rtl">
            <SelectItem value="all">
              {t("all_warehouses")}
            </SelectItem>
            {coreData.warehouses.length > 0 && (
              <div className="border-t my-1" />
            )}
            {coreData.warehouses.map((warehouse) => (
              <SelectItem key={warehouse.id} value={String(warehouse.id)}>
                {warehouse.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          className="bg-[#f6d265] hover:bg-[#f5c842] text-white"
          onClick={handleCreateWarehouse}
        >
          <Plus className="ml-2 h-4 w-4" />
          {t("add_warehouse")}
        </Button>
      </div>

      {/* Selected Warehouse Details */}
      {selectedWarehouse && (
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">{selectedWarehouse.name}</h3>
              <p className="text-gray-600">{t("warehouse_address")}: {selectedWarehouse.address}</p>
              <p className="text-gray-600">{t("warehouse_manager")}: {selectedWarehouse.manager}</p>
              <p className="text-gray-600">{t("warehouse_phone")}: {selectedWarehouse.phone}</p>
              {selectedWarehouse.description && (
                <p className="text-gray-600">{t("warehouse_description")}: {selectedWarehouse.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditWarehouse}
              >
                <Edit className="h-4 w-4 ml-1" />
                {t("edit_warehouse")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:bg-red-50"
                onClick={handleDeleteWarehouse}
              >
                <Trash2 className="h-4 w-4 ml-1" />
                {t("delete_warehouse")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs for different warehouse operations */}
      <Tabs defaultValue="receipts" className="flex-1 flex flex-col h-[calc(100vh-250px)]">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="fullfilment" className="data-[state=active]:bg-[#f6d265] data-[state=active]:text-white">
            {t("fullfilment_tab")}
          </TabsTrigger>
          <TabsTrigger value="issue" className="data-[state=active]:bg-[#f6d265] data-[state=active]:text-white">
            {t("issue_tab")}
          </TabsTrigger>
          <TabsTrigger value="receipts" className="data-[state=active]:bg-[#f6d265] data-[state=active]:text-white">
            {t("receipts_tab")}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="receipts" className="flex-1 overflow-auto">
          <WarehouseReceiptTab selectedWarehouseId={selectedWarehouseId} />
        </TabsContent>
        <TabsContent value="issue" className="flex-1 overflow-auto">
          <DispatchIssueTab selectedWarehouseId={selectedWarehouseId} />
        </TabsContent>
        <TabsContent value="fullfilment" className="flex-1 overflow-auto">
          <DeliveryFulfillmentTab selectedWarehouseId={selectedWarehouseId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}