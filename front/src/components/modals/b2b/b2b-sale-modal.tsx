"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../../ui/form";
import { Input } from "../../ui/input";
import { SimpleCombobox } from "../../ui/simple-combobox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { NumberInput } from "../../ui/number-input";
import { useTranslations } from "next-intl";
import { useCoreData } from "@/lib/core-data-context";
import { ProductModal } from "../product-modal";
import { CustomerModal } from "../customer-modal";
import { createProduct, createCustomer } from "@/lib/api/core";
import { fetchB2BOffers, createB2BOffer, createB2BDistribution, fetchB2BDistributions } from "@/lib/api/b2b";
import { B2BDistribution, B2BOffer } from "@/lib/interfaces/b2b";
import { PersianDatePicker } from "../../ui/persian-date-picker";
import { getPartyDisplayName } from "@/lib/utils/party-utils";
import { describeProduct, describeParty, describeOffer, describeDistribution } from "@/lib/utils/label-utils";
import { B2BOfferModal } from "./b2b-offer-modal";
import { B2BDistributionModal } from "./b2b-distribution-modal";

export type B2BSaleFormData = {
    purchase_id: string;
    is_distributor: boolean;
    offer: number | null;
    b2b_distribution: number | null;
    weight: number;
    unit_price: number;
    sale_date: string;
    product: number;
    customer: number;
    purchase_type: 'cash' | 'credit' | 'agreement' | 'other';
    description?: string;
};

interface B2BSaleModalProps {
    trigger?: React.ReactNode;
    onSubmit?: (data: B2BSaleFormData) => Promise<void>;
    onClose?: () => void;
    initialData?: Partial<B2BSaleFormData>;
    isEditing?: boolean;
}

export function B2BSaleModal({ trigger, onSubmit, onClose, initialData, isEditing }: B2BSaleModalProps) {
    const tval = useTranslations("modals.b2bSale.validation");
    const t = useTranslations("modals.b2bSale");
    const tCommon = useTranslations("common");
    const { products, customers, refreshData: refreshCoreData } = useCoreData();
    const [offers, setOffers] = useState<B2BOffer[]>([]);
    const [distributions, setDistributions] = useState<B2BDistribution[]>([]);
    const [showProductModal, setShowProductModal] = useState(false);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [showOfferModal, setShowOfferModal] = useState(false);
    const [ShowDistribtuionModal, setShowDistribtuionModal] = useState(false);
    const [saleType, setSaleType] = useState<"your_sale" | "distributor_sale">(
        initialData?.is_distributor ? "distributor_sale" : "your_sale"
    );

    useEffect(() => {
        if (products.length === 0) {
            refreshCoreData('products');
        }
        if (customers.length === 0) {
            refreshCoreData('customers');
        }
        loadOffers();
        loadDistributions();
    }, [products.length, customers.length, refreshCoreData]);

    const loadOffers = async () => {
        try {
            const offersData = await fetchB2BOffers();
            setOffers(offersData);
        } catch (error) {
            console.error('Error loading offers:', error);
        }
    };
    const loadDistributions = async () => {
        try {
            const offersData = await fetchB2BDistributions();
            setDistributions(offersData);
        } catch (error) {
            console.error('Error loading distribuitons:', error);
        }
    };


    const b2bSaleSchema = z.object({
        purchase_id: z.string().min(1, tval("purchase-id")),
        is_distributor: z.boolean(),
        offer: z.number().nullable().optional(),
        b2b_distribution: z.number().nullable().optional(),
        weight: z.number().positive(tval("weight")),
        unit_price: z.number().positive(tval("unit-price")),
        sale_date: z.string().min(1, tval("sale-date")),
        product: z.number().min(1, tval("product")),
        customer: z.number().min(1, tval("customer")),
        purchase_type: z.enum(['cash', 'credit', 'agreement', 'other']),
        description: z.string().optional(),
    });

    const [open, setOpen] = useState(trigger ? false : true);

    const form = useForm<B2BSaleFormData>({
        resolver: zodResolver(b2bSaleSchema) as any,
        defaultValues: {
            purchase_id: initialData?.purchase_id || "",
            is_distributor: initialData?.is_distributor || false,
            offer: initialData?.offer || null,
            b2b_distribution: initialData?.b2b_distribution || null,
            weight: initialData?.weight || 0,
            unit_price: initialData?.unit_price || 0,
            sale_date: initialData?.sale_date || new Date().toISOString().split('T')[0],
            product: initialData?.product || 0,
            customer: initialData?.customer || 0,
            purchase_type: initialData?.purchase_type || 'cash',
            description: initialData?.description || "",
        },
    });

    const selectedOffer = form.watch("offer");
    const selectedDistribution = form.watch("b2b_distribution");

    useEffect(() => {
        if (selectedOffer && selectedOffer !== 0 && offers.length > 0) {
            const offer = offers.find(o => o.id === selectedOffer);
            if (offer && offer.product_id) {
                form.setValue('product', offer.product_id, { shouldValidate: false, shouldDirty: true, shouldTouch: true });
                form.setValue('unit_price', Number(offer.unit_price), { shouldValidate: false, shouldDirty: true, shouldTouch: true });
            }
        }
    }, [selectedOffer, offers, form]);

    useEffect(() => {
        if (selectedDistribution && selectedDistribution !== 0 && distributions.length > 0) {
            const distribution = distributions.find(d => d.id === selectedDistribution);
            if (distribution && distribution.product_id) {
                form.setValue('product', distribution.product_id, { shouldValidate: false, shouldDirty: true, shouldTouch: true });
                form.setValue('unit_price', Number(distribution.unit_price), { shouldValidate: false, shouldDirty: true, shouldTouch: true });
            }
        }
    }, [selectedDistribution, distributions, form]);


    const handleSubmit = async (data: B2BSaleFormData) => {
        try {
            const result = await onSubmit?.(data);

            // If this is a "your sale", refresh sales proformas in core data
            // The backend automatically creates a sales proforma, so we need to refresh to see it
            if (!data.is_distributor) {
                await refreshCoreData('salesProformas');
            }

            if (trigger) {
                setOpen(false);
            } else {
                onClose?.();
            }
            form.reset();
        } catch (error) {
            console.error("Error submitting sale:", error);
            throw error;
        }
    };

    const handleClose = () => {
        if (trigger) {
            setOpen(false);
        } else {
            onClose?.();
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={trigger ? setOpen : handleClose}>
                {trigger && (
                    <DialogTrigger asChild>
                        {trigger}
                    </DialogTrigger>
                )}
                <DialogContent dir="rtl" className="min-w-[70%] max-h-[90vh] overflow-y-auto scrollbar-hide p-0 my-0 mx-auto [&>button]:hidden">
                    <DialogHeader className="px-3.5 py-4.5 justify-start" style={{ backgroundColor: "#f6d265" }}>
                        <DialogTitle className="font-bold text-white text-right">{t("title")}</DialogTitle>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4 px-12">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control as any}
                                    name="purchase_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("purchase-id")}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    readOnly={isEditing}
                                                    className={isEditing ? "bg-white cursor-not-allowed" : ""}
                                                    autoFocus={false}
                                                    tabIndex={isEditing ? -1 : undefined}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t("sale_type")}</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                value="your_sale"
                                                checked={saleType === "your_sale"}
                                                onChange={(e) => {
                                                    setSaleType(e.target.value as "your_sale" | "distributor_sale");
                                                    form.setValue("is_distributor", false);
                                                    form.setValue("b2b_distribution", null);
                                                }}
                                                className="mr-2"
                                            />
                                            {t("your_sale")}
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                value="distributor_sale"
                                                checked={saleType === "distributor_sale"}
                                                onChange={(e) => {
                                                    setSaleType(e.target.value as "your_sale" | "distributor_sale");
                                                    form.setValue("is_distributor", true);
                                                    form.setValue("offer", null);
                                                }}
                                                className="mr-2"
                                            />
                                            {t("distributor_sale")}
                                        </label>
                                    </div>
                                </div>

                                {saleType === "your_sale" && (
                                    <FormField
                                        control={form.control as any}
                                        name="offer"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t("offer")}</FormLabel>
                                                <FormControl>
                                                    <SimpleCombobox
                                                        value={field.value ? field.value.toString() : ""}
                                                        onValueChange={(value) => {
                                                            field.onChange(value && value !== "0" ? Number(value) : null);
                                                        }}
                                                        options={[
                                                            { value: "0", label: t("no-offer") },
                                                            ...offers.map(offer => ({
                                                                value: offer.id.toString(),
                                                                label: describeOffer(offer),
                                                                id: offer.id,
                                                                name: offer.offer_id
                                                            }))
                                                        ]}
                                                        placeholder={t("select-offer")}
                                                        searchPlaceholder={tCommon("search_placeholders.search_offers")}
                                                        showCreateNew={true}
                                                        createNewText={t("create-new-offer")}
                                                        onCreateNew={() => setShowOfferModal(true)}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />)}
                                {saleType === "distributor_sale" && (<FormField
                                    control={form.control as any}
                                    name="b2b_distribution"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("distribution")}</FormLabel>
                                            <FormControl>
                                                <SimpleCombobox
                                                    value={field.value ? field.value.toString() : ""}
                                                    onValueChange={(value) => {
                                                        field.onChange(value && value !== "0" ? Number(value) : null);
                                                    }}
                                                    options={[
                                                        ...distributions.map(distribution => ({
                                                            value: distribution.id.toString(),
                                                            label: describeDistribution(distribution),
                                                            id: distribution.id,
                                                            name: distribution.transfer_id
                                                        }))
                                                    ]}
                                                    placeholder={t("select-distribution")}
                                                    searchPlaceholder={tCommon("search_placeholders.search_distributions")}
                                                    showCreateNew={true}
                                                    createNewText={t("create-new-distribution")}
                                                    onCreateNew={() => setShowDistribtuionModal(true)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />)}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control as any}
                                    name="product"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("product")}</FormLabel>
                                            <div className={(saleType === "your_sale" && !!selectedOffer) || (saleType === "distributor_sale" && !!selectedDistribution) ? "pointer-events-none opacity-60" : ""}>
                                                <FormControl>
                                                    <SimpleCombobox
                                                        value={field.value > 0 ? field.value.toString() : ""}
                                                        onValueChange={(value) => {
                                                            if (value) {
                                                                field.onChange(Number(value));
                                                            }
                                                        }}
                                                        options={products.map(product => ({
                                                            value: product.id.toString(),
                                                            label: describeProduct(product),
                                                            id: product.id,
                                                            name: product.name
                                                        }))}
                                                        placeholder={t("select-product")}
                                                        searchPlaceholder={tCommon("search_placeholders.search_products")}
                                                        showCreateNew={true}
                                                        createNewText={t("create-new-product")}
                                                        onCreateNew={() => setShowProductModal(true)}
                                                    />
                                                </FormControl>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control as any}
                                    name="customer"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("customer")}</FormLabel>
                                            <FormControl>
                                                <SimpleCombobox
                                                    value={field.value > 0 ? field.value.toString() : ""}
                                                    onValueChange={(value) => {
                                                        if (value) {
                                                            field.onChange(Number(value));
                                                        }
                                                    }}
                                                    options={customers.map(customer => ({
                                                        value: customer.id.toString(),
                                                        label: describeParty(customer),
                                                        id: customer.id,
                                                        name: getPartyDisplayName(customer)
                                                    }))}
                                                    placeholder={t("select-customer")}
                                                    searchPlaceholder={tCommon("search_placeholders.search_customers")}
                                                    showCreateNew={true}
                                                    createNewText={t("create-new-customer")}
                                                    onCreateNew={() => setShowCustomerModal(true)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control as any}
                                    name="weight"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("weight")}</FormLabel>
                                            <FormControl>
                                                <NumberInput
                                                    value={field.value || 0}
                                                    onChange={(value) => field.onChange(value)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control as any}
                                    name="unit_price"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("unit-price")}</FormLabel>
                                            <FormControl>
                                                <NumberInput
                                                    value={field.value || 0}
                                                    onChange={(value) => field.onChange(value)}
                                                    readOnly={(saleType === "your_sale" && !!selectedOffer) || (saleType === "distributor_sale" && !!selectedDistribution)}
                                                    className={(saleType === "your_sale" && !!selectedOffer) || (saleType === "distributor_sale" && !!selectedDistribution) ? "opacity-60 cursor-not-allowed" : ""}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control as any}
                                name="sale_date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("sale-date")}</FormLabel>
                                        <FormControl>
                                            <PersianDatePicker
                                                value={field.value}
                                                onChange={(value) => field.onChange(value)}
                                                placeholder={t("select-date")}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control as any}
                                    name="purchase_type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("purchase-type")}</FormLabel>
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t("select-purchase-type")} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="cash">{t("cash")}</SelectItem>
                                                    <SelectItem value="credit">{t("credit")}</SelectItem>
                                                    <SelectItem value="agreement">{t("agreement")}</SelectItem>
                                                    <SelectItem value="other">{t("other")}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />


                            </div>

                            <FormField
                                control={form.control as any}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("description")} <span className="text-gray-400 text-sm">{t("optional")}</span></FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex justify-end space-x-2">
                                <Button type="button" variant="outline" onClick={handleClose}>
                                    {t("cancel")}
                                </Button>
                                <Button type="submit" className="hover:bg-[#f6d265]">
                                    {saleType === "your_sale" ? t("save-and-create-proforma") : t("save")}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {showProductModal && (
                <ProductModal
                    onSubmit={async (newProduct) => {
                        const created = await createProduct(newProduct);
                        if (created) {
                            await refreshCoreData('products');
                            form.setValue('product', created.id);
                            setShowProductModal(false);
                        }
                    }}
                    onClose={() => setShowProductModal(false)}
                />
            )}

            {showCustomerModal && (
                <CustomerModal
                    onSubmit={async (newCustomer) => {
                        const created = await createCustomer(newCustomer);
                        if (created) {
                            await refreshCoreData('customers');
                            form.setValue('customer', created.id);
                            setShowCustomerModal(false);
                        }
                    }}
                    onClose={() => setShowCustomerModal(false)}
                />
            )}

            {showOfferModal && (
                <B2BOfferModal
                    onSubmit={async (newOffer) => {
                        const created = await createB2BOffer(newOffer);
                        if (created) {
                            await loadOffers();
                            form.setValue('offer', created.id);
                            setShowOfferModal(false);
                        }
                    }}
                    onClose={() => setShowOfferModal(false)}
                />
            )}

            {ShowDistribtuionModal && (
                <B2BDistributionModal
                    onSubmit={async (newDistribution) => {
                        const created = await createB2BDistribution(newDistribution);
                        if (created) {
                            await loadDistributions();
                            form.setValue('b2b_distribution', created.id);
                            setShowDistribtuionModal(false);
                        }
                    }}
                    onClose={() => setShowDistribtuionModal(false)}
                />
            )}
        </>
    );
}
