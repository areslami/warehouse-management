"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "next-intl";
import { fetchProducts } from "@/lib/api/core";
import { fetchCustomers } from "@/lib/api/core";
import { fetchB2BOffers } from "@/lib/api/b2b";
import { Product } from "@/lib/interfaces/core";
import { Customer } from "@/lib/interfaces/core";
import { B2BOffer } from "@/lib/interfaces/b2b";

export interface B2BSaleFormData {
    purchase_id: string;
    offer: number | null;
    cottage_code?: string;
    weight: number;
    unit_price: number;
    total_price?: number;
    sale_date: string;
    product: number;
    customer: number;
    purchase_type: 'cash' | 'credit' | 'agreement' | 'other';
    description?: string;
}

interface B2BSaleModalProps {
    onSubmit: (data: B2BSaleFormData) => Promise<void>;
    onClose: () => void;
    initialData?: Partial<B2BSaleFormData>;
}

export function B2BSaleModal({ onSubmit, onClose, initialData }: B2BSaleModalProps) {
    const t = useTranslations("modals.b2bSale");
    const [formData, setFormData] = useState<B2BSaleFormData>({
        purchase_id: initialData?.purchase_id || "",
        offer: initialData?.offer || null,
        cottage_code: initialData?.cottage_code || "",
        weight: initialData?.weight || 0,
        unit_price: initialData?.unit_price || 0,
        sale_date: initialData?.sale_date || new Date().toISOString().split('T')[0],
        product: initialData?.product || 0,
        customer: initialData?.customer || 0,
        purchase_type: initialData?.purchase_type || 'cash',
        description: initialData?.description || ""
    });

    const [offers, setOffers] = useState<B2BOffer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    // Auto-calculate total price
    useEffect(() => {
        const total = formData.weight * formData.unit_price;
        setFormData(prev => ({ ...prev, total_price: total }));
    }, [formData.weight, formData.unit_price]);

    // When offer is selected, auto-fill product and unit_price
    useEffect(() => {
        if (formData.offer) {
            const selectedOffer = offers.find(o => o.id === formData.offer);
            if (selectedOffer) {
                setFormData(prev => ({
                    ...prev,
                    product: selectedOffer.product,
                    unit_price: selectedOffer.unit_price,
                    cottage_code: selectedOffer.cottage_number || ""
                }));
            }
        }
    }, [formData.offer, offers]);

    const loadData = async () => {
        try {
            const [offersData, productsData, customersData] = await Promise.all([
                fetchB2BOffers(),
                fetchProducts(),
                fetchCustomers()
            ]);

            // Only show active offers
            setOffers(offersData.filter((o: B2BOffer) => o.status === 'active'));
            setProducts(productsData);
            setCustomers(customersData);
        } catch (error) {
            console.error("Failed to load data:", error);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await onSubmit(formData);
            onClose();
        } catch (error) {
            console.error("Failed to submit:", error);
        } finally {
            setLoading(false);
        }
    };

    const isValid = formData.purchase_id && formData.product && formData.customer &&
        formData.weight > 0 && formData.unit_price > 0 && formData.sale_date;

    return (
        <Dialog open onOpenChange={() => onClose()}>
            <DialogContent className="max-w-2xl" dir="rtl">
                <DialogHeader>
                    <DialogTitle>{t("title")}</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                        <label className="text-sm font-medium">{t("purchase_id")}*</label>
                        <Input
                            value={formData.purchase_id}
                            onChange={(e) => setFormData({ ...formData, purchase_id: e.target.value })}
                            placeholder={t("enter_purchase_id")}
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium">{t("offer")}</label>
                        <select
                            className="w-full px-3 py-2 border rounded-md"
                            value={formData.offer || ""}
                            onChange={(e) => setFormData({ ...formData, offer: e.target.value ? Number(e.target.value) : null })}
                        >
                            <option value="">{t("select_offer")}</option>
                            {offers.map((offer) => (
                                <option key={offer.id} value={offer.id}>
                                    {offer.offer_id} - {offer.product_name} ({offer.offer_weight} kg)
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-medium">{t("product")}*</label>
                        <select
                            className="w-full px-3 py-2 border rounded-md"
                            value={formData.product}
                            onChange={(e) => setFormData({ ...formData, product: Number(e.target.value) })}
                            disabled={!!formData.offer}
                        >
                            <option value={0}>{t("select_product")}</option>
                            {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                    {product.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-medium">{t("customer")}*</label>
                        <select
                            className="w-full px-3 py-2 border rounded-md"
                            value={formData.customer}
                            onChange={(e) => setFormData({ ...formData, customer: Number(e.target.value) })}
                        >
                            <option value={0}>{t("select_customer")}</option>
                            {customers.map((customer) => (
                                <option key={customer.id} value={customer.id}>
                                    {customer.company_name || customer.full_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-medium">{t("weight")}*</label>
                        <Input
                            type="number"
                            value={formData.weight}
                            onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                            placeholder="0"
                            step="0.01"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium">{t("unit_price")}*</label>
                        <Input
                            type="number"
                            value={formData.unit_price}
                            onChange={(e) => setFormData({ ...formData, unit_price: Number(e.target.value) })}
                            placeholder="0"
                            disabled={!!formData.offer}
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium">{t("total_price")}</label>
                        <Input
                            type="number"
                            value={formData.total_price || 0}
                            disabled
                            className="bg-gray-50"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium">{t("sale_date")}*</label>
                        <Input
                            type="date"
                            value={formData.sale_date}
                            onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium">{t("purchase_type")}</label>
                        <select
                            className="w-full px-3 py-2 border rounded-md"
                            value={formData.purchase_type}
                            onChange={(e) => setFormData({ ...formData, purchase_type: e.target.value as any })}
                        >
                            <option value="cash">{t("cash")}</option>
                            <option value="credit">{t("credit")}</option>
                            <option value="agreement">{t("agreement")}</option>
                            <option value="other">{t("other")}</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-medium">{t("cottage_code")}</label>
                        <Input
                            value={formData.cottage_code}
                            onChange={(e) => setFormData({ ...formData, cottage_code: e.target.value })}
                            disabled={!!formData.offer}
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="text-sm font-medium">{t("description")}</label>
                        <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" onClick={onClose}>
                        {t("cancel")}
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!isValid || loading}
                        className="bg-[#f6d265] hover:bg-[#f5c842] text-black"
                    >
                        {t("save")}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}