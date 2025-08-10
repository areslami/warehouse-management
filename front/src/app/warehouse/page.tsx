'use client';

import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsTrigger, TabsList, TabsContent } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Warehouse, WarehouseReceipt as WarehouseReceiptType, DispatchIssue, DeliveryFulfillment } from "@/lib/interfaces/warehouse";
import { fetchWarehouses, createWarehouse, updateWarehouse, deleteWarehouse, fetchWarehouseReceipts, updateWarehouseReceipt, deleteWarehouseReceipt, fetchDispatchIssues, updateDispatchIssue, deleteDispatchIssue, fetchDeliveryFulfillments, updateDeliveryFulfillment, deleteDeliveryFulfillment } from "@/lib/api/warehouse";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useModal } from "@/lib/modal-context";
import { WarehouseModal } from "@/components/modals/warehouse-modal";
import { WarehouseReceiptModal } from "@/components/modals/warehouse-receipt-modal";
import { DispatchIssueModal } from "@/components/modals/dispatch-issue-modal";
import { DeliveryFulfillmentModal } from "@/components/modals/delivery-fulfillment-modal";
import { TableCell, TableRow as TableRowComponent } from "@/components/ui/table";
const WarehouseReceiptTab = ({ selectedWarehouseId }: { selectedWarehouseId?: number }) => {
    const t = useTranslations("warehouse_page.receipts");
    const { openModal } = useModal();
    const [receipts, setReceipts] = useState<WarehouseReceiptType[]>([]);
    const [loading, setLoading] = useState(false);

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
        <div className="p-4" dir="rtl">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{t("title")}</h3>
                <Button
                    className="bg-[#f6d265] hover:bg-[#f5c842] text-white"
                    onClick={() => {
                        openModal(WarehouseReceiptModal, {
                            onSubmit: async (data) => {
                                console.log('New Receipt:', data);
                                await refreshReceipts();
                            }
                        })
                    }}
                >
                    <Plus className="ml-2 h-4 w-4" />
                    {t("new_receipt")}
                </Button>
            </div>

            {loading ? (
                <div>{t("loading")}</div>
            ) : (
                <Table className="w-full">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-right">{t("table.operations")}</TableHead>
                            <TableHead className="text-right">{t("table.total_weight")}</TableHead>
                            <TableHead className="text-right">{t("table.date")}</TableHead>
                            <TableHead className="text-right">{t("table.warehouse")}</TableHead>
                            <TableHead className="text-right">{t("table.receipt_type")}</TableHead>
                            <TableHead className="text-right">{t("table.receipt_id")}</TableHead>
                            <TableHead className="text-right">{t("table.id")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {receipts.map((receipt) => (
                            <TableRowComponent key={receipt.id}>
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
                                                        warehouse: receipt.warehouse.id,
                                                        description: receipt.description,
                                                        cottage_serial_number: receipt.cottage_serial_number || "",
                                                        proforma: receipt.proforma?.id || undefined,
                                                        items: receipt.items.map(item => ({
                                                            product: item.product.id,
                                                            weight: item.weight
                                                        }))
                                                    },
                                                    onSubmit: async (data) => {
                                                        await updateWarehouseReceipt(receipt.id, data);
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
                                <TableCell>{receipt.total_weight}</TableCell>
                                <TableCell>{receipt.date}</TableCell>
                                <TableCell>{receipt.warehouse?.name || '-'}</TableCell>
                                <TableCell>{receipt.receipt_type}</TableCell>
                                <TableCell>{receipt.receipt_id || '-'}</TableCell>
                                <TableCell>{receipt.id}</TableCell>
                            </TableRowComponent>
                        ))}
                    </TableBody>
                </Table>
            )}
        </div>
    );
}

const DispatchIssueTab = ({ selectedWarehouseId }: { selectedWarehouseId?: number }) => {
    const t = useTranslations("warehouse_page.issues");
    const { openModal } = useModal();
    const [dispatches, setDispatches] = useState<DispatchIssue[]>([]);
    const [loading, setLoading] = useState(false);

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
        <div className="p-4" dir="rtl">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{t("title")}</h3>
                <Button
                    className="bg-[#f6d265] hover:bg-[#f5c842] text-white"
                    onClick={() => {
                        openModal(DispatchIssueModal, {
                            onSubmit: async (data) => {
                                console.log('New Dispatch:', data);
                                await refreshDispatches();
                            }
                        })
                    }}
                >
                    <Plus className="ml-2 h-4 w-4" />
                    {t("new_issue")}
                </Button>
            </div>

            {loading ? (
                <div>{t("loading")}</div>
            ) : (
                <Table className="w-full">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-right">{t("table.operations")}</TableHead>
                            <TableHead className="text-right">{t("table.total_weight")}</TableHead>
                            <TableHead className="text-right">{t("table.validity_date")}</TableHead>
                            <TableHead className="text-right">{t("table.issue_date")}</TableHead>
                            <TableHead className="text-right">{t("table.warehouse")}</TableHead>
                            <TableHead className="text-right">{t("table.dispatch_id")}</TableHead>
                            <TableHead className="text-right">{t("table.id")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {dispatches.map((dispatch) => (
                            <TableRowComponent key={dispatch.id}>
                                <TableCell>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                openModal(DispatchIssueModal, {
                                                    initialData: {
                                                        ...dispatch,
                                                        warehouse: dispatch.warehouse.id,
                                                        sales_proforma: dispatch.sales_proforma.id,
                                                        items: dispatch.items.map(item => ({
                                                            product: item.product.id,
                                                            weight: item.weight,
                                                            vehicle_type: item.vehicle_type,
                                                            receiver: item.receiver.id
                                                        }))
                                                    },
                                                    onSubmit: async (data) => {
                                                        await updateDispatchIssue(dispatch.id, data);
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
                                <TableCell>{dispatch.total_weight}</TableCell>
                                <TableCell>{dispatch.validity_date}</TableCell>
                                <TableCell>{dispatch.issue_date}</TableCell>
                                <TableCell>{dispatch.warehouse?.name || '-'}</TableCell>
                                <TableCell>{dispatch.dispatch_id}</TableCell>
                                <TableCell>{dispatch.id}</TableCell>
                            </TableRowComponent>
                        ))}
                    </TableBody>
                </Table>
            )}
        </div>
    );
}

const DeliveryFulfillmentTab = ({ selectedWarehouseId }: { selectedWarehouseId?: number }) => {
    const t = useTranslations("warehouse_page.deliveries");
    const { openModal } = useModal();
    const [deliveries, setDeliveries] = useState<DeliveryFulfillment[]>([]);
    const [loading, setLoading] = useState(false);

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
        <div className="p-4" dir="rtl">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{t("title")}</h3>
                <Button
                    className="bg-[#f6d265] hover:bg-[#f5c842] text-white"
                    onClick={() => {
                        openModal(DeliveryFulfillmentModal, {
                            onSubmit: async (data) => {
                                console.log('New Delivery:', data);
                                await refreshDeliveries();
                            }
                        })
                    }}
                >
                    <Plus className="ml-2 h-4 w-4" />
                    {t("new_delivery")}
                </Button>
            </div>

            {loading ? (
                <div>{t("loading")}</div>
            ) : (
                <Table className="w-full">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-right">{t("table.operations")}</TableHead>
                            <TableHead className="text-right">{t("table.total_weight")}</TableHead>
                            <TableHead className="text-right">{t("table.validity_date")}</TableHead>
                            <TableHead className="text-right">{t("table.issue_date")}</TableHead>
                            <TableHead className="text-right">{t("table.warehouse")}</TableHead>
                            <TableHead className="text-right">{t("table.delivery_id")}</TableHead>
                            <TableHead className="text-right">{t("table.id")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {deliveries.map((delivery) => (
                            <TableRowComponent key={delivery.id}>
                                <TableCell>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                openModal(DeliveryFulfillmentModal, {
                                                    initialData: {
                                                        ...delivery,
                                                        warehouse: delivery.warehouse.id,
                                                        sales_proforma: delivery.sales_proforma.id,
                                                        items: delivery.items.map(item => ({
                                                            shipment_id: item.shipment_id,
                                                            shipment_price: item.shipment_price,
                                                            product: item.product.id,
                                                            weight: item.weight,
                                                            vehicle_type: item.vehicle_type,
                                                            receiver: item.receiver.id
                                                        }))
                                                    },
                                                    onSubmit: async (data) => {
                                                        await updateDeliveryFulfillment(delivery.id, data);
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
                                <TableCell>{delivery.total_weight}</TableCell>
                                <TableCell>{delivery.validity_date}</TableCell>
                                <TableCell>{delivery.issue_date}</TableCell>
                                <TableCell>{delivery.warehouse?.name || '-'}</TableCell>
                                <TableCell>{delivery.delivery_id}</TableCell>
                                <TableCell>{delivery.id}</TableCell>
                            </TableRowComponent>
                        ))}
                    </TableBody>
                </Table>
            )}
        </div>
    );
}

export default function WarehousePage() {

    const t = useTranslations("warehouse_page");
    const { openModal } = useModal();

    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | undefined>(undefined);
    const selectedWarehouse = warehouses.find(w => w.id === selectedWarehouseId);
    useEffect(() => {
        const loadWarehouses = async () => {
            try {
                const fetchedWarehouses = await fetchWarehouses();
                if (fetchedWarehouses) {
                    setWarehouses(fetchedWarehouses);
                }
            } catch (err) {
                setError("Failed to load warehouses. " + err);
            } finally {
                setIsLoading(false);
            }
        };

        loadWarehouses();
    }, []);
    if (isLoading) return <div>Loading warehouses...</div>;
    if (error) return <div>Error: {error}</div>;
    return (
        <div className="my-12 mx-8" dir="rtl">
            <h2 className="text-2xl font-bold mb-8">{t("title")}</h2>
            <div className="flex items-center gap-4 mb-4">
                <p>{t("select_warehouse_label")}</p>
                <Select onValueChange={(value) => setSelectedWarehouseId(Number(value))} dir="rtl">
                    <SelectTrigger className="w-[250px] text-right" onSelect={(value) => setSelectedWarehouseId(Number(value))}>
                        <SelectValue placeholder={t("select_warehouse_placeholder")} />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                        {warehouses.map((warehouse) => (
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
                                const fetchedWarehouses = await fetchWarehouses();
                                if (fetchedWarehouses) {
                                    setWarehouses(fetchedWarehouses);
                                }
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
                                                const fetchedWarehouses = await fetchWarehouses();
                                                if (fetchedWarehouses) {
                                                    setWarehouses(fetchedWarehouses);
                                                }
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
                                        const fetchedWarehouses = await fetchWarehouses();
                                        if (fetchedWarehouses) {
                                            setWarehouses(fetchedWarehouses);
                                            setSelectedWarehouseId(undefined);
                                        }
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

            <Tabs defaultValue="receipts" className="mx-2">
                <TabsList>
                    <TabsTrigger value="fullfilment" className="data-[state=active]:bg-[#f6d265] data-[state=active]:text-white data-[state=active]:w-100">{t("fullfilment_tab")}</TabsTrigger>
                    <TabsTrigger value="issue" className="data-[state=active]:bg-[#f6d265] data-[state=active]:text-white data-[state=active]:w-100" >{t("issue_tab")}</TabsTrigger>
                    <TabsTrigger value="receipts" className="data-[state=active]:bg-[#f6d265] data-[state=active]:text-white data-[state=active]:w-100">{t("receipts_tab")}</TabsTrigger>
                </TabsList>
                <TabsContent value="fullfilment"><DeliveryFulfillmentTab selectedWarehouseId={selectedWarehouseId} /></TabsContent>
                <TabsContent value="issue"><DispatchIssueTab selectedWarehouseId={selectedWarehouseId} /></TabsContent>
                <TabsContent value="receipts"><WarehouseReceiptTab selectedWarehouseId={selectedWarehouseId} /></TabsContent>
            </Tabs>
        </div>
    );
}
