"use client";


import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../../ui/form";
import { Input } from "../../ui/input";
import { SearchableSelect } from "../../ui/searchable-select";
import { NumberInput } from "../../ui/number-input";
import { useTranslations } from "next-intl";
import { useCoreData } from "@/lib/core-data-context";
import { CustomerModal } from "../customer-modal";
import { WarehouseReceiptModal, WarehouseReceiptFormData } from "../warehouse/warehouse-receipt-modal";
import { createCustomer } from "@/lib/api/core";
import { createWarehouseReceipt, fetchWarehouseReceipts } from "@/lib/api/warehouse";
import { WarehouseReceipt } from "@/lib/interfaces/warehouse";
import { getPartyDisplayName } from "@/lib/utils/party-utils";
import { PersianDatePicker } from "../../ui/persian-date-picker";

export type B2BDistributionFormData = {
  transfer_id?: string;
  customer: number;
  warehouse_receipt: number;
  agency_weight: number;
  agency_date: string;
  description?: string;
};

interface B2BDistributionModalProps {
  trigger?: React.ReactNode;
  onSubmit?: (data: B2BDistributionFormData) => Promise<void>;
  onClose?: () => void;
  initialData?: Partial<B2BDistributionFormData>;
  onOfferCreated?: () => void;
}

export function B2BDistributionModal({ trigger, onSubmit, onClose, initialData, }: B2BDistributionModalProps) {
  const tval = useTranslations("modals.b2bDistribution.validation");
  const t = useTranslations("modals.b2bDistribution");
  const tCommon = useTranslations("common");
  const { customers, refreshData: refreshCoreData } = useCoreData();
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showWarehouseReceiptModal, setShowWarehouseReceiptModal] = useState(false);
  const [warehouseReceipts, setWarehouseReceipts] = useState<WarehouseReceipt[]>([]);

  useEffect(() => {
    if (customers.length === 0) {
      refreshCoreData('customers');
    }
    loadWarehouseReceipts();
  }, [customers.length, refreshCoreData]);

  const loadWarehouseReceipts = async () => {
    try {
      const receipts = await fetchWarehouseReceipts();
      setWarehouseReceipts(receipts || []);
    } catch (error) {
      console.error('Failed to load warehouse receipts:', error);
    }
  };



  const b2bDistributionSchema = z.object({
    transfer_id: z.string().optional(),
    warehouse_receipt: z.number().min(0),
    customer: z.number().min(0),
    agency_weight: z.union([z.string(), z.number()]).optional(),
    agency_date: z.string().min(1, tval("agency-date")),
    description: z.string().optional(),
  });

  const [open, setOpen] = useState(trigger ? false : true);

  const form = useForm<B2BDistributionFormData>({
    resolver: zodResolver(b2bDistributionSchema) as any,
    defaultValues: {
      transfer_id: initialData?.transfer_id || "",
      warehouse_receipt: initialData?.warehouse_receipt || 0,
      customer: initialData?.customer || 0,
      agency_weight: initialData?.agency_weight || 0,
      agency_date: initialData?.agency_date || "",
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
      console.error("Error submitting distribution:", error);
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
                  name="transfer_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("transfer-id")}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t("enter-transfer-id")} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control as any}
                  name="warehouse_receipt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("warehouse_receipt")}</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          value={field.value > 0 ? field.value.toString() : ""}
                          onValueChange={(value) => {
                            if (value === "new") {
                              setShowWarehouseReceiptModal(true);
                            } else if (value) {
                              field.onChange(Number(value));
                            }
                          }}
                          options={warehouseReceipts.map(receipt => ({
                            value: receipt.id.toString(),
                            label: `${receipt.receipt_id || 'Receipt'} - ${receipt.warehouse_name} (ID: ${receipt.id})`,
                            id: receipt.id,
                            name: receipt.receipt_id || receipt.id.toString()
                          }))}
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

              </div>

              <FormField
                control={form.control as any}
                name="customer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("distributor")}</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        value={field.value > 0 ? field.value.toString() : ""}
                        onValueChange={(value) => {
                          if (value === "new") {
                            setShowCustomerModal(true);
                          } else if (value) {
                            field.onChange(Number(value));
                          }
                        }}
                        options={customers.map(customer => ({
                          value: customer.id.toString(),
                          label: `${getPartyDisplayName(customer)} (ID: ${customer.id})`,
                          id: customer.id,
                          name: getPartyDisplayName(customer)
                        }))}
                        placeholder={t("select-distributor")}
                        searchPlaceholder={tCommon("search_placeholders.search_distributors")}
                        showCreateNew={true}
                        createNewText={t("create-new-distributor")}
                        onCreateNew={() => setShowCustomerModal(true)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control as any}
                  name="agency_weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("agency-weight")}</FormLabel>
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
                  name="agency_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("agency-date")}</FormLabel>
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
          onSubmit={async (newReceipt: WarehouseReceiptFormData) => {
            const receiptData = {
              ...newReceipt,
              items: newReceipt.items.map(item => ({
                product: item.product,
                weight: typeof item.weight === 'string' ? parseFloat(item.weight) || 0 : item.weight
              }))
            };
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

    </>
  );
}