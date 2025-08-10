'use client';

import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsTrigger, TabsList, TabsContent } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { PersianDateTableCell } from "@/components/ui/persian-date-table-cell";
import { WarehouseReceipt as WarehouseReceiptType, DispatchIssue, DeliveryFulfillment } from "@/lib/interfaces/warehouse";
import { createWarehouse, updateWarehouse, deleteWarehouse, fetchWarehouseReceipts, createWarehouseReceipt, updateWarehouseReceipt, deleteWarehouseReceipt, fetchDispatchIssues, createDispatchIssue, updateDispatchIssue, deleteDispatchIssue, fetchDeliveryFulfillments, createDeliveryFulfillment, updateDeliveryFulfillment, deleteDeliveryFulfillment } from "@/lib/api/warehouse";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { useModal } from "@/lib/modal-context";
import { useCoreData } from "@/lib/core-data-context";
import { WarehouseModal } from "@/components/modals/warehouse-modal";
import { WarehouseReceiptModal } from "@/components/modals/warehouse-receipt-modal";
import { DispatchIssueModal } from "@/components/modals/dispatch-issue-modal";
import { DeliveryFulfillmentModal } from "@/components/modals/delivery-fulfillment-modal";
import { TableCell, TableRow as TableRowComponent } from "@/components/ui/table";
const WarehouseReceiptTab = ({ selectedWarehouseId }: { selectedWarehouseId?: number }) => {
    const t = useTranslations("warehouse_page.receipts");
    const tReceipt = useTranslations("warehouseReceipt");
    const { openModal } = useModal();
    const [receipts, setReceipts] = useState<WarehouseReceiptType[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    
    // Helper function to translate receipt type
    const getReceiptTypeLabel = (type: string) => {
        const typeMap: Record<string, string> = {
            'import_cottage': tReceipt('type-import'),
            'distribution_cottage': tReceipt('type-distribution'),
            'purchase': tReceipt('type-purchase')
        };
        return typeMap[type] || type;
    };

    useEffect(() => {
        const loadReceipts = async () => {
            setLoading(true);
            try {
                const fetchedReceipts = await fetchWarehouseReceipts();
                if (fetchedReceipts) {
                    const filteredReceipts = selectedWarehouseId
                        ? fetchedReceipts.filter(r => r.warehouse.id === selectedWarehouseId)
                        : fetchedReceipts;
                    setReceipts(filteredReceipts);
                }
            } catch (error) {
                console.error('Failed to load receipts:', error);
            } finally {
                setLoading(false);
            }
        };

        loadReceipts();
    }, [selectedWarehouseId]);

    // Filter receipts based on search term
    const filteredReceipts = receipts.filter(receipt => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
            receipt.receipt_id?.toLowerCase().includes(searchLower) ||
            receipt.receipt_type.toLowerCase().includes(searchLower) ||
            receipt.warehouse?.name.toLowerCase().includes(searchLower) ||
            receipt.description?.toLowerCase().includes(searchLower)
        );
    });

    const refreshReceipts = async () => {
        const fetchedReceipts = await fetchWarehouseReceipts();
        if (fetchedReceipts) {
            const filteredReceipts = selectedWarehouseId
                ? fetchedReceipts.filter(r => r.warehouse.id === selectedWarehouseId)
                : fetchedReceipts;
            setReceipts(filteredReceipts);
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
                        onClick={() => {
                            openModal(WarehouseReceiptModal, {
                                onSubmit: async (data) => {
                                    try {
                                        console.log("Creating receipt with data:", data);
                                        // Calculate total weight from items
                                        const totalWeight = data.items.reduce((sum, item) => sum + (item.weight || 0), 0);
                                        const receiptData = {
                                            ...data,
                                            total_weight: totalWeight
                                        };
                                        console.log("Sending to API:", receiptData);
                                        const result = await createWarehouseReceipt(receiptData);
                                        console.log("API result:", result);
                                        await refreshReceipts();
                                    } catch (error) {
                                        console.error("Failed to create receipt:", error);
                                    }
                                }
                            })
                        }}
                    >
                        <Plus className="ml-2 h-4 w-4" />
                        {t("new_receipt")}
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
                                <TableHead className="text-right">{t("table.receipt_id")}</TableHead>
                                <TableHead className="text-right">{t("table.receipt_type")}</TableHead>
                                <TableHead className="text-right">{t("table.warehouse")}</TableHead>
                                <TableHead className="text-right">{t("table.date")}</TableHead>
                                <TableHead className="text-right">{t("table.total_weight")}</TableHead>
                                <TableHead className="text-right">{t("table.operations")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredReceipts.map((receipt) => (
                                <TableRowComponent key={receipt.id}>
                                    <TableCell>{receipt.id}</TableCell>
                                    <TableCell>{receipt.receipt_id || '-'}</TableCell>
                                    <TableCell>{getReceiptTypeLabel(receipt.receipt_type)}</TableCell>
                                    <TableCell>{receipt.warehouse?.name || '-'}</TableCell>
                                    <TableCell><PersianDateTableCell date={receipt.date} /></TableCell>
                                    <TableCell>{receipt.total_weight}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    openModal(WarehouseReceiptModal, {
                                                        initialData: {
                                                            receipt_id: receipt.receipt_id || "",
                                                            receipt_type: receipt.receipt_type,
                                                            date: receipt.date,
                                                            warehouse: receipt.warehouse?.id || 0,
                                                            description: receipt.description,
                                                            cottage_serial_number: receipt.cottage_serial_number || "",
                                                            proforma: receipt.proforma?.id || undefined,
                                                            items: receipt.items?.map(item => ({
                                                                product: item.product?.id || 0,
                                                                weight: item.weight || 0
                                                            })) || []
                                                        },
                                                        onSubmit: async (data) => {
                                                            // Calculate total weight from items
                                                            const totalWeight = data.items.reduce((sum, item) => sum + (item.weight || 0), 0);
                                                            const receiptData = {
                                                                ...data,
                                                                total_weight: totalWeight
                                                            };
                                                            await updateWarehouseReceipt(receipt.id, receiptData);
                                                            await refreshReceipts();
                                                        }
                                                    })
                                                }}
                                            >
                                                <Edit className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-red-600 hover:bg-red-50"
                                                onClick={async () => {
                                                    if (confirm(t("confirm_delete"))) {
                                                        await deleteWarehouseReceipt(receipt.id);
                                                        await refreshReceipts();
                                                    }
                                                }}
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

const DispatchIssueTab = ({ selectedWarehouseId }: { selectedWarehouseId?: number }) => {
    const t = useTranslations("warehouse_page.issues");
    const { openModal } = useModal();
    const [dispatches, setDispatches] = useState<DispatchIssue[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const loadDispatches = async () => {
            setLoading(true);
            try {
                const fetchedDispatches = await fetchDispatchIssues();
                if (fetchedDispatches) {
                    const filteredDispatches = selectedWarehouseId
                        ? fetchedDispatches.filter(d => d.warehouse.id === selectedWarehouseId)
                        : fetchedDispatches;
                    setDispatches(filteredDispatches);
                }
            } catch (error) {
                console.error('Failed to load dispatches:', error);
            } finally {
                setLoading(false);
            }
        };

        loadDispatches();
    }, [selectedWarehouseId]);

    // Filter dispatches based on search term
    const filteredDispatches = dispatches.filter(dispatch => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
            dispatch.dispatch_id?.toLowerCase().includes(searchLower) ||
            dispatch.warehouse?.name.toLowerCase().includes(searchLower) ||
            dispatch.description?.toLowerCase().includes(searchLower)
        );
    });

    const refreshDispatches = async () => {
        const fetchedDispatches = await fetchDispatchIssues();
        if (fetchedDispatches) {
            const filteredDispatches = selectedWarehouseId
                ? fetchedDispatches.filter(d => d.warehouse.id === selectedWarehouseId)
                : fetchedDispatches;
            setDispatches(filteredDispatches);
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
                        onClick={() => {
                            openModal(DispatchIssueModal, {
                                onSubmit: async (data) => {
                                    const totalWeight = data.items.reduce((sum, item) => sum + (item.weight || 0), 0);
                                    const dispatchData = {
                                        ...data,
                                        total_weight: totalWeight
                                    };
                                    await createDispatchIssue(dispatchData);
                                    await refreshDispatches();
                                }
                            })
                        }}
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
                                    <TableCell>{dispatch.warehouse?.name || '-'}</TableCell>
                                    <TableCell><PersianDateTableCell date={dispatch.issue_date} /></TableCell>
                                    <TableCell><PersianDateTableCell date={dispatch.validity_date} /></TableCell>
                                    <TableCell>{dispatch.total_weight}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    openModal(DispatchIssueModal, {
                                                        initialData: {
                                                            dispatch_id: dispatch.dispatch_id || "",
                                                            warehouse: dispatch.warehouse?.id || 0,
                                                            sales_proforma: dispatch.sales_proforma?.id || 0,
                                                            issue_date: dispatch.issue_date,
                                                            validity_date: dispatch.validity_date,
                                                            description: dispatch.description || "",
                                                            shipping_company: dispatch.shipping_company || 0,
                                                            items: dispatch.items?.map(item => ({
                                                                product: item.product?.id || 0,
                                                                weight: item.weight || 0,
                                                                vehicle_type: item.vehicle_type || "truck",
                                                                receiver: item.receiver?.id || 0
                                                            })) || []
                                                        },
                                                        onSubmit: async (data) => {
                                                            // Calculate total weight from items
                                                            const totalWeight = data.items.reduce((sum, item) => sum + (item.weight || 0), 0);
                                                            const dispatchData = {
                                                                ...data,
                                                                total_weight: totalWeight
                                                            };
                                                            await updateDispatchIssue(dispatch.id, dispatchData);
                                                            await refreshDispatches();
                                                        }
                                                    })
                                                }}
                                            >
                                                <Edit className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-red-600 hover:bg-red-50"
                                                onClick={async () => {
                                                    if (confirm(t("confirm_delete"))) {
                                                        await deleteDispatchIssue(dispatch.id);
                                                        await refreshDispatches();
                                                    }
                                                }}
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

const DeliveryFulfillmentTab = ({ selectedWarehouseId }: { selectedWarehouseId?: number }) => {
    const t = useTranslations("warehouse_page.deliveries");
    const { openModal } = useModal();
    const [deliveries, setDeliveries] = useState<DeliveryFulfillment[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const loadDeliveries = async () => {
            setLoading(true);
            try {
                const fetchedDeliveries = await fetchDeliveryFulfillments();
                if (fetchedDeliveries) {
                    const filteredDeliveries = selectedWarehouseId
                        ? fetchedDeliveries.filter(d => d.warehouse.id === selectedWarehouseId)
                        : fetchedDeliveries;
                    setDeliveries(filteredDeliveries);
                }
            } catch (error) {
                console.error('Failed to load deliveries:', error);
            } finally {
                setLoading(false);
            }
        };

        loadDeliveries();
    }, [selectedWarehouseId]);

    // Filter deliveries based on search term
    const filteredDeliveries = deliveries.filter(delivery => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
            delivery.delivery_id?.toLowerCase().includes(searchLower) ||
            delivery.warehouse?.name.toLowerCase().includes(searchLower) ||
            delivery.description?.toLowerCase().includes(searchLower)
        );
    });

    const refreshDeliveries = async () => {
        const fetchedDeliveries = await fetchDeliveryFulfillments();
        if (fetchedDeliveries) {
            const filteredDeliveries = selectedWarehouseId
                ? fetchedDeliveries.filter(d => d.warehouse.id === selectedWarehouseId)
                : fetchedDeliveries;
            setDeliveries(filteredDeliveries);
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
                        onClick={() => {
                            openModal(DeliveryFulfillmentModal, {
                                onSubmit: async (data) => {
                                    // Calculate total weight from items
                                    const totalWeight = data.items.reduce((sum, item) => sum + (item.weight || 0), 0);
                                    const deliveryData = {
                                        ...data,
                                        total_weight: totalWeight
                                    };
                                    await createDeliveryFulfillment(deliveryData);
                                    await refreshDeliveries();
                                }
                            })
                        }}
                    >
                        <Plus className="ml-2 h-4 w-4" />
                        {t("new_delivery")}
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
                                    <TableCell>{delivery.warehouse?.name || '-'}</TableCell>
                                    <TableCell><PersianDateTableCell date={delivery.issue_date} /></TableCell>
                                    <TableCell><PersianDateTableCell date={delivery.validity_date} /></TableCell>
                                    <TableCell>{delivery.total_weight}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    openModal(DeliveryFulfillmentModal, {
                                                        initialData: {
                                                            delivery_id: delivery.delivery_id || "",
                                                            issue_date: delivery.issue_date,
                                                            validity_date: delivery.validity_date,
                                                            warehouse: delivery.warehouse?.id || 0,
                                                            sales_proforma: delivery.sales_proforma?.id || 0,
                                                            description: delivery.description || "",
                                                            shipping_company: delivery.shipping_company || 0,
                                                            items: delivery.items?.map(item => ({
                                                                shipment_id: item.shipment_id || "",
                                                                shipment_price: item.shipment_price || 0,
                                                                product: item.product?.id || 0,
                                                                weight: item.weight || 0,
                                                                vehicle_type: item.vehicle_type || "truck",
                                                                receiver: item.receiver?.id || 0
                                                            })) || []
                                                        },
                                                        onSubmit: async (data) => {
                                                            // Calculate total weight from items
                                                            const totalWeight = data.items.reduce((sum, item) => sum + (item.weight || 0), 0);
                                                            const deliveryData = {
                                                                ...data,
                                                                total_weight: totalWeight
                                                            };
                                                            await updateDeliveryFulfillment(delivery.id, deliveryData);
                                                            await refreshDeliveries();
                                                        }
                                                    })
                                                }}
                                            >
                                                <Edit className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-red-600 hover:bg-red-50"
                                                onClick={async () => {
                                                    if (confirm(t("confirm_delete"))) {
                                                        await deleteDeliveryFulfillment(delivery.id);
                                                        await refreshDeliveries();
                                                    }
                                                }}
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
    }, []);
    return (
        <div className="min-h-screen p-4" dir="rtl">
            <h2 className="text-2xl font-bold mb-6">{t("title")}</h2>
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
                    onClick={() => {
                        openModal(WarehouseModal, {
                            onSubmit: async (data) => {
                                await createWarehouse(data);
                                await refreshData('warehouses');
                            }
                        })
                    }}
                >
                    <Plus className="ml-2 h-4 w-4" />
                    {t("add_warehouse")}
                </Button>
            </div>

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
                                onClick={() => {
                                    openModal(WarehouseModal, {
                                        initialData: selectedWarehouse,
                                        onSubmit: async (data) => {
                                            if (selectedWarehouseId) {
                                                await updateWarehouse(selectedWarehouseId, data);
                                                await refreshData('warehouses');
                                            }
                                        }
                                    })
                                }}
                            >
                                <Edit className="h-4 w-4 ml-1" />
                                {t("edit_warehouse")}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:bg-red-50"
                                onClick={async () => {
                                    if (selectedWarehouseId && confirm(t("confirm_delete_warehouse"))) {
                                        await deleteWarehouse(selectedWarehouseId);
                                        await refreshData('warehouses');
                                        setSelectedWarehouseId(undefined);
                                    }
                                }}
                            >
                                <Trash2 className="h-4 w-4 ml-1" />
                                {t("delete_warehouse")}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <Tabs defaultValue="receipts" className="flex-1 flex flex-col h-[calc(100vh-250px)]">
                <TabsList className="w-full grid grid-cols-3">
                    <TabsTrigger value="fullfilment" className="data-[state=active]:bg-[#f6d265] data-[state=active]:text-white">{t("fullfilment_tab")}</TabsTrigger>
                    <TabsTrigger value="issue" className="data-[state=active]:bg-[#f6d265] data-[state=active]:text-white">{t("issue_tab")}</TabsTrigger>
                    <TabsTrigger value="receipts" className="data-[state=active]:bg-[#f6d265] data-[state=active]:text-white">{t("receipts_tab")}</TabsTrigger>
                </TabsList>
                <TabsContent value="fullfilment" className="flex-1 overflow-auto"><DeliveryFulfillmentTab selectedWarehouseId={selectedWarehouseId} /></TabsContent>
                <TabsContent value="issue" className="flex-1 overflow-auto"><DispatchIssueTab selectedWarehouseId={selectedWarehouseId} /></TabsContent>
                <TabsContent value="receipts" className="flex-1 overflow-auto"><WarehouseReceiptTab selectedWarehouseId={selectedWarehouseId} /></TabsContent>
            </Tabs>
        </div>
    );
}
