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
import { fetchWarehouseReceipts, createWarehouseReceipt } from "@/lib/api/warehouse";
import { WarehouseReceipt } from "@/lib/interfaces/warehouse";
import { PersianDatePicker } from "../../ui/persian-date-picker";
import { WarehouseReceiptModal } from "../warehouse/warehouse-receipt-modal";

export type B2BOfferFormData = {
  offer_id: string;
  warehouse_receipt?: number;
  offer_weight?: number;
  unit_price: number;
  status: 'pending' | 'active' | 'sold' | 'expired';
  offer_type?: 'cash' | 'credit' | 'agreement' | 'other';
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
  const tCommon = useTranslations("common");
  const { refreshData: refreshCoreData } = useCoreData();

  const [showWarehouseReceiptModal, setShowWarehouseReceiptModal] = useState(false);
  const [warehouseReceipts, setWarehouseReceipts] = useState<WarehouseReceipt[]>([]);



  const loadWarehouseReceipts = async () => {
    try {
      const receipts = await fetchWarehouseReceipts();
      const filteredReceipts = receipts?.filter(receipt =>
        receipt.receipt_type === 'import_cottage' || receipt.receipt_type === 'distribution_cottage'
      ) || [];
      setWarehouseReceipts(filteredReceipts);
    } catch (error) {
      console.error('Failed to load warehouse receipts:', error);
    }
  };

  useEffect(() => {
    loadWarehouseReceipts();
  }, [refreshCoreData]);


  const b2bOfferSchema = z.object({
    offer_id: z.string().min(1, tval("offer-id")),
    warehouse_receipt: z.number().optional(),
    offer_weight: z.number().optional(),
    unit_price: z.number().positive(),
    status: z.enum(['pending', 'active', 'sold', 'expired']),
    offer_type: z.enum(['cash', 'credit', 'agreement', 'other']).optional(),
    offer_date: z.string().min(1, tval("offer-date")),
    offer_exp_date: z.string().min(1, tval("offer-exp-date")),
    description: z.string().optional(),
  });

  const [open, setOpen] = useState(trigger ? false : true);

  const form = useForm({
    resolver: zodResolver(b2bOfferSchema) as any,
    defaultValues: {
      offer_id: initialData?.offer_id || "",
      warehouse_receipt: initialData?.warehouse_receipt || 0,
      offer_weight: initialData?.offer_weight || 0,
      unit_price: initialData?.unit_price || 0,
      status: initialData?.status || 'pending',
      offer_type: initialData?.offer_type || 'cash',
      offer_date: initialData?.offer_date || "",
      offer_exp_date: initialData?.offer_exp_date || "",
      description: initialData?.description || "",
    },
  });

  const handleSubmit = async (data: any) => {
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
                  control={form.control as any}
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
                  control={form.control as any}
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
                  control={form.control as any}
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


              <FormField
                control={form.control as any}
                name="warehouse_receipt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("warehouse-receipt")}</FormLabel>
                    <FormControl>
                      <SimpleCombobox
                        value={field.value > 0 ? field.value.toString() : ""}
                        onValueChange={(value) => {
                          if (value && value !== "0") {
                            field.onChange(Number(value));
                          } else {
                            field.onChange(0);
                          }
                        }}
                        options={[
                          { value: "0", label: t("no-receipt") },
                          ...warehouseReceipts.map(receipt => ({
                            value: receipt.id.toString(),
                            label: `${receipt.receipt_id} - ${receipt.warehouse_name} - ${t("cottage_number")} : ${receipt.cottage_serial_number} `,
                            id: receipt.id,
                            name: receipt.receipt_id || receipt.id.toString()
                          }))
                        ]}
                        placeholder={t("select-warehouse-receipt")}
                        searchPlaceholder={tCommon("search_placeholders.search_warehouse_receipts")}
                        showCreateNew={true}
                        createNewText={t("create-new-warehouse-receipt")}
                        onCreateNew={() => setShowWarehouseReceiptModal(true)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control as any}
                  name="offer_weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("offer-weight")}</FormLabel>
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
                  name="offer_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("offer-date")}</FormLabel>
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

                <FormField
                  control={form.control as any}
                  name="offer_exp_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("offer-exp-date")}</FormLabel>
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


      {showWarehouseReceiptModal && (
        <WarehouseReceiptModal
          onSubmit={async (newReceipt) => {
            const receiptData = {
              ...newReceipt,
              items: newReceipt.items.map(item => ({
                product: item.product,
                weight: typeof item.weight === 'string' ? parseFloat(item.weight) || 0 : item.weight
              }))
            };
            console.log("MMD");
            console.log(receiptData);
            const created = await createWarehouseReceipt(receiptData);
            if (created) {
              await loadWarehouseReceipts();
              form.setValue('warehouse_receipt', created.id);
              setShowWarehouseReceiptModal(false);
            }
          }}
          onClose={() => setShowWarehouseReceiptModal(false)}
        />
      )}

    </>
  );
}