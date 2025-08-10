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
import { useModal } from "@/lib/modal-context";
import { PersianDatePicker } from "../ui/persian-date-picker";
import { getTodayGregorian } from "@/lib/utils/persian-date";
import { WarehouseModal } from "./warehouse-modal";
import { ProductModal } from "./product-modal";
import { PurchaseProformaModal } from "./purchaseproforma-modal";
import { createWarehouse } from "@/lib/api/warehouse";
import { createProduct } from "@/lib/api/core";
import { createPurchaseProforma } from "@/lib/api/finance";

type WarehouseReceiptFormData = {
  receipt_id: string;
  receipt_type: "import_cottage" | "distribution_cottage" | "purchase";
  date: string;
  warehouse: number;
  description: string;
  cottage_serial_number?: string;
  proforma?: number;
  items: {
    product: number;
    weight: number;
  }[];
};

interface WarehouseReceiptModalProps {
  trigger?: React.ReactNode;
  onSubmit?: (data: WarehouseReceiptFormData) => void;
  onClose?: () => void;
  initialData?: Partial<WarehouseReceiptFormData>;
}

export function WarehouseReceiptModal({ trigger, onSubmit, onClose, initialData }: WarehouseReceiptModalProps) {
  const tval = useTranslations("warehouseReceipt.validation");
  const t = useTranslations("warehouseReceipt");
  const { data, refreshData } = useCoreData();
  const { openModal, closeModal } = useModal();
  
  // State for child modals
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showProformaModal, setShowProformaModal] = useState(false);
  const [pendingProductIndex, setPendingProductIndex] = useState<number | null>(null);
  
  useEffect(() => {
    // Refresh warehouses and products when modal opens
    if (data.warehouses.length === 0) {
      refreshData('warehouses');
    }
    if (data.products.length === 0) {
      refreshData('products');
    }
    if (data.purchaseProformas.length === 0) {
      refreshData('purchaseProformas');
    }
  }, []);

  const getTodayDate = () => {
    if (typeof window === 'undefined') return '';
    return getTodayGregorian();
  };

  const receiptItemSchema = z.object({
    product: z.number().min(1, tval("product-required")),
    weight: z.number().min(0.00000001, tval("weight")),
  });

  const warehouseReceiptSchema = z.object({
    receipt_id: z.string().min(1, tval("receipt-id")),
    receipt_type: z.enum(["import_cottage", "distribution_cottage", "purchase"]),
    date: z.string().min(1, tval("date")),
    warehouse: z.number().min(1, tval("warehouse")),
    description: z.string(),
    cottage_serial_number: z.string().optional(),
    proforma: z.number().optional(),
    items: z.array(receiptItemSchema).min(1, tval("items")),
  });

  const [open, setOpen] = useState(trigger ? false : true);
  
  const form = useForm<WarehouseReceiptFormData>({
    resolver: zodResolver(warehouseReceiptSchema),
    defaultValues: {
      receipt_id: initialData?.receipt_id || "",
      receipt_type: initialData?.receipt_type || "purchase",
      date: initialData?.date || getTodayDate(),
      warehouse: initialData?.warehouse || 0,
      description: initialData?.description || "",
      cottage_serial_number: initialData?.cottage_serial_number || "",
      proforma: initialData?.proforma || 0,
      items: initialData?.items || [{ product: 0, weight: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });
  
  const receiptType = form.watch("receipt_type");

  const handleSubmit = (data: WarehouseReceiptFormData) => {
    console.log("Form submitted with data:", data);
    if (onSubmit) {
      onSubmit(data);
    } else {
      console.log("No onSubmit handler provided");
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
        <DialogHeader className="px-3.5 py-4.5  justify-start" style={{ backgroundColor: "#f6d265" }}>
          <DialogTitle className="font-bold text-white text-right">{t("title")}</DialogTitle>
          <DialogDescription className="sr-only">Create or edit warehouse receipt</DialogDescription>
        </DialogHeader>

        <Form {...form} >
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4 px-12">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="receipt_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("receipt-id")}</FormLabel>
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
                    <FormLabel>{t("date")}</FormLabel>
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
                name="receipt_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("receipt-type")}</FormLabel>
                    <FormControl>
                      <select {...field} className="w-full px-3 py-2 border rounded-md">
                        <option value="import_cottage">{t("type-import")}</option>
                        <option value="distribution_cottage">{t("type-distribution")}</option>
                        <option value="purchase">{t("type-purchase")}</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="warehouse"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("warehouse")}</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value > 0 ? field.value.toString() : ""}
                        onValueChange={(value) => {
                          if (value === "new") {
                            setShowWarehouseModal(true);
                          } else if (value) {
                            field.onChange(Number(value));
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("select-warehouse")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem 
                            value="new" 
                            className="font-semibold text-[#f6d265]"
                            onPointerDown={(e) => e.preventDefault()}
                          >
                            <Plus className="inline-block w-4 h-4 mr-2" />
                            {t("create-new-warehouse")}
                          </SelectItem>
                          {data.warehouses && data.warehouses.length > 0 && (
                            <div className="border-t my-1" />
                          )}
                          {data.warehouses && data.warehouses.length > 0 ? (
                            data.warehouses.map((warehouse) => (
                              <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                                {warehouse.name} (#{warehouse.id})
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="0" disabled>
                              {t("no-warehouses")}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {(receiptType === "import_cottage" || receiptType === "distribution_cottage") && (
                <FormField
                  control={form.control}
                  name="cottage_serial_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("cottage-serial")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="proforma"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("proforma")}</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value?.toString() || ""}
                        onValueChange={(value) => {
                          if (value === "new") {
                            setShowProformaModal(true);
                          } else {
                            field.onChange(value === "none" ? undefined : Number(value));
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("select-proforma")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem 
                            value="new" 
                            className="font-semibold text-[#f6d265]"
                            onPointerDown={(e) => e.preventDefault()}
                          >
                            <Plus className="inline-block w-4 h-4 mr-2" />
                            {t("create-new-proforma")}
                          </SelectItem>
                          <SelectItem value="none">
                            {t("no-proforma")}
                          </SelectItem>
                          {data.purchaseProformas.length > 0 && (
                            <div className="border-t my-1" />
                          )}
                          {data.purchaseProformas.map((proforma) => (
                            <SelectItem key={proforma.id} value={proforma.id.toString()}>
                              {proforma.serialnumber} - {proforma.supplier_display || proforma.supplier}
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

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("description")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{t("items")}</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ product: 0, weight: 0 })}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t("add-item")}
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-3 gap-4 p-4 border rounded-lg">
                  <FormField
                    control={form.control}
                    name={`items.${index}.product`}
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
                              {data.products && data.products.length > 0 && (
                                <div className="border-t my-1" />
                              )}
                              {data.products && data.products.length > 0 ? (
                                data.products.map((product) => (
                                  <SelectItem key={product.id} value={product.id.toString()}>
                                    {product.name} (#{product.id})
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="0" disabled>
                                  {t("no-products")}
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.weight`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("weight")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="1"
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

    {/* Child Modals */}
    {showWarehouseModal && (
      <WarehouseModal
        onSubmit={async (newWarehouse: any) => {
          const created = await createWarehouse(newWarehouse);
          if (created) {
            await refreshData('warehouses');
            form.setValue('warehouse', created.id);
            setShowWarehouseModal(false);
          }
        }}
        onClose={() => setShowWarehouseModal(false)}
      />
    )}

    {showProductModal && (
      <ProductModal
        onSubmit={async (newProduct: any) => {
          const created = await createProduct(newProduct);
          if (created) {
            await refreshData('products');
            if (pendingProductIndex !== null) {
              form.setValue(`items.${pendingProductIndex}.product`, created.id);
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

    {showProformaModal && (
      <PurchaseProformaModal
        onSubmit={async (newProforma: any) => {
          const created = await createPurchaseProforma(newProforma);
          if (created) {
            await refreshData('purchaseProformas');
            form.setValue('proforma', created.id);
            setShowProformaModal(false);
          }
        }}
        onClose={() => setShowProformaModal(false)}
      />
    )}
    </>
  );
}