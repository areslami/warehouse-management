"use client";

import React from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubItem } from "./ui/sidebar";
import { useTranslations } from "next-intl";
import { useModal } from "@/lib/modal-context";
import { toast } from "sonner";
import { SalesProformaFormData, SalesProformaModal } from "./modals/finance/salesproforma-modal";
import { PurchaseProformaFormData, PurchaseProformaModal } from "./modals/finance/purchaseproforma-modal";
import { WarehouseReceiptFormData, WarehouseReceiptModal } from "./modals/warehouse/warehouse-receipt-modal";
import { DispatchIssueModal } from "./modals/warehouse/dispatch-issue-modal";
import { DeliveryFulfillmentModal } from "./modals/warehouse/delivery-fulfillment-modal";
import { B2BOfferFormData, B2BOfferModal } from "./modals/b2b/b2b-offer-modal";
import { B2BDistributionFormData, B2BDistributionModal } from "./modals/b2b/b2b-distribution-modal";
import { B2BAddressFormData, B2BAddressModal } from "./modals/b2b/b2b-address-modal";

import { Warehouse, DollarSign, ChevronLeft, BadgeCent, Package, Users, Plus } from "lucide-react";
import { createWarehouseReceipt, createDispatchIssue, createDeliveryFulfillment } from "@/lib/api/warehouse";
import { createB2BOffer, createB2BDistribution, createB2BAddress, createB2BSale } from "@/lib/api/b2b";
import Link from "next/link";
import { B2BSaleFormData, B2BSaleModal } from "./modals/b2b/b2b-sale-modal";
import { DeliveryFulfillmentCreate, DispatchIssueCreate } from "@/lib/interfaces/warehouse";
// Define form data types for modals that don't export them
type DispatchIssueFormData = {
  dispatch_id: string;
  warehouse: number;
  sales_proforma: number;
  issue_date: string;
  validity_date: string;
  description?: string;
  shipping_company: number;
  items: {
    product: number;
    weight: number;
    vehicle_type: "single" | "double" | "trailer";
    receiver: number;
  }[];
};

type DeliveryFulfillmentFormData = {
  delivery_id: string;
  issue_date: string;
  validity_date: string;
  warehouse: number;
  sales_proforma: number;
  description?: string;
  shipping_company: number;
  items: {
    shipment_id: string;
    shipment_price: number;
    product: number;
    weight: number;
    vehicle_type: "single" | "double" | "trailer";
    receiver: number;
  }[];
};

export function AppSidebar() {
    const t = useTranslations('sidebar')
    const tCommon = useTranslations('common');
    const { openModal } = useModal();

    const coreItems = [
        {
            name: t("products"),
            icon: Package,
            href: "/products"
        },
        {
            name: t("parties"),
            icon: Users,
            href: "/parties"
        },
    ];
    return (
        <Sidebar dir="rtl" side="right" className="m-0 p-0 w-[20%] list-none">
            <SidebarHeader className="m-0 p-0">
                <SidebarMenuItem className="px-2.5 py-3.5" style={{ backgroundColor: "#f6d265" }}>
                    <Link href="/" className="block w-full">
                        <h1 className="font-bold text-white hover:text-gray-200 transition-colors cursor-pointer">{t("title")}</h1>
                    </Link>
                </SidebarMenuItem>
            </SidebarHeader>
            <SidebarContent className="px-4 py-2.5" style={{ backgroundColor: "#2f323a" }}>
                <SidebarGroup >
                    <SidebarGroupContent className="flex flex-col">
                        {
                            coreItems.map((item) => {
                                return <SidebarMenuItem key={item.name} >
                                    <a href={item.href}>
                                        <SidebarMenuButton
                                            className="bg-[#2f323a] hover:bg-[#40444f] hover:text-black transition-colors duration-300 my-0.5"
                                        >
                                            <div className="flex items-center gap-2 text-white">
                                                <item.icon />
                                                <span>{item.name}</span>
                                            </div>
                                        </SidebarMenuButton>
                                    </a>
                                </SidebarMenuItem>
                            })
                        }

                    </SidebarGroupContent>
                </SidebarGroup>
                <SidebarGroup>
                    <Collapsible defaultOpen className="group/collapsible my-2">
                        <SidebarMenuItem>
                            <div className="flex items-center">
                                <a href="/warehouse" className="flex-1">
                                    <SidebarMenuButton className="bg-[#2f323a] hover:bg-[#40444f] hover:text-black transition-colors duration-300 my-0.5 w-full">
                                        <h3 className="flex items-center gap-2 text-white text-lg cursor-pointer">
                                            <Warehouse />
                                            <span>{t("warehouse")}</span>
                                        </h3>
                                    </SidebarMenuButton>
                                </a>
                                <CollapsibleTrigger asChild>
                                    <button className="p-2 text-white hover:text-gray-300 transition-colors duration-300">
                                        <ChevronLeft className="h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-270" />
                                    </button>
                                </CollapsibleTrigger>
                            </div>
                            <CollapsibleContent className="mx-3.5 mt-0.5">
                                <SidebarMenuSub className="border-l-0 border-r-1 border-gray-50/50 hover:border-gray-100 px-2.5 my-0 py-1.5">
                                    <div className="flex items-center justify-between w-full group">
                                        <Link href="/warehouse?tab=receipts" className="flex-1">
                                            <SidebarMenuSubItem className="text-sm text-white/50 px-1 hover:text-white cursor-pointer">{t("warehouse-receipt")}</SidebarMenuSubItem>
                                        </Link>
                                        <button
                                            className="opacity-0 group-hover:opacity-100 p-1 text-white/50 hover:text-white transition-opacity"
                                            onClick={() => {
                                                openModal(WarehouseReceiptModal as React.ComponentType, {
                                                    onSubmit: async (data: WarehouseReceiptFormData) => {
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
                                                                    weight: typeof item.weight === 'string' ? parseFloat(item.weight) || 0 : item.weight || 0
                                                                }))
                                                            };
                                                            await createWarehouseReceipt(cleanData);
                                                            toast.success(t("warehouse-receipt") + ' - ' + tCommon('toast_messages.create_success_suffix'));
                                                        } catch (error) {
                                                            console.error('Error creating warehouse receipt:', error);
                                                            toast.error(tCommon('toast_messages.warehouse_receipt_error'));
                                                            throw error; // Re-throw to prevent modal from closing
                                                        }
                                                    }
                                                })
                                            }}
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                </SidebarMenuSub>
                                <SidebarMenuSub className="border-l-0 border-r-1 border-gray-50/50 hover:border-gray-100 px-2.5 my-0 py-1.5">
                                    <div className="flex items-center justify-between w-full group">
                                        <Link href="/warehouse?tab=dispatches" className="flex-1">
                                            <SidebarMenuSubItem className="text-sm text-white/50 px-1 hover:text-white cursor-pointer">{t("dispatch-issue")}</SidebarMenuSubItem>
                                        </Link>
                                        <button
                                            className="opacity-0 group-hover:opacity-100 p-1 text-white/50 hover:text-white transition-opacity"
                                            onClick={() => {
                                                openModal(DispatchIssueModal as React.ComponentType, {
                                                    onSubmit: async (data: DispatchIssueFormData) => {
                                                        try {
                                                            const data2: DispatchIssueCreate = {
                                                                ...data,
                                                                total_weight: data.items.reduce((sum: number, item) => sum + (item.weight || 0), 0),
                                                                description: data.description || "",
                                                            }
                                                            await createDispatchIssue(data2);
                                                            toast.success(t("dispatch-issue") + ' - ' + tCommon('toast_messages.create_success_suffix'));
                                                        } catch (error) {
                                                            console.error('Error creating dispatch issue:', error);
                                                            toast.error(tCommon('toast_messages.dispatch_issue_error'));
                                                            throw error; // Re-throw to prevent modal from closing
                                                        }
                                                    }
                                                })
                                            }}
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                </SidebarMenuSub>
                                <SidebarMenuSub className="border-l-0 border-r-1 border-gray-50/50 hover:border-gray-100 px-2.5 my-0 py-1.5">
                                    <div className="flex items-center justify-between w-full group">
                                        <Link href="/warehouse?tab=deliveries" className="flex-1">
                                            <SidebarMenuSubItem className="text-sm text-white/50 px-1 hover:text-white cursor-pointer">{t("delivery-fulfillment")}</SidebarMenuSubItem>
                                        </Link>
                                        <button
                                            className="opacity-0 group-hover:opacity-100 p-1 text-white/50 hover:text-white transition-opacity"
                                            onClick={() => {
                                                openModal(DeliveryFulfillmentModal as React.ComponentType, {
                                                    onSubmit: async (data: DeliveryFulfillmentFormData) => {
                                                        try {
                                                            const data2: DeliveryFulfillmentCreate = {
                                                                ...data,
                                                                total_weight: data.items.reduce((sum: number, item) => sum + (item.weight || 0), 0),
                                                                description: data.description || "",
                                                            }
                                                            await createDeliveryFulfillment(data2);
                                                            toast.success(t("delivery-fulfillment") + ' - ' + tCommon('toast_messages.create_success_suffix'));
                                                        } catch (error) {
                                                            console.error('Error creating delivery fulfillment:', error);
                                                            toast.error(tCommon('toast_messages.delivery_fulfillment_error'));
                                                            throw error; // Re-throw to prevent modal from closing
                                                        }
                                                    }
                                                })
                                            }}
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </SidebarMenuItem>
                    </Collapsible>

                    <Collapsible defaultOpen className="group/collapsible my-2">
                        <SidebarMenuItem>
                            <div className="flex items-center">
                                <a href="/b2b" className="flex-1">
                                    <SidebarMenuButton className="bg-[#2f323a] hover:bg-[#40444f] hover:text-black transition-colors duration-300 my-0.5 w-full">
                                        <h3 className="flex items-center gap-2 text-white text-lg cursor-pointer">
                                            <BadgeCent />
                                            <span>{t("b2b")}</span>
                                        </h3>
                                    </SidebarMenuButton>
                                </a>
                                <CollapsibleTrigger asChild>
                                    <button className="p-2 text-white hover:text-gray-300 transition-colors duration-300">
                                        <ChevronLeft className="h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-270" />
                                    </button>
                                </CollapsibleTrigger>
                            </div>
                            <CollapsibleContent className="mx-3.5 mt-0.5">
                                <SidebarMenuSub className="border-l-0 border-r-1 border-gray-50/50 hover:border-gray-100 px-2.5 my-0 py-1.5">
                                    <div className="flex items-center justify-between w-full group">
                                        <Link href="/b2b?tab=offers" className="flex-1">
                                            <SidebarMenuSubItem className="text-sm text-white/50 px-1 hover:text-white cursor-pointer">{t("b2b-offer")}</SidebarMenuSubItem>
                                        </Link>
                                        <button
                                            className="opacity-0 group-hover:opacity-100 p-1 text-white/50 hover:text-white transition-opacity"
                                            onClick={() => {
                                                openModal(B2BOfferModal as React.ComponentType, {
                                                    onSubmit: async (data: B2BOfferFormData) => {
                                                        try {
                                                            await createB2BOffer(data);

                                                            toast.success(t("b2b-offer") + ' - ' + tCommon('toast_messages.create_success_suffix'));
                                                        } catch (error) {
                                                            console.error('Error creating B2B offer:', error);
                                                            toast.error(tCommon('toast_messages.b2b_offer_error'));
                                                            throw error;
                                                        }
                                                    }
                                                })
                                            }}
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                </SidebarMenuSub>
                                <SidebarMenuSub className="border-l-0 border-r-1 border-gray-50/50 hover:border-gray-100 px-2.5 my-0 py-1.5">
                                    <div className="flex items-center justify-between w-full group">
                                        <Link href="/b2b?tab=distributions" className="flex-1">
                                            <SidebarMenuSubItem className="text-sm text-white/50 px-1 hover:text-white cursor-pointer">{t("b2b-distribution")}</SidebarMenuSubItem>
                                        </Link>
                                        <button
                                            className="opacity-0 group-hover:opacity-100 p-1 text-white/50 hover:text-white transition-opacity"
                                            onClick={() => {
                                                openModal(B2BDistributionModal as React.ComponentType, {
                                                    onSubmit: async (data: B2BDistributionFormData) => {
                                                        try {
                                                            await createB2BDistribution(data);
                                                            toast.success(t("b2b-distribution") + ' - ' + tCommon('toast_messages.create_success_suffix'));
                                                        } catch (error) {
                                                            console.error('Error creating B2B distribution:', error);
                                                            toast.error(tCommon('toast_messages.b2b_distribution_error'));
                                                            throw error;
                                                        }
                                                    }
                                                })
                                            }}
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                </SidebarMenuSub>
                                <SidebarMenuSub className="border-l-0 border-r-1 border-gray-50/50 hover:border-gray-100 px-2.5 my-0 py-1.5">
                                    <div className="flex items-center justify-between w-full group">
                                        <Link href="/b2b?tab=sales" className="flex-1">
                                            <SidebarMenuSubItem className="text-sm text-white/50 px-1 hover:text-white cursor-pointer">{t("b2b-sale")}</SidebarMenuSubItem>
                                        </Link>
                                        <button
                                            className="opacity-0 group-hover:opacity-100 p-1 text-white/50 hover:text-white transition-opacity"
                                            onClick={() => {
                                                openModal(B2BSaleModal as React.ComponentType, {
                                                    onSubmit: async (data: B2BSaleFormData) => {
                                                        try {
                                                            await createB2BSale(data);
                                                            toast.success(t("b2b-sale") + ' - ' + tCommon('toast_messages.create_success_suffix'));
                                                        } catch (error) {
                                                            console.error('Error creating B2B sale:', error);
                                                            toast.error(tCommon('toast_messages.b2b_sale_error'));
                                                            throw error;
                                                        }
                                                    }, onClose: () => {
                                                    }
                                                })
                                            }}
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                </SidebarMenuSub>
                                <SidebarMenuSub className="border-l-0 border-r-1 border-gray-50/50 hover:border-gray-100 px-2.5 my-0 py-1.5">
                                    <div className="flex items-center justify-between w-full group">
                                        <Link href="/b2b?tab=addresses" className="flex-1">
                                            <SidebarMenuSubItem className="text-sm text-white/50 px-1 hover:text-white cursor-pointer">{t("b2b-address")}</SidebarMenuSubItem>
                                        </Link>
                                        <button
                                            className="opacity-0 group-hover:opacity-100 p-1 text-white/50 hover:text-white transition-opacity"
                                            onClick={() => {
                                                openModal(B2BAddressModal as React.ComponentType, {
                                                    onSubmit: async (data: B2BAddressFormData) => {
                                                        try {
                                                            await createB2BAddress(data);
                                                            toast.success(t("b2b-address") + ' - ' + tCommon('toast_messages.create_success_suffix'));
                                                        } catch (error) {
                                                            console.error('Error creating B2B address:', error);
                                                            toast.error(tCommon('toast_messages.b2b_address_error'));
                                                            throw error;
                                                        }
                                                    }
                                                })
                                            }}
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </SidebarMenuItem>
                    </Collapsible>
                    <Collapsible defaultOpen className="group/collapsible my-2">
                        <SidebarMenuItem>
                            <div className="flex items-center">
                                <a href="/finance" className="flex-1">
                                    <SidebarMenuButton className="bg-[#2f323a] hover:bg-[#40444f] hover:text-black transition-colors duration-300 my-0.5 w-full">
                                        <h3 className="flex items-center gap-2 text-white text-lg cursor-pointer">
                                            <DollarSign />
                                            <span>{t("finance")}</span>
                                        </h3>
                                    </SidebarMenuButton>
                                </a>
                                <CollapsibleTrigger asChild>
                                    <button className="p-2 text-white hover:text-gray-300 transition-colors duration-300">
                                        <ChevronLeft className="h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-270" />
                                    </button>
                                </CollapsibleTrigger>
                            </div>
                            <CollapsibleContent className="mx-3.5 mt-0.5">
                                <SidebarMenuSub className="border-l-0 border-r-1 border-gray-50/50 hover:border-gray-100 px-2.5 my-0 py-1.5">
                                    <div className="flex items-center justify-between w-full group">
                                        <Link href="/finance?tab=sales_proforma" className="flex-1">
                                            <SidebarMenuSubItem className="text-sm text-white/50 px-1 hover:text-white cursor-pointer">{t("sale-proforma")}</SidebarMenuSubItem>
                                        </Link>
                                        <button
                                            className="opacity-0 group-hover:opacity-100 p-1 text-white/50 hover:text-white transition-opacity"
                                            onClick={() => {
                                                openModal(SalesProformaModal as React.ComponentType, {
                                                    onSubmit: (data: SalesProformaFormData) => {
                                                        console.log('Sales Proforma Data:', data);
                                                    }
                                                })
                                            }}
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                </SidebarMenuSub>
                                <SidebarMenuSub className="border-l-0 border-r-1 border-gray-50/50 hover:border-gray-100 px-2.5 my-0 py-1.5">
                                    <div className="flex items-center justify-between w-full group">
                                        <Link href="/finance?tab=purchase_proforma" className="flex-1">
                                            <SidebarMenuSubItem className="text-sm text-white/50 px-1 hover:text-white cursor-pointer">{t("purchase-proforma")}</SidebarMenuSubItem>
                                        </Link>
                                        <button
                                            className="opacity-0 group-hover:opacity-100 p-1 text-white/50 hover:text-white transition-opacity"
                                            onClick={() => {
                                                openModal(PurchaseProformaModal as React.ComponentType, {
                                                    onSubmit: (data: PurchaseProformaFormData) => {
                                                        console.log('Purchase Proforma Data:', data);
                                                    }
                                                })
                                            }}
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </SidebarMenuItem>
                    </Collapsible>
                </SidebarGroup>

            </SidebarContent >
        </Sidebar >
    );
}