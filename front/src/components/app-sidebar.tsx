"use client";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubItem } from "./ui/sidebar";
import { useTranslations } from "next-intl";
import { useModal } from "@/lib/modal-context";
import { SalesProformaModal } from "./modals/salesproforma-modal";
import { PurchaseProformaModal } from "./modals/purchaseproforma-modal";
import { WarehouseReceiptModal } from "./modals/warehouse-receipt-modal";
import { DispatchIssueModal } from "./modals/dispatch-issue-modal";
import { DeliveryFulfillmentModal } from "./modals/delivery-fulfillment-modal";
import { B2BOfferModal } from "./modals/b2b-offer-modal";
import { B2BDistributionModal } from "./modals/b2b-distribution-modal";
import { B2BSaleModal } from "./modals/b2b-sale-modal";

import { Warehouse, Cable, Truck, User, DollarSign, ChevronLeft, BadgeCent, Package, Users } from "lucide-react";
export function AppSidebar() {
    const t = useTranslations('sidebar')
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
                    <a href="/" className="block w-full">
                        <h1 className="font-bold text-white hover:text-gray-200 transition-colors cursor-pointer">{t("title")}</h1>
                    </a>
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
                                <SidebarMenuSub
                                    className="border-l-0 border-r-1 border-gray-50/50 hover:border-gray-100 px-2.5 my-0 py-1.5 cursor-pointer"
                                    onClick={() => {
                                        openModal(WarehouseReceiptModal, {
                                            onSubmit: (data) => {
                                                console.log('Warehouse Receipt Data:', data);
                                            }
                                        })
                                    }}
                                >
                                    <SidebarMenuSubItem className="text-sm text-white/50 px-1 hover:text-white">{t("warehouse-receipt")}</ SidebarMenuSubItem>
                                </SidebarMenuSub>
                                <SidebarMenuSub
                                    className="border-l-0 border-r-1 border-gray-50/50 hover:border-gray-100 px-2.5 my-0 py-1.5 cursor-pointer"
                                    onClick={() => {
                                        openModal(DispatchIssueModal, {
                                            onSubmit: (data) => {
                                                console.log('Dispatch Issue Data:', data);
                                            }
                                        })
                                    }}
                                >
                                    <SidebarMenuSubItem className="text-sm text-white/50 px-1 hover:text-white">{t("dispatch-issue")}</ SidebarMenuSubItem>
                                </SidebarMenuSub>
                                <SidebarMenuSub
                                    className="border-l-0 border-r-1 border-gray-50/50 hover:border-gray-100 px-2.5 my-0 py-1.5 cursor-pointer"
                                    onClick={() => {
                                        openModal(DeliveryFulfillmentModal, {
                                            onSubmit: (data) => {
                                                console.log('Delivery Fulfillment Data:', data);
                                            }
                                        })
                                    }}
                                >
                                    <SidebarMenuSubItem className="text-sm text-white/50 px-1 hover:text-white">{t("delivery-fulfillment")}</ SidebarMenuSubItem>
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
                                <SidebarMenuSub 
                                    className="border-l-0 border-r-1 border-gray-50/50 hover:border-gray-100 px-2.5 my-0 py-1.5 cursor-pointer"
                                    onClick={() => {
                                        openModal(B2BOfferModal, {
                                            onSubmit: (data) => {
                                                console.log('B2B Offer Data:', data);
                                            }
                                        })
                                    }}
                                >
                                    <SidebarMenuSubItem className="text-sm text-white/50 px-1 hover:text-white">{t("b2b-offer")}</ SidebarMenuSubItem>
                                </SidebarMenuSub>
                                <SidebarMenuSub 
                                    className="border-l-0 border-r-1 border-gray-50/50 hover:border-gray-100 px-2.5 my-0 py-1.5 cursor-pointer"
                                    onClick={() => {
                                        openModal(B2BDistributionModal, {
                                            onSubmit: (data) => {
                                                console.log('B2B Distribution Data:', data);
                                            }
                                        })
                                    }}
                                >
                                    <SidebarMenuSubItem className="text-sm text-white/50 px-1 hover:text-white">{t("b2b-distribution")}</ SidebarMenuSubItem>
                                </SidebarMenuSub>
                                <SidebarMenuSub 
                                    className="border-l-0 border-r-1 border-gray-50/50 hover:border-gray-100 px-2.5 my-0 py-1.5 cursor-pointer"
                                    onClick={() => {
                                        openModal(B2BSaleModal, {
                                            onSubmit: (data) => {
                                                console.log('B2B Sale Data:', data);
                                            }
                                        })
                                    }}
                                >
                                    <SidebarMenuSubItem className="text-sm text-white/50 px-1 hover:text-white">{t("b2b-sale")}</ SidebarMenuSubItem>
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
                                <SidebarMenuSub
                                    className="border-l-0 border-r-1 border-gray-50/50 hover:border-gray-100 px-2.5 my-0 py-1.5 cursor-pointer"
                                    onClick={() => {
                                        openModal(SalesProformaModal, {
                                            onSubmit: (data) => {
                                                console.log('Sales Proforma Data:', data);
                                            }
                                        })
                                    }}
                                >
                                    <SidebarMenuSubItem className="text-sm text-white/50 px-1 hover:text-white">{t("sale-proforma")}</ SidebarMenuSubItem>
                                </SidebarMenuSub>
                                <SidebarMenuSub
                                    className="border-l-0 border-r-1 border-gray-50/50 hover:border-gray-100 px-2.5 my-0 py-1.5 cursor-pointer"
                                    onClick={() => {
                                        openModal(PurchaseProformaModal, {
                                            onSubmit: (data) => {
                                                console.log('Purchase Proforma Data:', data);
                                            }
                                        })
                                    }}
                                >
                                    <SidebarMenuSubItem className="text-sm text-white/50 px-1 hover:text-white">{t("purchase-proforma")}</ SidebarMenuSubItem>
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </SidebarMenuItem>
                    </Collapsible>
                </SidebarGroup>

            </SidebarContent >
        </Sidebar >
    );
}