"use client";


import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../../ui/form";
import { Input } from "../../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCoreData } from "@/lib/core-data-context";
import { useModal } from "@/lib/modal-context";
import { PersianDatePicker } from "../../ui/persian-date-picker";
import { getTodayGregorian } from "@/lib/utils/persian-date";
import { getPartyDisplayName } from "@/lib/utils/party-utils";
import { describeParty, describeProduct } from "@/lib/utils/label-utils";
import { CustomerFormData, CustomerModal } from "../customer-modal";
import { ProductFormData, ProductModal } from "../product-modal";
import { createCustomer, createProduct, incrementIndicatorCounter } from "@/lib/api/core";
import { useDefaultIndicator } from "@/lib/hooks/use-default-indicator";

export type SalesProformaFormData = {
  serial_number: string;
  date: string;
  tax: string;
  discount: string;
  payment_type: "cash" | "credit" | "other";
  payment_description?: string;
  customer: number;
  lines: {
    product: number;
    weight: string;
    unit_price: string;
  }[];
};

interface SalesProformaModalProps {
  trigger?: React.ReactNode;
  onSubmit?: (data: SalesProformaFormData) => void;
  onClose?: () => void;
  initialData?: Partial<SalesProformaFormData>;
  readOnly?: boolean;
  isEditing?: boolean;
}

export function SalesProformaModal({ trigger, onSubmit, onClose, initialData, readOnly = false, isEditing }: SalesProformaModalProps) {
  const tval = useTranslations("modals.salesProforma.validation");
  const t = useTranslations("modals.salesProforma");
  const { data, refreshData } = useCoreData();
  const { openModal } = useModal();
  const [isEditMode, setIsEditMode] = useState(!readOnly);

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
    weight: z.union([z.string(), z.number()]).refine(
      (val) => {
        if (val === "" || val === null || val === undefined) return false;
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return !isNaN(num) && num > 0;
      },
      { message: tval("weight-required") }
    ),
    unit_price: z.union([z.string(), z.number()]).refine(
      (val) => {
        if (val === "" || val === null || val === undefined) return false;
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return !isNaN(num) && num > 0;
      },
      { message: tval("unit-price-required") }
    ),
  });

  const salesProformaSchema = z.object({
    serial_number: z.string().min(1, tval('serialnumber')).max(20, tval('serialnumber')),
    date: z.string().min(1, tval('date')),
    tax: z.union([z.string(), z.number()]).transform((val) => {
      if (val === "" || val === null || val === undefined) return 0;
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return isNaN(num) ? 0 : num;
    }).pipe(z.number().min(0)),
    discount: z.union([z.string(), z.number()]).transform((val) => {
      if (val === "" || val === null || val === undefined) return 0;
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return isNaN(num) ? 0 : num;
    }).pipe(z.number().min(0)),
    payment_type: z.enum(["cash", "credit", "other"]),
    payment_description: z.string().optional(),
    customer: z.number().min(1, tval('customer')),
    lines: z.array(proformaLineSchema).min(1, tval('lines')),
  });

  const [open, setOpen] = useState(trigger ? false : true);

  const form = useForm<SalesProformaFormData>({
    resolver: zodResolver(salesProformaSchema) as any,
    defaultValues: {
      serial_number: initialData?.serial_number || "",
      date: initialData?.date || getTodayDate(),
      tax: initialData?.tax || "",
      discount: initialData?.discount || "",
      payment_type: initialData?.payment_type || "cash",
      payment_description: initialData?.payment_description || "",
      customer: initialData?.customer || 0,
      lines: initialData?.lines || [{ product: 0, weight: "", unit_price: "" }],
    },
  });

  const defaultIndicator = useDefaultIndicator({
    section: "sale_proforma",
    form,
    fieldName: "serial_number",
    enabled: !readOnly && !isEditing && !initialData?.serial_number,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  });

  const handleSubmit = async (data: any) => {
    if (onSubmit) {
      await onSubmit(data);
    }
    if (!readOnly && !isEditing && defaultIndicator) {
      try {
        await incrementIndicatorCounter(defaultIndicator.id);
      } catch (error) {
        console.error("Failed to increment indicator counter:", error);
      }
    }
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
          <DialogHeader className="px-3.5 py-4.5  justify-start relative" style={{ backgroundColor: "#f6d265" }}>
            <DialogTitle className="font-bold text-white text-right">{t("title")}</DialogTitle>
            <DialogDescription className="sr-only">Create or edit sales proforma</DialogDescription>
            {readOnly && !isEditMode && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                onClick={() => setIsEditMode(true)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
          </DialogHeader>

          <Form {...form} >
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4 px-12">
              <fieldset disabled={!isEditMode} className="space-y-6">
              <div className="grid grid-cols-2 gap-4 items-start">
                <FormField
                  control={form.control as any}
                  name="serial_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('serialnumber')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={!isEditMode}
                          readOnly={isEditing}
                          className={isEditing ? "bg-gray-100 cursor-not-allowed" : ""}
                          autoFocus={false}
                          tabIndex={isEditing ? -1 : undefined}
                        />
                      </FormControl>
                      <FormMessage className="min-h-[1.25rem]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('date')}</FormLabel>
                      <FormControl>
                        <PersianDatePicker
                          value={field.value}
                          onChange={(value) => field.onChange(value)}
                          placeholder={t("select-date")}
                          disabled={!isEditMode}
                        />
                      </FormControl>
                      <FormMessage className="min-h-[1.25rem]" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 items-start">
                <FormField
                  control={form.control as any}
                  name="customer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('customer')}</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value > 0 ? field.value.toString() : ""}
                          onValueChange={(value) => {
                            if (value === "new") {
                              openModal(CustomerModal, {
                                onSubmit: async (newCustomer: CustomerFormData) => {
                                  const created = await createCustomer(newCustomer);
                                  if (created) {
                                    await refreshData('customers');
                                    form.setValue('customer', created.id);
                                  }
                                }
                              });
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
                                {describeParty(customer)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage className="min-h-[1.25rem]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="payment_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('payment')}</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                        >
                          <option value="cash">{t("payment_cash")}</option>
                          <option value="credit">{t("payment_credit")}</option>
                          <option value="other">{t("payment_other")}</option>
                        </select>
                      </FormControl>
                      <FormMessage className="min-h-[1.25rem]" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control as any}
                name="payment_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("payment_desc")} <span className="text-gray-400 text-sm">{t("optional")}</span></FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage className="min-h-[1.25rem]" />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4 items-start">
                <FormField
                  control={form.control as any}
                  name="tax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("tax")}</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage className="min-h-[1.25rem]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="discount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("discount")}</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage className="min-h-[1.25rem]" />
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
                    onClick={() => append({ product: 0, weight: "", unit_price: "" })}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t("add-line")}
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-4 gap-4 p-4 border rounded-lg items-start">
                    <FormField
                      control={form.control as any}
                      name={`lines.${index}.product`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("product")}</FormLabel>
                          <FormControl>
                            <Select
                              value={field.value > 0 ? field.value.toString() : ""}
                              onValueChange={(value) => {
                                if (value === "new") {
                                  const currentIndex = index;
                                  openModal(ProductModal, {
                                    onSubmit: async (newProduct: ProductFormData) => {
                                      const created = await createProduct(newProduct);
                                      if (created) {
                                        await refreshData('products');
                                        const lines = form.getValues('lines');
                                        lines[currentIndex].product = created.id;
                                        form.setValue('lines', lines);
                                      }
                                    }
                                  });
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
                                    {describeProduct(product)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage className="min-h-[1.25rem]" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control as any}
                      name={`lines.${index}.weight`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("weight")}</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              step="0.00000001"
                              {...field}
                              onChange={(value) => field.onChange(value)}
                            />
                          </FormControl>
                          <FormMessage className="min-h-[1.25rem]" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control as any}
                      name={`lines.${index}.unit_price`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('unit_price')}</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              step="0.01"
                              {...field}
                              onChange={(value) => field.onChange(value)}
                            />
                          </FormControl>
                          <FormMessage className="min-h-[1.25rem]" />
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
              </fieldset>

              {isEditMode && (
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={handleClose}>
                    {t("cancel")}
                  </Button>
                  <Button type="submit" className="hover:bg-[#f6d265]"> {t("save")}</Button>
                </div>
              )}
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
