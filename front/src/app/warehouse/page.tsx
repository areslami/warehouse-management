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
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">{t("title")}</h2>
          
          <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700 font-medium">{t("select_warehouse_label")}</p>
            <Select 
              value={selectedWarehouseId ? String(selectedWarehouseId) : "all"}
              onValueChange={(value) => setSelectedWarehouseId(value === "all" ? undefined : Number(value))} 
              dir="rtl"
            >
              <SelectTrigger className="w-[280px] text-right bg-white border-gray-300 hover:border-gray-400">
                <SelectValue placeholder={t("select_warehouse_placeholder")} />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="all" className="font-semibold">
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
              className="bg-[#f6d265] hover:bg-[#f5c842] text-white shadow-md transition-all duration-200"
              onClick={handleCreateWarehouse}
            >
              <Plus className="ml-2 h-4 w-4" />
              {t("add_warehouse")}
            </Button>
          </div>
        </div>

        {selectedWarehouse && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex justify-between items-start">
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-gray-800">{selectedWarehouse.name}</h3>
                <div className="grid grid-cols-2 gap-4 text-gray-600">
                  <p><span className="font-medium text-gray-700">{t("warehouse_address")}:</span> {selectedWarehouse.address}</p>
                  <p><span className="font-medium text-gray-700">{t("warehouse_manager")}:</span> {selectedWarehouse.manager}</p>
                  <p><span className="font-medium text-gray-700">{t("warehouse_phone")}:</span> {selectedWarehouse.phone}</p>
                  {selectedWarehouse.description && (
                    <p><span className="font-medium text-gray-700">{t("warehouse_description")}:</span> {selectedWarehouse.description}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditWarehouse}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  <Edit className="h-4 w-4 ml-1" />
                  {t("edit_warehouse")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:bg-red-50 border-red-300"
                  onClick={handleDeleteWarehouse}
                >
                  <Trash2 className="h-4 w-4 ml-1" />
                  {t("delete_warehouse")}
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm">
          <Tabs defaultValue="receipts" className="flex-1 flex flex-col">
            <TabsList className="w-full grid grid-cols-3 bg-gray-100 p-1 rounded-t-lg">
              <TabsTrigger value="fullfilment" className="data-[state=active]:bg-[#f6d265] data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all">
                {t("fullfilment_tab")}
              </TabsTrigger>
              <TabsTrigger value="issue" className="data-[state=active]:bg-[#f6d265] data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all">
                {t("issue_tab")}
              </TabsTrigger>
              <TabsTrigger value="receipts" className="data-[state=active]:bg-[#f6d265] data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all">
                {t("receipts_tab")}
              </TabsTrigger>
            </TabsList>
            
            <div className="p-6">
              <TabsContent value="receipts" className="mt-0">
                <WarehouseReceiptTab selectedWarehouseId={selectedWarehouseId} />
              </TabsContent>
              <TabsContent value="issue" className="mt-0">
                <DispatchIssueTab selectedWarehouseId={selectedWarehouseId} />
              </TabsContent>
              <TabsContent value="fullfilment" className="mt-0">
                <DeliveryFulfillmentTab selectedWarehouseId={selectedWarehouseId} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}