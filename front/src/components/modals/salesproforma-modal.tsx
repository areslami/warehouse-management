"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCoreData } from "@/lib/core-data-context";
import { PersianDatePicker } from "../ui/persian-date-picker";
import { getTodayGregorian } from "@/lib/utils/persian-date";
import { getPartyDisplayName } from "@/lib/utils/party-utils";
import { CustomerModal } from "./customer-modal";
import { ProductModal } from "./product-modal";
import { createCustomer, createProduct } from "@/lib/api/core";

type SalesProformaFormData = {
  serial_number: string;
  date: string;
  tax: number;
  discount: number;
  payment_type: "cash" | "credit" | "other";
  payment_description?: string;
  customer: number;
  lines: {
    product: number;
    weight: number;
    unit_price: number;
  }[];
};

interface SalesProformaModalProps {
  trigger?: React.ReactNode;
  onSubmit?: (data: SalesProformaFormData) => void;
  onClose?: () => void;
  initialData?: Partial<SalesProformaFormData>;
}

export function SalesProformaModal({ trigger, onSubmit, onClose, initialData }: SalesProformaModalProps) {
  const tval = useTranslations("salesProforma.validation");
  const t = useTranslations("salesProforma");
  const { data, refreshData } = useCoreData();
  
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [pendingProductIndex, setPendingProductIndex] = useState<number | null>(null);
  
  useEffect(() => {
    if (data.customers.length === 0) {
      refreshData('customers');
    }
    if (data.products.length === 0) {
      refreshData('products');
    }
  }, []);

  const getTodayDate = () => {
    if (typeof window === 'undefined') return '';
    return getTodayGregorian();
  };

  const proformaLineSchema = z.object({
    product: z.number().min(1, tval("product-required")),
    weight: z.number().min(0.00000001, tval("weight")),
    unit_price: z.number().min(0, tval("unit-price")),
  });

  const salesProformaSchema = z.object({
    serial_number: z.string().min(1, tval('serialnumber')).max(20, tval('serialnumber')),
    date: z.string().min(1, tval('date')),
    tax: z.number().min(0, tval('tax')),
    discount: z.number().min(0, tval('discount')),
    payment_type: z.enum(["cash", "credit", "other"]),
    payment_description: z.string().optional(),
    customer: z.number().min(1, tval('customer')),
    lines: z.array(proformaLineSchema).min(1, tval('lines')),
  });

  const [open, setOpen] = useState(trigger ? false : true);

  const form = useForm<SalesProformaFormData>({
    resolver: zodResolver(salesProformaSchema),
    defaultValues: {
      serial_number: initialData?.serial_number || "",
      date: initialData?.date || getTodayDate(),
      tax: initialData?.tax || 0,
      discount: initialData?.discount || 0,
      payment_type: initialData?.payment_type || "cash",
      payment_description: initialData?.payment_description || "",
      customer: initialData?.customer || 0,
      lines: initialData?.lines || [{ product: 0, weight: 0, unit_price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  });

  const handleSubmit = (data: SalesProformaFormData) => {
    onSubmit?.(data);
    if (trigger) {
      setOpen(false);
    } else {
      onClose?.();
    }
    form.reset();
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
      <DialogContent dir="rtl" className="min-w-[80%] max-h-[90vh] overflow-y-auto scrollbar-hide  p-0 my-0 mx-auto [&>button]:hidden">
        <DialogHeader className="px-3.5 py-4.5  justify-start" style={{ backgroundColor: "#f6d265" }}>
          <DialogTitle className="font-bold text-white text-right">{t("title")}</DialogTitle>
          <DialogDescription className="sr-only">Create or edit sales proforma</DialogDescription>
        </DialogHeader>

        <Form {...form} >
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4 px-12">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="serial_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('serialnumber')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('date')}</FormLabel>
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('customer')}</FormLabel>
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
                          {data.customers.length > 0 && (
                            <div className="border-t my-1" />
                          )}
                          {data.customers.map((customer) => (
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

              <FormField
                control={form.control}
                name="payment_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('payment')}</FormLabel>
                    <FormControl>
                      <select {...field} className="w-full px-3 py-2 border rounded-md">
                        <option value="cash">{t("payment_cash")}</option>
                        <option value="credit">{t("payment_credit")}</option>
                        <option value="other">{t("payment_other")}</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="payment_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("payment_desc")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("tax")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
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
                name="discount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("discount")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{t("lines")}</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ product: 0, weight: 0, unit_price: 0 })}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t("add-line")}
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-4 gap-4 p-4 border rounded-lg">
                  <FormField
                    control={form.control}
                    name={`lines.${index}.product`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("product")}</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value > 0 ? field.value.toString() : ""}
                            onValueChange={(value) => {
                              if (value === "new") {
                                setPendingProductIndex(index);
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
                              {data.products.length > 0 && (
                                <div className="border-t my-1" />
                              )}
                              {data.products.map((product) => (
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
                    control={form.control}
                    name={`lines.${index}.weight`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("weight")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.00000001"
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
                    name={`lines.${index}.unit_price`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('unit_price')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                {t("cancel")}
              </Button>
              <Button type="submit" className="hover:bg-[#f6d265]"> {t("save")}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

    {showCustomerModal && (
      <CustomerModal
        onSubmit={async (newCustomer: any) => {
          const created = await createCustomer(newCustomer);
          if (created) {
            await refreshData('customers');
            form.setValue('customer', created.id);
            setShowCustomerModal(false);
          }
        }}
        onClose={() => setShowCustomerModal(false)}
      />
    )}

    {showProductModal && (
      <ProductModal
        onSubmit={async (newProduct: any) => {
          const created = await createProduct(newProduct);
          if (created) {
            await refreshData('products');
            if (pendingProductIndex !== null) {
              form.setValue(`lines.${pendingProductIndex}.product`, created.id);
            }
            setShowProductModal(false);
            setPendingProductIndex(null);
          }
        }}
        onClose={() => {
          setShowProductModal(false);
          setPendingProductIndex(null);
        }}
      />
    )}
    </>
  );
}