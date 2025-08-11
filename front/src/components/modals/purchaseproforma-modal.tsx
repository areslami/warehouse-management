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
import { SupplierModal } from "./supplier-modal";
import { ProductModal } from "./product-modal";
import { createSupplier, createProduct } from "@/lib/api/core";

type PurchaseProformaFormData = {
  serialnumber: string;
  date: string;
  tax: number;
  discount: number;
  supplier: number;
  lines: {
    product: number;
    weight: number;
    unit_price: number;
  }[];
};

interface PurchaseProformaModalProps {
  trigger?: React.ReactNode;
  onSubmit?: (data: PurchaseProformaFormData) => void;
  onClose?: () => void;
  initialData?: Partial<PurchaseProformaFormData>;
}

export function PurchaseProformaModal({ trigger, onSubmit, onClose, initialData }: PurchaseProformaModalProps) {
  const tval = useTranslations("purchaseProforma.validation");
  const t = useTranslations("purchaseProforma");
  const { data, refreshData } = useCoreData();
  
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [pendingProductIndex, setPendingProductIndex] = useState<number | null>(null);
  
  useEffect(() => {
    if (data.suppliers.length === 0) {
      refreshData('suppliers');
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

  const purchaseProformaSchema = z.object({
    serialnumber: z.string().min(1, tval('serialnumber')).max(20, tval('serialnumber')),
    date: z.string().min(1, tval('date')),
    tax: z.number().min(0, tval('tax')),
    discount: z.number().min(0, tval('discount')),
    supplier: z.number().min(1, tval('supplier')),
    lines: z.array(proformaLineSchema).min(1, tval('lines')),
  });

  const [open, setOpen] = useState(trigger ? false : true);

  const form = useForm<PurchaseProformaFormData>({
    resolver: zodResolver(purchaseProformaSchema),
    defaultValues: {
      serialnumber: initialData?.serialnumber || "",
      date: initialData?.date || getTodayDate(),
      tax: initialData?.tax || 0,
      discount: initialData?.discount || 0,
      supplier: initialData?.supplier || 0,
      lines: initialData?.lines || [{ product: 0, weight: 0, unit_price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  });

  const handleSubmit = (data: PurchaseProformaFormData) => {
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
          <DialogDescription className="sr-only">Create or edit purchase proforma</DialogDescription>
        </DialogHeader>

        <Form {...form} >
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4 px-12">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="serialnumber"
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

            <FormField
              control={form.control}
              name="supplier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('supplier')}</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value > 0 ? field.value.toString() : ""}
                      onValueChange={(value) => {
                        if (value === "new") {
                          setShowSupplierModal(true);
                        } else if (value) {
                          field.onChange(Number(value));
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("select-supplier")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem 
                          value="new" 
                          className="font-semibold text-[#f6d265]"
                          onPointerDown={(e) => e.preventDefault()}
                        >
                          <Plus className="inline-block w-4 h-4 mr-2" />
                          {t("create-new-supplier")}
                        </SelectItem>
                        {data.suppliers.length > 0 && (
                          <div className="border-t my-1" />
                        )}
                        {data.suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id.toString()}>
                            {supplier.name} (#{supplier.id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                                  {product.name} (#{product.id})
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

    {showSupplierModal && (
      <SupplierModal
        onSubmit={async (newSupplier: any) => {
          const created = await createSupplier(newSupplier);
          if (created) {
            await refreshData('suppliers');
            form.setValue('supplier', created.id);
            setShowSupplierModal(false);
          }
        }}
        onClose={() => setShowSupplierModal(false)}
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