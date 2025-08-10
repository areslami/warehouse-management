"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

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

  const getTodayDate = () => {
    if (typeof window === 'undefined') return '';
    return new Date().toISOString().split('T')[0];
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

  const handleSubmit = (data: WarehouseReceiptFormData) => {
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
    <Dialog open={open} onOpenChange={trigger ? setOpen : handleClose}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent dir="rtl" className="min-w-[80%] max-h-[90vh] overflow-y-auto scrollbar-hide  p-0 my-0 mx-auto [&>button]:hidden">
        <DialogHeader className="px-3.5 py-4.5  justify-start" style={{ backgroundColor: "#f6d265" }}>
          <DialogTitle className="font-bold text-white text-right">{t("title")}</DialogTitle>
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
                      <Input type="date" {...field} />
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

              <FormField
                control={form.control}
                name="proforma"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("proforma")}</FormLabel>
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
                    name={`items.${index}.weight`}
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
    </Dialog >
  );
}