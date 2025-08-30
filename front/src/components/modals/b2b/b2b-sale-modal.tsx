"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../../ui/form";
import { Input } from "../../ui/input";
import { convertPersianToEnglishNumbers } from "@/lib/utils/number-format";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCoreData } from "@/lib/core-data-context";
import { ProductModal } from "../product-modal";
import { CustomerModal } from "../customer-modal";
import { createProduct, createCustomer } from "@/lib/api/core";
import { fetchB2BOffers, createB2BOffer } from "@/lib/api/b2b";
import { B2BOffer } from "@/lib/interfaces/b2b";
import { PersianDatePicker } from "../../ui/persian-date-picker";
import { getPartyDisplayName } from "@/lib/utils/party-utils";
import { B2BOfferModal } from "./b2b-offer-modal";

export type B2BSaleFormData = {
    purchase_id: string;
    offer: number | null;
    cottage_code?: string;
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
}

export function B2BSaleModal({ trigger, onSubmit, onClose, initialData }: B2BSaleModalProps) {
    const tval = useTranslations("modals.b2bSale.validation");
    const t = useTranslations("modals.b2bSale");
    const { products, customers, refreshData: refreshCoreData } = useCoreData();
    const [offers, setOffers] = useState<B2BOffer[]>([]);
    const [showProductModal, setShowProductModal] = useState(false);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [showOfferModal, setShowOfferModal] = useState(false);

    useEffect(() => {
        if (products.length === 0) {
            refreshCoreData('products');
        }
        if (customers.length === 0) {
            refreshCoreData('customers');
        }
        loadOffers();
    }, [products.length, customers.length, refreshCoreData]);

    const loadOffers = async () => {
        try {
            const offersData = await fetchB2BOffers();
            setOffers(offersData.filter((o: B2BOffer) => o.status === 'active') || []);
        } catch (error) {
            console.error('Error loading offers:', error);
        }
    };

    const b2bSaleSchema = z.object({
        purchase_id: z.string().min(1, tval("purchase-id")),
        offer: z.number().nullable().optional(),
        cottage_code: z.string().optional(),
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
            offer: initialData?.offer || null,
            cottage_code: initialData?.cottage_code || "",
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
    const weight = form.watch("weight");
    const unitPrice = form.watch("unit_price");

    useEffect(() => {
        if (selectedOffer && selectedOffer !== 0 && offers.length > 0) {
            const offer = offers.find(o => o.id === selectedOffer);
            if (offer) {
                form.setValue('product', offer.product);
                form.setValue('unit_price', offer.unit_price);
                form.setValue('cottage_code', offer.cottage_number || "");
            }
        } else if (selectedOffer === 0) {
            // Clear fields when "no offer" is selected
            form.setValue('cottage_code', "");
            // Don't clear product and unit_price to allow manual entry
        }
    }, [selectedOffer, offers, form]);


    const handleSubmit = async (data: B2BSaleFormData) => {
        try {
            await onSubmit?.(data);
            if (trigger) {
                setOpen(false);
            } else {
                onClose?.();
            }
            form.reset();
        } catch (error) {
            console.error("Error submitting sale:", error);
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
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control as any}
                                    name="offer"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("offer")}</FormLabel>
                                            <FormControl>
                                                <Select
                                                    value={field.value ? field.value.toString() : ""}
                                                    onValueChange={(value) => {
                                                        if (value === "new") {
                                                            setShowOfferModal(true);
                                                        } else {
                                                            field.onChange(value ? Number(value) : null);
                                                        }
                                                    }}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={t("select-offer")} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="0">
                                                            {t("no-offer")}
                                                        </SelectItem>
                                                        <SelectItem
                                                            value="new"
                                                            className="font-semibold text-[#f6d265]"
                                                            onPointerDown={(e) => e.preventDefault()}
                                                        >
                                                            <Plus className="inline-block w-4 h-4 mr-2" />
                                                            {t("create-new-offer")}
                                                        </SelectItem>
                                                        {offers.length > 0 && (
                                                            <div className="border-t my-1" />
                                                        )}
                                                        {offers.map((offer) => (
                                                            <SelectItem key={offer.id} value={offer.id.toString()}>
                                                                {offer.offer_id} - {offer.product_name} ({offer.offer_weight} kg)
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control as any}
                                    name="product"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("product")}</FormLabel>
                                            <FormControl>
                                                <Select
                                                    value={field.value > 0 ? field.value.toString() : ""}
                                                    onValueChange={(value) => {
                                                        if (value === "new") {
                                                            setShowProductModal(true);
                                                        } else if (value) {
                                                            field.onChange(Number(value));
                                                        }
                                                    }}
                                                    disabled={!!selectedOffer}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={t("select-product")} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem
                                                            value="new"
                                                            className="font-semibold text-[#f6d265]"
                                                            onPointerDown={(e) => e.preventDefault()}
                                                        >
                                                            <Plus className="inline-block w-4 h-4 mr-2" />
                                                            {t("create-new-product")}
                                                        </SelectItem>
                                                        {products.length > 0 && (
                                                            <div className="border-t my-1" />
                                                        )}
                                                        {products.map((product) => (
                                                            <SelectItem key={product.id} value={product.id.toString()}>
                                                                {product.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
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
                                                <Select
                                                    value={field.value > 0 ? field.value.toString() : ""}
                                                    onValueChange={(value) => {
                                                        if (value === "new") {
                                                            setShowCustomerModal(true);
                                                        } else if (value) {
                                                            field.onChange(Number(value));
                                                        }
                                                    }}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={t("select-customer")} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem
                                                            value="new"
                                                            className="font-semibold text-[#f6d265]"
                                                            onPointerDown={(e) => e.preventDefault()}
                                                        >
                                                            <Plus className="inline-block w-4 h-4 mr-2" />
                                                            {t("create-new-customer")}
                                                        </SelectItem>
                                                        {customers.length > 0 && (
                                                            <div className="border-t my-1" />
                                                        )}
                                                        {customers.map((customer) => (
                                                            <SelectItem key={customer.id} value={customer.id.toString()}>
                                                                {getPartyDisplayName(customer)}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
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
                                                <Input
                                                    type="text"
                                                    {...field}
                                                    onChange={(e) => {
                                                        const value = convertPersianToEnglishNumbers(e.target.value);
                                                        field.onChange(Number(value));
                                                    }}
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
                                                <Input
                                                    type="text"
                                                    {...field}
                                                    onChange={(e) => {
                                                        const value = convertPersianToEnglishNumbers(e.target.value);
                                                        field.onChange(Number(value));
                                                    }}
                                                    disabled={!!selectedOffer}
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

                                <FormField
                                    control={form.control as any}
                                    name="cottage_code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("cottage-code")}</FormLabel>
                                            <FormControl>
                                                <Input {...field} disabled={!!selectedOffer} />
                                            </FormControl>
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
                                <Button type="submit" className="hover:bg-[#f6d265]">{t("save")}</Button>
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
        </>
    );
}