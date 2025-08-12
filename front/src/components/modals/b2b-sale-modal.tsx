"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { PersianDatePicker } from "../ui/persian-date-picker";
import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { B2BOfferModal } from "./b2b-offer-modal";
import { createB2BOffer } from "@/lib/api/b2b";

type B2BSaleFormData = {
  product_offer: number;
  description?: string;
  purchases: {
    buyer_name: string;
    purchase_weight: number;
    paid_amount: number;
    purchase_date: string;
    purchase_type: 'Cash' | 'Credit' | 'Installment';
  }[];
};

interface B2BSaleModalProps {
  trigger?: React.ReactNode;
  onSubmit?: (data: B2BSaleFormData) => Promise<void>;
  onClose?: () => void;
  initialData?: Partial<B2BSaleFormData>;
  offers?: Array<{ id: number; offer_id: string; product_name: string }>;
  onOfferCreated?: () => void;
}

export function B2BSaleModal({ trigger, onSubmit, onClose, initialData, offers = [], onOfferCreated }: B2BSaleModalProps) {
  const tval = useTranslations("b2bSale.validation");
  const t = useTranslations("b2bSale");
  
  const b2bSaleSchema = z.object({
    product_offer: z.number().min(1, tval("product-offer")),
    description: z.string().optional(),
    purchases: z.array(z.object({
      buyer_name: z.string().min(1, tval("buyer-name")),
      purchase_weight: z.number().positive(tval("purchase-weight")),
      paid_amount: z.number().min(0, tval("paid-amount")),
      purchase_date: z.string().min(1, tval("purchase-date")),
      purchase_type: z.enum(['Cash', 'Credit', 'Installment']),
    })).min(1, tval("purchases")),
  });

  const [open, setOpen] = useState(trigger ? false : true);
  const [showOfferModal, setShowOfferModal] = useState(false);

  const form = useForm<B2BSaleFormData>({
    resolver: zodResolver(b2bSaleSchema),
    defaultValues: {
      product_offer: initialData?.product_offer || 0,
      description: initialData?.description || "",
      purchases: initialData?.purchases || [{
        buyer_name: "",
        purchase_weight: 0,
        paid_amount: 0,
        purchase_date: "",
        purchase_type: 'Cash',
      }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "purchases",
  });

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
    <Dialog open={open} onOpenChange={trigger ? setOpen : handleClose}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent dir="rtl" className="min-w-[75%] max-h-[90vh] overflow-y-auto scrollbar-hide p-0 my-0 mx-auto [&>button]:hidden">
        <DialogHeader className="px-3.5 py-4.5 justify-start" style={{ backgroundColor: "#f6d265" }}>
          <DialogTitle className="font-bold text-white text-right">{t("title")}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4 px-12">
            <FormField
              control={form.control}
              name="product_offer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("product-offer")}</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value > 0 ? field.value.toString() : ""}
                      onValueChange={(value) => {
                        if (value === "new") {
                          setShowOfferModal(true);
                        } else {
                          field.onChange(Number(value));
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("select-offer")} />
                      </SelectTrigger>
                      <SelectContent>
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
                            {offer.offer_id} - {offer.product_name}
                          </SelectItem>
                        ))}
                        {offers.length === 0 && (
                          <div className="p-2 text-gray-500 text-sm text-center">
                            {t("no-offers")}
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{t("purchases")}</h3>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => append({
                    buyer_name: "",
                    purchase_weight: 0,
                    paid_amount: 0,
                    purchase_date: "",
                    purchase_type: 'Cash',
                  })}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {t("add-purchase")}
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="border rounded-lg p-4 space-y-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-700">{t("purchase")} {index + 1}</span>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => remove(index)}
                        className="text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`purchases.${index}.buyer_name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("buyer-name")}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`purchases.${index}.purchase_type`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("purchase-type")}</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder={t("select-type")} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Cash">{t("type-cash")}</SelectItem>
                              <SelectItem value="Credit">{t("type-credit")}</SelectItem>
                              <SelectItem value="Installment">{t("type-installment")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name={`purchases.${index}.purchase_weight`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("purchase-weight")}</FormLabel>
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
                      name={`purchases.${index}.paid_amount`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("paid-amount")}</FormLabel>
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
                      name={`purchases.${index}.purchase_date`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("purchase-date")}</FormLabel>
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
                </div>
              ))}
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("description")} <span className="text-gray-400 text-sm">(اختیاری)</span></FormLabel>
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
      
      {showOfferModal && (
        <B2BOfferModal
          onSubmit={async (data) => {
            try {
              const newOffer = await createB2BOffer(data);
              await onOfferCreated?.();
              // Auto-select the newly created offer
              if (newOffer) {
                form.setValue("product_offer", newOffer.id);
              }
              setShowOfferModal(false);
            } catch (error) {
              console.error("Error creating offer:", error);
            }
          }}
          onClose={() => setShowOfferModal(false)}
        />
      )}
    </Dialog>
  );
}