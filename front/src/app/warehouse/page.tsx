"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, Edit2, Trash2, Package, FileText, Truck, Search, Eye, Info, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { handleApiErrorWithToast } from "@/lib/api/error-toast-handler";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { describeWarehouse } from "@/lib/utils/label-utils";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WarehouseReceiptModal } from "@/components/modals/warehouse/warehouse-receipt-modal";
import { DispatchIssueModal } from "@/components/modals/warehouse/dispatch-issue-modal";
import { DeliveryFulfillmentModal } from "@/components/modals/warehouse/delivery-fulfillment-modal";
import { WarehouseModal } from "@/components/modals/warehouse/warehouse-modal";
import UploadDeliveryModal from "@/components/modals/warehouse/upload-delivery-modal";
import { B2BAddressModal } from "@/components/modals/b2b/b2b-address-modal";
import { B2BDistributionModal } from "@/components/modals/b2b/b2b-distribution-modal";
import { B2BOfferModal } from "@/components/modals/b2b/b2b-offer-modal";
import { useCoreData } from "@/lib/core-data-context";
import {
  fetchWarehouseReceipts, fetchWarehouseReceiptById, createWarehouseReceipt, updateWarehouseReceipt, deleteWarehouseReceipt,
  fetchDispatchIssues, fetchDispatchIssueById, createDispatchIssue, updateDispatchIssue, deleteDispatchIssue,
  fetchDeliveryFulfillments, fetchDeliveryFulfillmentById, createDeliveryFulfillment, updateDeliveryFulfillment, deleteDeliveryFulfillment,
  createWarehouse, updateWarehouse, deleteWarehouse
} from "@/lib/api/warehouse";
import { Warehouse, WarehouseReceipt, DispatchIssue, DeliveryFulfillment } from "@/lib/interfaces/warehouse";
import { B2BAddress, B2BDistribution, B2BOffer } from "@/lib/interfaces/b2b";
import { fetchB2BAddressById, fetchB2BDistributionById, fetchB2BOfferById } from "@/lib/api/b2b";
import { formatNumber } from "@/lib/utils/number-format";

export default function WarehousePage() {
  const t = useTranslations("pages.warehouse");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const { warehouses, refreshData: refreshCoreData } = useCoreData();

  const [receipts, setReceipts] = useState<WarehouseReceipt[]>([]);
  const [dispatches, setDispatches] = useState<DispatchIssue[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryFulfillment[]>([]);
  const [deliveriesKey, setDeliveriesKey] = useState(0);
  const [selectedReceipts, setSelectedReceipts] = useState<number[]>([]);
  const [selectedDispatches, setSelectedDispatches] = useState<number[]>([]);
  const [selectedDeliveries, setSelectedDeliveries] = useState<number[]>([]);

  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [showUploadDeliveryModal, setShowUploadDeliveryModal] = useState(false);

  const [editingReceipt, setEditingReceipt] = useState<WarehouseReceipt | null>(null);
  const [editingDispatch, setEditingDispatch] = useState<DispatchIssue | null>(null);
  const [editingDelivery, setEditingDelivery] = useState<DeliveryFulfillment | null>(null);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WarehouseReceipt | DispatchIssue | DeliveryFulfillment | null>(null);
  const [selectedType, setSelectedType] = useState<'receipt' | 'dispatch' | 'delivery'>('receipt');

  // State for viewing related entities in details sheet
  const [viewingAddress, setViewingAddress] = useState<B2BAddress | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<WarehouseReceipt | null>(null);
  const [viewingDistribution, setViewingDistribution] = useState<B2BDistribution | null>(null);
  const [viewingOffer, setViewingOffer] = useState<B2BOffer | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all");
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabFromUrl = searchParams.get('tab') || 'receipts';
  const [activeTab, setActiveTab] = useState(tabFromUrl);

  useEffect(() => {
    const newTab = searchParams.get('tab') || 'receipts';
    setActiveTab(newTab);
  }, [searchParams]);

  const loadData = useCallback(async () => {
    try {
      const [receiptsData, dispatchesData, deliveriesData] = await Promise.all([
        fetchWarehouseReceipts(),
        fetchDispatchIssues(),
        fetchDeliveryFulfillments()
      ]);
      setReceipts(receiptsData || []);
      setDispatches(dispatchesData || []);
      setDeliveries(deliveriesData || []);
    } catch (error) {
      console.error("Failed to load warehouse data:", error);
      handleApiErrorWithToast(error, "Loading warehouse data");
      
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRowClick = (item: WarehouseReceipt | DispatchIssue | DeliveryFulfillment, type: 'receipt' | 'dispatch' | 'delivery') => {
    setSelectedItem(item);
    setSelectedType(type);
    setSheetOpen(true);
  };

  const handleDeleteReceipt = async (id: number) => {
    if (confirm(t("receipts.confirm_delete"))) {
      try {
        await deleteWarehouseReceipt(id);
        toast.success(tErrors("success_delete"));
        loadData();
      } catch (error) {
        console.error("Failed to delete warehouse receipt:", error);
        handleApiErrorWithToast(error, "Deleting warehouse receipt");
        
      }
    }
  };

  const handleBulkDeleteReceipts = async () => {
    if (selectedReceipts.length === 0) return;
    if (confirm(`Delete ${selectedReceipts.length} selected receipts?`)) {
      try {
        await Promise.all(selectedReceipts.map(id => deleteWarehouseReceipt(id)));
        toast.success(`Deleted ${selectedReceipts.length} receipts`);
        setSelectedReceipts([]);
        loadData();
      } catch (error) {
        toast.error("Failed to delete some receipts");
      }
    }
  };

  const handleDeleteDispatch = async (id: number) => {
    if (confirm(t("issues.confirm_delete"))) {
      try {
        await deleteDispatchIssue(id);
        toast.success(tErrors("success_delete"));
        loadData();
      } catch (error) {
        console.error("Failed to delete dispatch issue:", error);
        handleApiErrorWithToast(error, "Deleting dispatch issue");
        
      }
    }
  };

  const handleBulkDeleteDispatches = async () => {
    if (selectedDispatches.length === 0) return;
    if (confirm(`Delete ${selectedDispatches.length} selected dispatches?`)) {
      try {
        await Promise.all(selectedDispatches.map(id => deleteDispatchIssue(id)));
        toast.success(`Deleted ${selectedDispatches.length} dispatches`);
        setSelectedDispatches([]);
        loadData();
      } catch (error) {
        toast.error("Failed to delete some dispatches");
      }
    }
  };

  const handleDeleteDelivery = async (id: number) => {
    if (confirm(t("deliveries.confirm_delete"))) {
      try {
        await deleteDeliveryFulfillment(id);
        toast.success(tErrors("success_delete"));
        loadData();
      } catch (error) {
        console.error("Failed to delete delivery fulfillment:", error);
        handleApiErrorWithToast(error, "Deleting delivery fulfillment");
        
      }
    }
  };

  const handleBulkDeleteDeliveries = async () => {
    if (selectedDeliveries.length === 0) return;
    if (confirm(`Delete ${selectedDeliveries.length} selected deliveries?`)) {
      try {
        await Promise.all(selectedDeliveries.map(id => deleteDeliveryFulfillment(id)));
        toast.success(`Deleted ${selectedDeliveries.length} deliveries`);
        setSelectedDeliveries([]);
        loadData();
      } catch (error) {
        toast.error("Failed to delete some deliveries");
      }
    }
  };

  const handleDeleteWarehouse = async (id: number) => {
    if (confirm(t("confirm_delete_warehouse"))) {
      try {
        await deleteWarehouse(id);
        toast.success(tErrors("success_delete"));
        refreshCoreData('warehouses');
      } catch (error) {
        console.error("Failed to delete warehouse:", error);
        handleApiErrorWithToast(error, "Deleting warehouse");
        
      }
    }
  };

  const filteredReceipts = useMemo(() => {
    return receipts.filter(receipt => {
      const matchesSearch = (receipt.receipt_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        new Date(receipt.date).toLocaleDateString('fa-IR').includes(searchTerm);
      const matchesWarehouse = selectedWarehouse === "all" || receipt.warehouse === parseInt(selectedWarehouse);
      return matchesSearch && matchesWarehouse;
    });
  }, [receipts, searchTerm, selectedWarehouse]);

  const filteredDispatches = useMemo(() => {
    return dispatches.filter(dispatch => {
      const matchesSearch = (dispatch.dispatch_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        new Date(dispatch.issue_date).toLocaleDateString('fa-IR').includes(searchTerm);
      const matchesWarehouse = selectedWarehouse === "all" || dispatch.warehouse === parseInt(selectedWarehouse);
      return matchesSearch && matchesWarehouse;
    });
  }, [dispatches, searchTerm, selectedWarehouse]);

  const filteredDeliveries = useMemo(() => {
    return deliveries.filter(delivery => {
      const matchesSearch = (delivery.delivery_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        new Date(delivery.issue_date).toLocaleDateString('fa-IR').includes(searchTerm);
      const matchesWarehouse = selectedWarehouse === "all" || delivery.warehouse === parseInt(selectedWarehouse);
      return matchesSearch && matchesWarehouse;
    });
  }, [deliveries, searchTerm, selectedWarehouse]);

  // Component to show B2B Distribution or Offer links
  const DeliveryB2BLinks = ({ offerId, distributionId, setViewingDistribution, setViewingOffer }: { offerId?: number | null, distributionId?: number | null, setViewingDistribution: (d: B2BDistribution | null) => void, setViewingOffer: (o: B2BOffer | null) => void }) => {
    const [linkedDistribution, setLinkedDistribution] = useState<B2BDistribution | null>(null);
    const [linkedOffer, setLinkedOffer] = useState<B2BOffer | null>(null);

    useEffect(() => {
      const fetchB2BLinks = async () => {
        try {
          // Fetch distribution if we have a distribution ID
          if (distributionId) {
            const dist = await fetchB2BDistributionById(distributionId);
            if (dist) setLinkedDistribution(dist);
          }

          // Fetch offer if we have an offer ID
          if (offerId) {
            const offer = await fetchB2BOfferById(offerId);
            if (offer) setLinkedOffer(offer);
          }
        } catch (error) {
          console.error("Failed to fetch B2B links:", error);
        }
      };
      fetchB2BLinks();
    }, [offerId, distributionId]);

    if (!linkedDistribution && !linkedOffer) return null;

    return (
      <div className="flex items-center gap-2">
        {linkedDistribution && (
          <>
            <strong>عاملیت توزیع:</strong>
            <span>{linkedDistribution.transfer_id || '-'}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-5 w-5 p-0 hover:bg-transparent"
              onClick={() => setViewingDistribution(linkedDistribution)}
            >
              <Info className="h-4 w-4 text-[#f6d265]" />
            </Button>
          </>
        )}
        {linkedOffer && (
          <>
            <strong>عرضه:</strong>
            <span>{linkedOffer.offer_id || '-'}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-5 w-5 p-0 hover:bg-transparent"
              onClick={() => setViewingOffer(linkedOffer)}
            >
              <Info className="h-4 w-4 text-[#f6d265]" />
            </Button>
          </>
        )}
      </div>
    );
  };

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
                      {describeWarehouse(warehouse)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="bg-[#f6d265] hover:bg-[#f5c842] text-black"
                onClick={() => {
                  setEditingWarehouse(null);
                  setShowWarehouseModal(true);
                }}
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
                          onClick={() => {
                            setEditingWarehouse(warehouse);
                            setShowWarehouseModal(true);
                          }}
                        >
                          <Edit2 className="h-4 w-4 ml-1" />
                          {t("edit_warehouse")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteWarehouse(warehouse.id)}
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

      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value);
        router.push(`/warehouse?tab=${value}`);
      }} className="w-full">
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
              <div className="flex gap-2">
                {selectedReceipts.length > 0 && (
                  <Button variant="destructive" onClick={handleBulkDeleteReceipts}>
                    <Trash2 className="w-4 h-4 mr-1" />
                    {t("receipts.delete")} ({selectedReceipts.length})
                  </Button>
                )}
                <Button className="bg-[#f6d265] hover:bg-[#f5c842] text-black" onClick={() => {
                  setEditingReceipt(null);
                  setShowReceiptModal(true);
                }}>
                  <Plus className="w-4 h-4 mr-1" />
                  {t("receipts.new_receipt")}
                </Button>
              </div>
            </div>
            <Table dir="rtl">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center w-12">
                    <input
                      type="checkbox"
                      aria-label="انتخاب همه رسیدها"
                      checked={filteredReceipts.length > 0 && selectedReceipts.length === filteredReceipts.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedReceipts(filteredReceipts.map(r => r.id));
                        } else {
                          setSelectedReceipts([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead className="text-right w-16">ردیف</TableHead>
                  <TableHead className="text-right">{t("receipts.table.receipt_id")}</TableHead>
                  <TableHead className="text-right">{t("receipts.table.total_weight")}</TableHead>
                  <TableHead className="text-right">{t("receipts.table.warehouse")}</TableHead>
                  <TableHead className="text-right">{t("receipts.table.date")}</TableHead>
                  <TableHead className="text-center w-24">{t("receipts.table.operations")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceipts.map((receipt, index) => (
                  <TableRow key={receipt.id} className="hover:bg-gray-50">
                    <TableCell className="text-center">
                      <input
                        type="checkbox"
                        aria-label={`انتخاب رسید ${receipt.receipt_id}`}
                        checked={selectedReceipts.includes(receipt.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedReceipts([...selectedReceipts, receipt.id]);
                          } else {
                            setSelectedReceipts(selectedReceipts.filter(id => id !== receipt.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium">{index + 1}</TableCell>
                    <TableCell className="text-right">{receipt.receipt_id}</TableCell>
                    <TableCell className="text-right">{receipt.total_weight}</TableCell>
                    <TableCell className="text-right">{warehouses.find(w => w.id === receipt.warehouse)?.name}</TableCell>
                    <TableCell className="text-right">{new Date(receipt.date).toLocaleDateString('fa-IR')}</TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-center">
                        <Button size="sm" variant="ghost" onClick={() => {
                          handleRowClick(receipt, 'receipt');
                        }}>
                          <Eye className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={async () => {
                          try {
                            const fullReceipt = await fetchWarehouseReceiptById(receipt.id);
                            setEditingReceipt(fullReceipt);
                            setShowReceiptModal(true);
                          } catch (error) {
                            console.error("Failed to fetch receipt details:", error);
                            handleApiErrorWithToast(error, "Fetching receipt details");

                          }
                        }}>
                          <Edit2 className="w-4 h-4 text-gray-600" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => {
                          handleDeleteReceipt(receipt.id);
                        }}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
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
              <div className="flex gap-2">
                {selectedDispatches.length > 0 && (
                  <Button variant="destructive" onClick={handleBulkDeleteDispatches}>
                    <Trash2 className="w-4 h-4 mr-1" />
                    {t("issues.delete")} ({selectedDispatches.length})
                  </Button>
                )}
                <Button className="bg-[#f6d265] hover:bg-[#f5c842] text-black" onClick={() => {
                  setEditingDispatch(null);
                  setShowDispatchModal(true);
                }}>
                  <Plus className="w-4 h-4 mr-1" />
                  {t("issues.new_issue")}
                </Button>
              </div>
            </div>
            <Table dir="rtl">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center w-12">
                    <input
                      type="checkbox"
                      aria-label="انتخاب همه حواله‌ها"
                      checked={filteredDispatches.length > 0 && selectedDispatches.length === filteredDispatches.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDispatches(filteredDispatches.map(d => d.id));
                        } else {
                          setSelectedDispatches([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead className="text-right w-16">ردیف</TableHead>
                  <TableHead className="text-right">{t("issues.table.dispatch_id")}</TableHead>
                  <TableHead className="text-right">{t("issues.table.total_weight")}</TableHead>
                  <TableHead className="text-right">{t("issues.table.warehouse")}</TableHead>
                  <TableHead className="text-right">{t("issues.table.issue_date")}</TableHead>
                  <TableHead className="text-center w-24">{t("issues.table.operations")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDispatches.map((dispatch, index) => (
                  <TableRow key={dispatch.id} className="hover:bg-gray-50">
                    <TableCell className="text-center">
                      <input
                        type="checkbox"
                        aria-label={`انتخاب حواله ${dispatch.dispatch_id}`}
                        checked={selectedDispatches.includes(dispatch.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDispatches([...selectedDispatches, dispatch.id]);
                          } else {
                            setSelectedDispatches(selectedDispatches.filter(id => id !== dispatch.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium">{index + 1}</TableCell>
                    <TableCell className="text-right">{dispatch.dispatch_id}</TableCell>
                    <TableCell className="text-right">{formatNumber(dispatch.total_weight)}</TableCell>
                    <TableCell className="text-right">{warehouses.find(w => w.id === dispatch.warehouse)?.name}</TableCell>
                    <TableCell className="text-right">{new Date(dispatch.issue_date).toLocaleDateString('fa-IR')}</TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-center">
                        <Button size="sm" variant="ghost" onClick={() => {
                          handleRowClick(dispatch, 'dispatch');
                        }}>
                          <Eye className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={async () => {
                          try {
                            const fullDispatch = await fetchDispatchIssueById(dispatch.id);
                            setEditingDispatch(fullDispatch);
                            setShowDispatchModal(true);
                          } catch (error) {
                            console.error("Failed to fetch dispatch details:", error);
                            handleApiErrorWithToast(error, "Fetching dispatch details");

                          }
                        }}>
                          <Edit2 className="w-4 h-4 text-gray-600" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => {
                          handleDeleteDispatch(dispatch.id);
                        }}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
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
              <div className="flex gap-2">
                {selectedDeliveries.length > 0 && (
                  <Button variant="destructive" onClick={handleBulkDeleteDeliveries}>
                    <Trash2 className="w-4 h-4 mr-1" />
                    {t("deliveries.delete")} ({selectedDeliveries.length})
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowUploadDeliveryModal(true)}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  {t("deliveries.import_excel")}
                </Button>
                <Button className="bg-[#f6d265] hover:bg-[#f5c842] text-black" onClick={() => {
                  setEditingDelivery(null);
                  setShowDeliveryModal(true);
                }}>
                  <Plus className="w-4 h-4 mr-1" />
                  {t("deliveries.new_delivery")}
                </Button>
              </div>
            </div>
            <Table dir="rtl">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">
                    <input
                      type="checkbox"
                      aria-label="انتخاب همه تحویل‌ها"
                      checked={filteredDeliveries.length > 0 && selectedDeliveries.length === filteredDeliveries.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDeliveries(filteredDeliveries.map(d => d.id));
                        } else {
                          setSelectedDeliveries([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead className="text-right w-16">ردیف</TableHead>
                  <TableHead className="text-right">{t("deliveries.table.delivery_id")}</TableHead>
                  <TableHead className="text-right">{t("deliveries.table.b2b_address")}</TableHead>
                  <TableHead className="text-right">{t("deliveries.table.warehouse")}</TableHead>
                  <TableHead className="text-right">{t("deliveries.table.issue_date")}</TableHead>
                  <TableHead className="text-right">{t("deliveries.table.total_weight")}</TableHead>
                  <TableHead className="text-right">{t("deliveries.table.product")}</TableHead>
                  <TableHead className="text-right">{t("deliveries.table.receiver")}</TableHead>
                  <TableHead className="text-center w-24">{t("deliveries.table.operations")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody key={deliveriesKey}>
                {filteredDeliveries.map((delivery, index) => {
                  const firstItem = delivery.items?.[0];

                  return (
                    <TableRow key={delivery.id} className="hover:bg-gray-50">
                      <TableCell className="text-center">
                        <input
                          type="checkbox"
                          aria-label={`انتخاب تحویل ${delivery.delivery_id}`}
                          checked={selectedDeliveries.includes(delivery.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDeliveries([...selectedDeliveries, delivery.id]);
                            } else {
                              setSelectedDeliveries(selectedDeliveries.filter(id => id !== delivery.id));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">{index + 1}</TableCell>
                      <TableCell className="text-right">{delivery.delivery_id}</TableCell>
                      <TableCell className="text-right">{delivery.b2b_address_purchase_id || '-'}</TableCell>
                      <TableCell className="text-right">{warehouses.find(w => w.id === delivery.warehouse)?.name || '-'}</TableCell>
                      <TableCell className="text-right">{new Date(delivery.issue_date).toLocaleDateString('fa-IR')}</TableCell>
                      <TableCell className="text-right">{formatNumber(delivery.total_weight)}</TableCell>
                      <TableCell className="text-right">{firstItem?.product_name || '-'}</TableCell>
                      <TableCell className="text-right">{firstItem?.receiver || '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-center">
                          <Button size="sm" variant="ghost" onClick={() => {
                            handleRowClick(delivery, 'delivery');
                          }}>
                            <Eye className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={async () => {
                            try {
                              const fullDelivery = await fetchDeliveryFulfillmentById(delivery.id);
                              setEditingDelivery(fullDelivery);
                              setShowDeliveryModal(true);
                            } catch (error) {
                              console.error("Failed to fetch delivery details:", error);
                              handleApiErrorWithToast(error, "Fetching delivery details");

                            }
                          }}>
                            <Edit2 className="w-4 h-4 text-gray-600" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => {
                            handleDeleteDelivery(delivery.id);
                          }}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
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
                  onClick={async () => {
                    try {
                      if (selectedType === 'receipt') {
                        const fullReceipt = await fetchWarehouseReceiptById(selectedItem.id);
                        setEditingReceipt(fullReceipt);
                        setShowReceiptModal(true);
                      } else if (selectedType === 'dispatch') {
                        const fullDispatch = await fetchDispatchIssueById(selectedItem.id);
                        setEditingDispatch(fullDispatch);
                        setShowDispatchModal(true);
                      } else if (selectedType === 'delivery') {
                        const fullDelivery = await fetchDeliveryFulfillmentById(selectedItem.id);
                        setEditingDelivery(fullDelivery);
                        setShowDeliveryModal(true);
                      }
                      setSheetOpen(false);
                    } catch (error) {
                      console.error("Failed to fetch item details:", error);
                      handleApiErrorWithToast(error, "Fetching item details");
                      
                    }
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
                        toast.success(tCommon("toast_messages.delete_success"));
                        await loadData();
                        setSheetOpen(false);
                      } catch (error) {
                        console.error("Failed to delete item:", error);
                        handleApiErrorWithToast(error, "Deleting item");
                        
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
                    <div><strong>{tCommon('detail_labels.receipt_id')}</strong> {(selectedItem as WarehouseReceipt).receipt_id}</div>
                    <div><strong>{tCommon('detail_labels.date')}</strong> {new Date((selectedItem as WarehouseReceipt).date).toLocaleDateString('fa-IR')}</div>
                    <div><strong>{tCommon('detail_labels.warehouse')}</strong> {warehouses.find(w => w.id === selectedItem.warehouse)?.name}</div>
                    <div><strong>{tCommon('detail_labels.total_weight')}</strong> {selectedItem.total_weight} {tCommon('units.kg')}</div>
                    <div><strong>{tCommon('detail_labels.receipt_type')}</strong> {
                      (selectedItem as WarehouseReceipt).receipt_type === 'import_cottage' ? t('receipts.receipt_types.import_cottage') :
                      (selectedItem as WarehouseReceipt).receipt_type === 'distribution_cottage' ? t('receipts.receipt_types.distribution_cottage') :
                      t('receipts.receipt_types.purchase')
                    }</div>
                    {selectedItem.description && <div><strong>{tCommon('detail_labels.description')}</strong> {selectedItem.description}</div>}
                    {(selectedItem as WarehouseReceipt).items?.length > 0 && (
                      <div>
                        <strong>{tCommon('detail_labels.items')}</strong>
                        <ul className="mt-2 space-y-2">
                          {(selectedItem as WarehouseReceipt).items.map((item, idx: number) => (
                            <li key={idx} className="bg-white p-3 rounded border">
                              <div>{tCommon('product_labels.product_prefix')} {item.product}</div>
                              <div className="text-sm text-gray-600">{tCommon('detail_labels.weight')} {item.weight} {tCommon('units.kg')}</div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
                {selectedType === 'dispatch' && (
                  <>
                    <div><strong>{tCommon('detail_labels.dispatch_id')}</strong> {(selectedItem as DispatchIssue).dispatch_id}</div>
                    <div><strong>{tCommon('detail_labels.issue_date')}</strong> {new Date((selectedItem as DispatchIssue).issue_date).toLocaleDateString('fa-IR')}</div>
                    <div><strong>{tCommon('detail_labels.validity_date')}</strong> {new Date((selectedItem as DispatchIssue).validity_date).toLocaleDateString('fa-IR')}</div>
                    <div><strong>{tCommon('detail_labels.warehouse')}</strong> {warehouses.find(w => w.id === selectedItem.warehouse)?.name}</div>
                    <div><strong>{tCommon('detail_labels.total_weight')}</strong> {selectedItem.total_weight} {tCommon('units.kg')}</div>
                    {selectedItem.description && <div><strong>{tCommon('detail_labels.description')}</strong> {selectedItem.description}</div>}
                  </>
                )}
                {selectedType === 'delivery' && (() => {
                  const delivery = selectedItem as DeliveryFulfillment;
                  return (
                    <>
                      <div>
                        <strong>شناسه بارنامه:</strong> {delivery.delivery_id}
                      </div>
                      <div>
                        <strong>سریال بارنامه:</strong> {delivery.waybill_serial || '-'}
                      </div>
                      <div>
                        <strong>انبار:</strong> {warehouses.find(w => w.id === delivery.warehouse)?.name || '-'}
                      </div>
                      <div className="flex items-center gap-2">
                        <strong>آدرس بازارگاه:</strong>
                        <span>{delivery.b2b_address_purchase_id || '-'}</span>
                        {delivery.b2b_address && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 p-0 hover:bg-transparent"
                            onClick={async () => {
                              try {
                                const address = await fetchB2BAddressById(delivery.b2b_address!);
                                if (address) setViewingAddress(address);
                              } catch (error) {
                                console.error("Failed to fetch address:", error);
                              }
                            }}
                          >
                            <Info className="h-4 w-4 text-[#f6d265]" />
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <strong>رسید انبار:</strong>
                        <span>{delivery.warehouse_receipt_id || '-'}</span>
                        {delivery.warehouse_receipt && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 p-0 hover:bg-transparent"
                            onClick={async () => {
                              try {
                                const receipt = await fetchWarehouseReceiptById(delivery.warehouse_receipt!);
                                if (receipt) setViewingReceipt(receipt);
                              } catch (error) {
                                console.error("Failed to fetch receipt:", error);
                              }
                            }}
                          >
                            <Info className="h-4 w-4 text-[#f6d265]" />
                          </Button>
                        )}
                      </div>
                      <div>
                        <strong>شرکت حمل:</strong> {delivery.shipping_company_name || '-'}
                      </div>
                      <div>
                        <strong>تاریخ صدور:</strong> {new Date(delivery.issue_date).toLocaleDateString('fa-IR')}
                      </div>

                      {/* Show Distribution or Offer if exists */}
                      {(delivery.offer || delivery.distribution) && (
                        <DeliveryB2BLinks offerId={delivery.offer} distributionId={delivery.distribution} setViewingDistribution={setViewingDistribution} setViewingOffer={setViewingOffer} />
                      )}

                      {/* Driver Information */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <strong className="block mb-2">اطلاعات راننده:</strong>
                        <div className="mr-4 space-y-1">
                          <div><strong>نام:</strong> {delivery.driver_name || '-'}</div>
                          <div><strong>شماره تلفن:</strong> {delivery.driver_phone || '-'}</div>
                          <div><strong>شماره پلاک:</strong> {delivery.driver_license_plate || '-'}</div>
                        </div>
                      </div>

                      {/* Description */}
                      {delivery.description && (
                        <div className="mt-2">
                          <strong>توضیحات:</strong> {delivery.description}
                        </div>
                      )}

                      {/* Items */}
                      {delivery.items && delivery.items.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <strong className="block mb-2">اقلام:</strong>
                          <div className="space-y-3">
                            {delivery.items.map((item, idx) => (
                              <div key={idx} className="bg-white p-3 rounded border mr-4">
                                <div><strong>محصول:</strong> {item.product_name || '-'}</div>
                                <div><strong>وزن (کیلوگرم):</strong> {formatNumber(item.weight)}</div>
                                <div><strong>مشتری:</strong> {item.customer_name || '-'}</div>
                                <div><strong>مقصد:</strong> {item.destination || '-'}</div>
                                <div><strong>گیرنده:</strong> {item.receiver || '-'}</div>
                                <div><strong>کرایه (ریال):</strong> {formatNumber(item.fare || 0)}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {showReceiptModal && (
        <WarehouseReceiptModal
          isEditing={!!editingReceipt}
          initialData={editingReceipt ? {
            ...editingReceipt,
            receipt_id: editingReceipt.receipt_id || undefined,
            cottage_serial_number: editingReceipt.cottage_serial_number || undefined,
            warehouse: editingReceipt.warehouse ? Number(editingReceipt.warehouse) : 0,
            proforma: editingReceipt.proforma ? Number(editingReceipt.proforma) : undefined,
            items: editingReceipt.items?.map(item => ({
              product: item.product ? Number(item.product) : 0,
              weight: typeof item.weight === 'string' ? parseFloat(item.weight) : Number(item.weight),
            })) || [],
          } : undefined}
          onSubmit={async (data) => {
            try {
              // Clean the data - remove empty strings and undefined values for optional fields
              const cleanData = {
                ...data,
                receipt_id: data.receipt_id?.trim() || undefined,
                description: data.description?.trim() || undefined,
                cottage_serial_number: data.cottage_serial_number?.trim() || undefined,
                proforma: data.proforma && data.proforma > 0 ? data.proforma : undefined,
                items: data.items.map(item => ({
                  product: item.product,
                  weight: typeof item.weight === 'string' ? parseFloat(item.weight) : item.weight,
                })),
              };

              if (editingReceipt) {
                await updateWarehouseReceipt(editingReceipt.id, cleanData);
                toast.success(tCommon("toast_messages.update_success"));
              } else {
                await createWarehouseReceipt(cleanData);
                toast.success(tCommon("toast_messages.create_success"));
              }
              await loadData();
              setShowReceiptModal(false);
              setEditingReceipt(null);
            } catch (error) {
              console.error("Failed to save warehouse receipt:", error);
              handleApiErrorWithToast(error, editingReceipt ? "Updating warehouse receipt" : "Creating warehouse receipt");
              
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
          isEditing={!!editingDispatch}
          initialData={editingDispatch ? {
            ...editingDispatch,
            warehouse: editingDispatch.warehouse ? Number(editingDispatch.warehouse) : 0,
            sales_proforma: editingDispatch.sales_proforma ? Number(editingDispatch.sales_proforma) : 0,
            shipping_company: editingDispatch.shipping_company ? Number(editingDispatch.shipping_company) : 0,
            items: editingDispatch.items?.map(item => ({
              product: item.product ? Number(item.product) : 0,
              weight: typeof item.weight === 'string' ? parseFloat(item.weight) : (item.weight ?? 0),
              vehicle_type: item.vehicle_type,
              receiver: item.receiver ? Number(item.receiver) : 0,
            })) || [],
          } : undefined}
          onSubmit={async (data) => {
            try {
              // Convert weights to numbers and calculate total weight
              const itemsWithNumericWeights = data.items.map(item => ({
                ...item,
                weight: typeof item.weight === 'string' ? parseFloat(item.weight) : (item.weight ?? 0),
              }));
              const totalWeight = itemsWithNumericWeights.reduce((sum, item) => sum + item.weight, 0);
              const submitData = {
                ...data,
                items: itemsWithNumericWeights,
                total_weight: totalWeight,
                description: data.description || ""
              };

              if (editingDispatch) {
                await updateDispatchIssue(editingDispatch.id, submitData);
                toast.success(tCommon("toast_messages.update_success"));
              } else {
                await createDispatchIssue(submitData);
                toast.success(tCommon("toast_messages.create_success"));
              }
              await loadData();
              setShowDispatchModal(false);
              setEditingDispatch(null);
            } catch (error) {
              console.error("Failed to save dispatch issue:", error);
              handleApiErrorWithToast(error, editingDispatch ? "Updating dispatch issue" : "Creating dispatch issue");
              
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
          isEditing={!!editingDelivery}
          initialData={editingDelivery ? {
            ...editingDelivery,
            b2b_address: editingDelivery.b2b_address ? Number(editingDelivery.b2b_address) : 0,
            warehouse_receipt: editingDelivery.warehouse_receipt ? Number(editingDelivery.warehouse_receipt) : 0,
            shipping_company: editingDelivery.shipping_company ? Number(editingDelivery.shipping_company) : 0,
            items: editingDelivery.items?.map(item => ({
              ...item,
              product: item.product ? Number(item.product) : 0,
              weight: Number(item.weight),
              customer: item.customer ? Number(item.customer) : 0,
              fare: Number(item.fare),
            })) || [],
          } : undefined}
          onSubmit={async (data) => {
            try {
              // Calculate total weight from items
              const totalWeight = data.items.reduce((sum: number, item: { weight: number }) => sum + item.weight, 0);
              const submitData = {
                ...data,
                total_weight: totalWeight,
                description: data.description || ""
              };

              if (editingDelivery) {
                await updateDeliveryFulfillment(editingDelivery.id, submitData);
                toast.success(tCommon("toast_messages.update_success"));
              } else {
                await createDeliveryFulfillment(submitData);
                toast.success(tCommon("toast_messages.create_success"));
              }
              await loadData();
              setShowDeliveryModal(false);
              setEditingDelivery(null);
            } catch (error) {
              console.error("Failed to save delivery fulfillment:", error);
              handleApiErrorWithToast(error, editingDelivery ? "Updating delivery fulfillment" : "Creating delivery fulfillment");
              
            }
          }}
          onClose={() => {
            setShowDeliveryModal(false);
            setEditingDelivery(null);
          }}
        />
      )}

      {showWarehouseModal && (
        <WarehouseModal
          initialData={editingWarehouse || undefined}
          onSubmit={async (data) => {
            try {
              if (editingWarehouse) {
                await updateWarehouse(editingWarehouse.id, data);
                toast.success(tCommon("toast_messages.update_success"));
              } else {
                const warehouseData = {
                  ...data,
                  description: data.description || ""
                };
                await createWarehouse(warehouseData);
                toast.success(tCommon("toast_messages.create_success"));
              }
              await refreshCoreData('warehouses');
              setShowWarehouseModal(false);
              setEditingWarehouse(null);
            } catch (error) {
              console.error("Failed to save warehouse:", error);
              handleApiErrorWithToast(error, editingWarehouse ? "Updating warehouse" : "Creating warehouse");
              
            }
          }}
          onClose={() => {
            setShowWarehouseModal(false);
            setEditingWarehouse(null);
          }}
        />
      )}

      {/* Read-only modals for viewing related entities from delivery details */}
      {viewingAddress && (
        <B2BAddressModal
          initialData={{
            ...viewingAddress,
            product: viewingAddress.product ?? 0,
            customer: viewingAddress.customer ?? 0,
            purchase_date: viewingAddress.purchase_date ?? undefined,
            receiver: viewingAddress.receiver ?? undefined,
            product_offer: viewingAddress.product_offer ?? undefined,
          }}
          readOnly={true}
          onClose={() => setViewingAddress(null)}
        />
      )}

      {viewingReceipt && (
        <WarehouseReceiptModal
          initialData={{
            ...viewingReceipt,
            warehouse: viewingReceipt.warehouse ?? undefined,
            receipt_id: viewingReceipt.receipt_id ?? undefined,
            cottage_serial_number: viewingReceipt.cottage_serial_number ?? undefined,
            proforma: viewingReceipt.proforma ?? undefined,
          }}
          readOnly={true}
          onClose={() => setViewingReceipt(null)}
        />
      )}

      {viewingDistribution && (
        <B2BDistributionModal
          initialData={viewingDistribution}
          readOnly={true}
          onClose={() => setViewingDistribution(null)}
        />
      )}

      {viewingOffer && (
        <B2BOfferModal
          initialData={viewingOffer}
          readOnly={true}
          onClose={() => setViewingOffer(null)}
        />
      )}

      {showUploadDeliveryModal && (
        <UploadDeliveryModal
          isOpen={showUploadDeliveryModal}
          onClose={() => setShowUploadDeliveryModal(false)}
          onSuccess={async () => {
            // Refresh deliveries data immediately
            try {
              const deliveriesData = await fetchDeliveryFulfillments();
              setDeliveries(deliveriesData || []);
              setDeliveriesKey(prev => prev + 1); // Force re-render
              // Also refresh full data in background
              loadData();
            } catch (error) {
              console.error("Failed to refresh deliveries:", error);
              // Fallback to full refresh
              await loadData();
            }
            // DON'T close modal - let user decide when to close
          }}
        />
      )}
    </div>
  );
}
