"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Edit2, Trash2, Package, FileText, Truck, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WarehouseReceiptModal } from "@/components/modals/warehouse-receipt-modal";
import { DispatchIssueModal } from "@/components/modals/dispatch-issue-modal";
import { DeliveryFulfillmentModal } from "@/components/modals/delivery-fulfillment-modal";
import { useCoreData } from "@/lib/core-data-context";
import { 
  fetchWarehouseReceipts, createWarehouseReceipt, updateWarehouseReceipt, deleteWarehouseReceipt,
  fetchDispatchIssues, createDispatchIssue, updateDispatchIssue, deleteDispatchIssue,
  fetchDeliveryFulfillments, createDeliveryFulfillment, updateDeliveryFulfillment, deleteDeliveryFulfillment
} from "@/lib/api/warehouse";
import { WarehouseReceipt, DispatchIssue, DeliveryFulfillment } from "@/lib/interfaces/warehouse";

export default function WarehousePage() {
  const t = useTranslations("warehouse_page");
  const { warehouses, refreshData: refreshCoreData } = useCoreData();
  
  const [receipts, setReceipts] = useState<WarehouseReceipt[]>([]);
  const [dispatches, setDispatches] = useState<DispatchIssue[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryFulfillment[]>([]);
  
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  
  const [editingReceipt, setEditingReceipt] = useState<WarehouseReceipt | null>(null);
  const [editingDispatch, setEditingDispatch] = useState<DispatchIssue | null>(null);
  const [editingDelivery, setEditingDelivery] = useState<DeliveryFulfillment | null>(null);
  
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WarehouseReceipt | DispatchIssue | DeliveryFulfillment | null>(null);
  const [selectedType, setSelectedType] = useState<'receipt' | 'dispatch' | 'delivery'>('receipt');
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [receiptsData, dispatchesData, deliveriesData] = await Promise.all([
        fetchWarehouseReceipts(),
        fetchDispatchIssues(),
        fetchDeliveryFulfillments()
      ]);
      setReceipts(receiptsData);
      setDispatches(dispatchesData);
      setDeliveries(deliveriesData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error(t("errors.fetch_failed"));
    }
  };

  const handleRowClick = (item: WarehouseReceipt | DispatchIssue | DeliveryFulfillment, type: 'receipt' | 'dispatch' | 'delivery') => {
    setSelectedItem(item);
    setSelectedType(type);
    setSheetOpen(true);
  };

  const handleDeleteReceipt = async (id: number) => {
    if (confirm(t("receipts.confirm_delete"))) {
      try {
        await deleteWarehouseReceipt(id);
        toast.success(t("errors.success_delete"));
        loadData();
      } catch (error) {
        console.error("Error deleting receipt:", error);
        toast.error(t("errors.delete_failed"));
      }
    }
  };

  const handleDeleteDispatch = async (id: number) => {
    if (confirm(t("issues.confirm_delete"))) {
      try {
        await deleteDispatchIssue(id);
        toast.success(t("errors.success_delete"));
        loadData();
      } catch (error) {
        console.error("Error deleting dispatch:", error);
        toast.error(t("errors.delete_failed"));
      }
    }
  };

  const handleDeleteDelivery = async (id: number) => {
    if (confirm(t("deliveries.confirm_delete"))) {
      try {
        await deleteDeliveryFulfillment(id);
        toast.success(t("errors.success_delete"));
        loadData();
      } catch (error) {
        console.error("Error deleting delivery:", error);
        toast.error(t("errors.delete_failed"));
      }
    }
  };
  
  const filteredReceipts = useMemo(() => {
    return receipts.filter(receipt => {
      const matchesSearch = receipt.receipt_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        new Date(receipt.date).toLocaleDateString('fa-IR').includes(searchTerm);
      const matchesWarehouse = selectedWarehouse === "all" || receipt.warehouse === parseInt(selectedWarehouse);
      return matchesSearch && matchesWarehouse;
    });
  }, [receipts, searchTerm, selectedWarehouse]);
  
  const filteredDispatches = useMemo(() => {
    return dispatches.filter(dispatch => {
      const matchesSearch = dispatch.dispatch_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        new Date(dispatch.issue_date).toLocaleDateString('fa-IR').includes(searchTerm);
      const matchesWarehouse = selectedWarehouse === "all" || dispatch.warehouse === parseInt(selectedWarehouse);
      return matchesSearch && matchesWarehouse;
    });
  }, [dispatches, searchTerm, selectedWarehouse]);
  
  const filteredDeliveries = useMemo(() => {
    return deliveries.filter(delivery => {
      const matchesSearch = delivery.delivery_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        new Date(delivery.issue_date).toLocaleDateString('fa-IR').includes(searchTerm);
      const matchesWarehouse = selectedWarehouse === "all" || delivery.warehouse === parseInt(selectedWarehouse);
      return matchesSearch && matchesWarehouse;
    });
  }, [deliveries, searchTerm, selectedWarehouse]);

  return (
    <div className="flex-1 p-6 min-h-screen bg-gray-50" dir="rtl">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">{t("title")}</h1>
      
      <div className="mb-6 space-y-4">
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-700">{t("warehouse_selection")}</h2>
          </div>
          <div className="p-4">
            <div className="flex gap-4 items-center mb-4">
              <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder={t("select_warehouse_placeholder")} />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="all">{t("all_warehouses")}</SelectItem>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="bg-[#f6d265] hover:bg-[#f5c842] text-black"
                onClick={() => toast.info(t("add_warehouse_message"))}
              >
                <Plus className="w-4 h-4 ml-1" />
                {t("add_warehouse")}
              </Button>
            </div>
            
            {selectedWarehouse !== "all" && (
              <div className="bg-gray-50 p-4 rounded-lg">
                {warehouses.filter(w => w.id.toString() === selectedWarehouse).map(warehouse => (
                  <div key={warehouse.id}>
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold">{warehouse.name}</h3>
                        <p className="text-gray-600">{t("warehouse_address")}: {warehouse.address}</p>
                        <p className="text-gray-600">{t("warehouse_manager")}: {warehouse.manager}</p>
                        <p className="text-gray-600">{t("warehouse_phone")}: {warehouse.phone}</p>
                        {warehouse.description && (
                          <p className="text-gray-600">{t("warehouse_description")}: {warehouse.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toast.info(`${t("edit_warehouse")}: ${warehouse.name}`)}
                        >
                          <Edit2 className="h-4 w-4 ml-1" />
                          {t("edit_warehouse")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => {
                            if (confirm(t("confirm_delete_warehouse"))) {
                              toast.info(`${t("delete_warehouse")}: ${warehouse.name}`);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 ml-1" />
                          {t("delete_warehouse")}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder={t("receipts.search_placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
      </div>
      
      <Tabs defaultValue="receipts" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="receipts" className="data-[state=active]:bg-[#f6d265] data-[state=active]:text-black">
            <Package className="w-4 h-4 mr-2" />
            {t("receipts_tab")}
          </TabsTrigger>
          <TabsTrigger value="dispatches" className="data-[state=active]:bg-[#f6d265] data-[state=active]:text-black">
            <FileText className="w-4 h-4 mr-2" />
            {t("issue_tab")}
          </TabsTrigger>
          <TabsTrigger value="deliveries" className="data-[state=active]:bg-[#f6d265] data-[state=active]:text-black">
            <Truck className="w-4 h-4 mr-2" />
            {t("fullfilment_tab")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="receipts">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">{t("receipts.title")}</h2>
              <Button className="bg-[#f6d265] hover:bg-[#f5c842] text-black" onClick={() => {
                setEditingReceipt(null);
                setShowReceiptModal(true);
              }}>
                <Plus className="w-4 h-4 mr-1" />
                {t("receipts.new_receipt")}
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">{t("receipts.table.operations")}</TableHead>
                  <TableHead>{t("receipts.table.receipt_id")}</TableHead>
                  <TableHead>{t("receipts.table.date")}</TableHead>
                  <TableHead>{t("receipts.table.warehouse")}</TableHead>
                  <TableHead>{t("receipts.table.total_weight")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceipts.map((receipt) => (
                  <TableRow key={receipt.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleRowClick(receipt, 'receipt')}>
                    <TableCell>
                      <div className="flex gap-2 justify-center">
                        <Button size="sm" variant="ghost" onClick={(e) => {
                          e.stopPropagation();
                          setEditingReceipt(receipt);
                          setShowReceiptModal(true);
                        }}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteReceipt(receipt.id);
                        }}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{receipt.receipt_id}</TableCell>
                    <TableCell>{new Date(receipt.date).toLocaleDateString('fa-IR')}</TableCell>
                    <TableCell>{warehouses.find(w => w.id === receipt.warehouse)?.name}</TableCell>
                    <TableCell>{receipt.total_weight} کیلوگرم</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="dispatches">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">{t("issues.title")}</h2>
              <Button className="bg-[#f6d265] hover:bg-[#f5c842] text-black" onClick={() => {
                setEditingDispatch(null);
                setShowDispatchModal(true);
              }}>
                <Plus className="w-4 h-4 mr-1" />
                {t("issues.new_issue")}
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">{t("issues.table.operations")}</TableHead>
                  <TableHead>{t("issues.table.dispatch_id")}</TableHead>
                  <TableHead>{t("issues.table.issue_date")}</TableHead>
                  <TableHead>{t("issues.table.warehouse")}</TableHead>
                  <TableHead>{t("issues.table.total_weight")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDispatches.map((dispatch) => (
                  <TableRow key={dispatch.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleRowClick(dispatch, 'dispatch')}>
                    <TableCell>
                      <div className="flex gap-2 justify-center">
                        <Button size="sm" variant="ghost" onClick={(e) => {
                          e.stopPropagation();
                          setEditingDispatch(dispatch);
                          setShowDispatchModal(true);
                        }}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDispatch(dispatch.id);
                        }}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{dispatch.dispatch_id}</TableCell>
                    <TableCell>{new Date(dispatch.issue_date).toLocaleDateString('fa-IR')}</TableCell>
                    <TableCell>{warehouses.find(w => w.id === dispatch.warehouse)?.name}</TableCell>
                    <TableCell>{dispatch.total_weight} کیلوگرم</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="deliveries">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">{t("deliveries.title")}</h2>
              <Button className="bg-[#f6d265] hover:bg-[#f5c842] text-black" onClick={() => {
                setEditingDelivery(null);
                setShowDeliveryModal(true);
              }}>
                <Plus className="w-4 h-4 mr-1" />
                {t("deliveries.new_delivery")}
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">{t("deliveries.table.operations")}</TableHead>
                  <TableHead>{t("deliveries.table.delivery_id")}</TableHead>
                  <TableHead>{t("deliveries.table.issue_date")}</TableHead>
                  <TableHead>{t("deliveries.table.warehouse")}</TableHead>
                  <TableHead>{t("deliveries.table.total_weight")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeliveries.map((delivery) => (
                  <TableRow key={delivery.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleRowClick(delivery, 'delivery')}>
                    <TableCell>
                      <div className="flex gap-2 justify-center">
                        <Button size="sm" variant="ghost" onClick={(e) => {
                          e.stopPropagation();
                          setEditingDelivery(delivery);
                          setShowDeliveryModal(true);
                        }}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDelivery(delivery.id);
                        }}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{delivery.delivery_id}</TableCell>
                    <TableCell>{new Date(delivery.issue_date).toLocaleDateString('fa-IR')}</TableCell>
                    <TableCell>{warehouses.find(w => w.id === delivery.warehouse)?.name}</TableCell>
                    <TableCell>{delivery.total_weight} کیلوگرم</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" className="w-[400px] sm:w-[540px] overflow-y-auto p-6" dir="rtl">
          <SheetHeader>
            <SheetTitle className="text-2xl font-bold text-[#f6d265]">
              {selectedType === 'receipt' && t("receipts.details")}
              {selectedType === 'dispatch' && t("issues.details")}
              {selectedType === 'delivery' && t("deliveries.details")}
            </SheetTitle>
          </SheetHeader>
          {selectedItem && (
            <>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedType === 'receipt') {
                      setEditingReceipt(selectedItem as WarehouseReceipt);
                      setShowReceiptModal(true);
                    } else if (selectedType === 'dispatch') {
                      setEditingDispatch(selectedItem as DispatchIssue);
                      setShowDispatchModal(true);
                    } else if (selectedType === 'delivery') {
                      setEditingDelivery(selectedItem as DeliveryFulfillment);
                      setShowDeliveryModal(true);
                    }
                    setSheetOpen(false);
                  }}
                >
                  <Edit2 className="h-4 w-4 ml-1" />
                  {t("edit")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:bg-red-50"
                  onClick={async () => {
                    const confirmMessage = selectedType === 'receipt' ? t("receipts.confirm_delete") :
                                         selectedType === 'dispatch' ? t("issues.confirm_delete") :
                                         t("deliveries.confirm_delete");
                    if (confirm(confirmMessage)) {
                      try {
                        if (selectedType === 'receipt' && 'receipt_id' in selectedItem) {
                          await deleteWarehouseReceipt(selectedItem.id);
                        } else if (selectedType === 'dispatch' && 'dispatch_id' in selectedItem) {
                          await deleteDispatchIssue(selectedItem.id);
                        } else if (selectedType === 'delivery' && 'delivery_id' in selectedItem) {
                          await deleteDeliveryFulfillment(selectedItem.id);
                        }
                        toast.success(t("errors.success_delete"));
                        await loadData();
                        setSheetOpen(false);
                      } catch (error) {
                        console.error("Error deleting:", error);
                        toast.error(t("errors.delete_failed"));
                      }
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 ml-1" />
                  {t("delete")}
                </Button>
              </div>
              <div className="mt-6 space-y-4 p-4 bg-gray-50 rounded-lg">
              {selectedType === 'receipt' && (
                <>
                  <div><strong>شناسه رسید:</strong> {selectedItem.receipt_id}</div>
                  <div><strong>تاریخ:</strong> {new Date(selectedItem.date).toLocaleDateString('fa-IR')}</div>
                  <div><strong>انبار:</strong> {warehouses.find(w => w.id === selectedItem.warehouse)?.name}</div>
                  <div><strong>وزن کل:</strong> {selectedItem.total_weight} کیلوگرم</div>
                  <div><strong>نوع رسید:</strong> {selectedItem.receipt_type}</div>
                  {selectedItem.description && <div><strong>توضیحات:</strong> {selectedItem.description}</div>}
                  {selectedItem.items?.length > 0 && (
                    <div>
                      <strong>اقلام:</strong>
                      <ul className="mt-2 space-y-2">
                        {(selectedItem as WarehouseReceipt).items.map((item, idx: number) => (
                          <li key={idx} className="bg-white p-3 rounded border">
                            <div>محصول {item.product}</div>
                            <div className="text-sm text-gray-600">وزن: {item.weight} کیلوگرم</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
              {selectedType === 'dispatch' && (
                <>
                  <div><strong>شناسه حواله:</strong> {selectedItem.dispatch_id}</div>
                  <div><strong>تاریخ صدور:</strong> {new Date(selectedItem.issue_date).toLocaleDateString('fa-IR')}</div>
                  <div><strong>تاریخ اعتبار:</strong> {new Date(selectedItem.validity_date).toLocaleDateString('fa-IR')}</div>
                  <div><strong>انبار:</strong> {warehouses.find(w => w.id === selectedItem.warehouse)?.name}</div>
                  <div><strong>وزن کل:</strong> {selectedItem.total_weight} کیلوگرم</div>
                  {selectedItem.description && <div><strong>توضیحات:</strong> {selectedItem.description}</div>}
                </>
              )}
              {selectedType === 'delivery' && (
                <>
                  <div><strong>شناسه تحویل:</strong> {selectedItem.delivery_id}</div>
                  <div><strong>تاریخ صدور:</strong> {new Date(selectedItem.issue_date).toLocaleDateString('fa-IR')}</div>
                  <div><strong>تاریخ اعتبار:</strong> {new Date(selectedItem.validity_date).toLocaleDateString('fa-IR')}</div>
                  <div><strong>انبار:</strong> {warehouses.find(w => w.id === selectedItem.warehouse)?.name}</div>
                  <div><strong>شرکت حمل:</strong> {selectedItem.shipping_company_name || selectedItem.shipping_company}</div>
                  <div><strong>پیش‌فاکتور فروش:</strong> {selectedItem.sales_proforma_serial || selectedItem.sales_proforma}</div>
                  <div><strong>وزن کل:</strong> {selectedItem.total_weight} کیلوگرم</div>
                  <div><strong>تعداد اقلام:</strong> {selectedItem.items?.length || 0}</div>
                  {selectedItem.description && <div><strong>توضیحات:</strong> {selectedItem.description}</div>}
                </>
              )}
            </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {showReceiptModal && (
        <WarehouseReceiptModal
          initialData={editingReceipt || undefined}
          onSubmit={async (data) => {
            try {
              if (editingReceipt) {
                await updateWarehouseReceipt(editingReceipt.id, data);
                toast.success(t("errors.success_update"));
              } else {
                await createWarehouseReceipt(data);
                toast.success(t("errors.success_create"));
              }
              await loadData();
              setShowReceiptModal(false);
              setEditingReceipt(null);
            } catch (error) {
              console.error("Error saving receipt:", error);
              toast.error(editingReceipt ? t("errors.update_failed") : t("errors.create_failed"));
            }
          }}
          onClose={() => {
            setShowReceiptModal(false);
            setEditingReceipt(null);
          }}
        />
      )}

      {showDispatchModal && (
        <DispatchIssueModal
          initialData={editingDispatch || undefined}
          onSubmit={async (data) => {
            try {
              if (editingDispatch) {
                await updateDispatchIssue(editingDispatch.id, data);
                toast.success(t("errors.success_update"));
              } else {
                await createDispatchIssue(data);
                toast.success(t("errors.success_create"));
              }
              await loadData();
              setShowDispatchModal(false);
              setEditingDispatch(null);
            } catch (error) {
              console.error("Error saving dispatch:", error);
              toast.error(editingDispatch ? t("errors.update_failed") : t("errors.create_failed"));
            }
          }}
          onClose={() => {
            setShowDispatchModal(false);
            setEditingDispatch(null);
          }}
        />
      )}

      {showDeliveryModal && (
        <DeliveryFulfillmentModal
          initialData={editingDelivery || undefined}
          onSubmit={async (data) => {
            try {
              if (editingDelivery) {
                await updateDeliveryFulfillment(editingDelivery.id, data);
                toast.success(t("errors.success_update"));
              } else {
                await createDeliveryFulfillment(data);
                toast.success(t("errors.success_create"));
              }
              await loadData();
              setShowDeliveryModal(false);
              setEditingDelivery(null);
            } catch (error) {
              console.error("Error saving delivery:", error);
              toast.error(editingDelivery ? t("errors.update_failed") : t("errors.create_failed"));
            }
          }}
          onClose={() => {
            setShowDeliveryModal(false);
            setEditingDelivery(null);
          }}
        />
      )}
    </div>
  );
}