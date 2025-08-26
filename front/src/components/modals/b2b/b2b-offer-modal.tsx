"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../../ui/form";
import { Input } from "../../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCoreData } from "@/lib/core-data-context";
import { ProductModal } from "../product-modal";
import { createProduct } from "@/lib/api/core";
import { PersianDatePicker } from "../../ui/persian-date-picker";

export type B2BOfferFormData = {
  offer_id: string;
  product: number;
  offer_weight: number;
  unit_price: number;
  status: 'pending' | 'active' | 'sold' | 'expired';
  offer_type?: 'cash' | 'credit' | 'agreement';
  offer_date: string;
  offer_exp_date: string;
  description?: string;
};

interface B2BOfferModalProps {
  trigger?: React.ReactNode;
  onSubmit?: (data: B2BOfferFormData) => Promise<void>;
  onClose?: () => void;
  initialData?: Partial<B2BOfferFormData>;
}

export function B2BOfferModal({ trigger, onSubmit, onClose, initialData }: B2BOfferModalProps) {
  const tval = useTranslations("modals.b2bOffer.validation");
  const t = useTranslations("modals.b2bOffer");
  const { products, refreshData: refreshCoreData } = useCoreData();
  const [showProductModal, setShowProductModal] = useState(false);

  useEffect(() => {
    if (products.length === 0) {
      refreshCoreData('products');
    }
  }, [products.length, refreshCoreData]);


  const b2bOfferSchema = z.object({
    offer_id: z.string().min(1, tval("offer-id")),
    product: z.number().min(1, tval("product")),
    offer_weight: z.number().positive(tval("offer-weight")),
    unit_price: z.number().positive(tval("unit-price")),
    status: z.enum(['pending', 'active', 'sold', 'expired']),
    offer_type: z.enum(['cash', 'credit', 'agreement']).optional(),
    offer_date: z.string().min(1, tval("offer-date")),
    offer_exp_date: z.string().min(1, tval("offer-exp-date")),
    description: z.string().optional(),
  });

  const [open, setOpen] = useState(trigger ? false : true);

  const form = useForm<B2BOfferFormData>({
    resolver: zodResolver(b2bOfferSchema),
    defaultValues: {
      offer_id: initialData?.offer_id || "",
      product: initialData?.product || 0,
      offer_weight: initialData?.offer_weight || 0,
      unit_price: initialData?.unit_price || 0,
      status: initialData?.status || 'pending',
      offer_type: initialData?.offer_type || 'cash',
      offer_date: initialData?.offer_date || "",
      offer_exp_date: initialData?.offer_exp_date || "",
      description: initialData?.description || "",
    },
  });

  const handleSubmit = async (data: B2BOfferFormData) => {
    try {
      await onSubmit?.(data);
      if (trigger) {
        setOpen(false);
      } else {
        onClose?.();
      }
      form.reset();
    } catch (error) {
      console.error("Error submitting offer:", error);
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
                  control={form.control}
                  name="offer_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("offer-id")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("status")}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("select-status")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">{t("status_options.pending")}</SelectItem>
                          <SelectItem value="active">{t("status_options.active")}</SelectItem>
                          <SelectItem value="sold">{t("status_options.sold")}</SelectItem>
                          <SelectItem value="expired">{t("status_options.expired")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="offer_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("offer_type_label")}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("select_offer_type")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">{t("offer_type_options.cash")}</SelectItem>
                          <SelectItem value="credit">{t("offer_type_options.credit")}</SelectItem>
                          <SelectItem value="agreement">{t("offer_type_options.agreement")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
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

              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="offer_weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("offer-weight")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("unit-price")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="offer_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("offer-date")}</FormLabel>
                      <FormControl>
                        <PersianDatePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder={t("select-date")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="offer_exp_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("offer-exp-date")}</FormLabel>
                      <FormControl>
                        <PersianDatePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder={t("select-date")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
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

    </>
  );
}