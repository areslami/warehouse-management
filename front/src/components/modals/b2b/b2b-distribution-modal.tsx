"use client";


import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Edit2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../../ui/form";
import { Input } from "../../ui/input";
import { SimpleCombobox } from "../../ui/simple-combobox";
import { NumberInput } from "../../ui/number-input";
import { useTranslations } from "next-intl";
import { useCoreData } from "@/lib/core-data-context";
import { CustomerModal } from "../customer-modal";
import { WarehouseReceiptModal, WarehouseReceiptFormData } from "../warehouse/warehouse-receipt-modal";
import { SalesProformaModal } from "../finance/salesproforma-modal";
import { createCustomer } from "@/lib/api/core";
import { createWarehouseReceipt, fetchWarehouseReceipts } from "@/lib/api/warehouse";
import { fetchSalesProformas, createSalesProforma } from "@/lib/api/finance";
import { fetchNextDistributionId } from "@/lib/api/b2b";
import { WarehouseReceipt } from "@/lib/interfaces/warehouse";
import { SalesProforma } from "@/lib/interfaces/finance";
import { describeWarehouseReceipt, describeParty } from "@/lib/utils/label-utils";
import { getPartyDisplayName } from "@/lib/utils/party-utils";
import { PersianDatePicker } from "../../ui/persian-date-picker";

export type B2BDistributionFormData = {
  transfer_id: string;
  customer: number;
  warehouse_receipt: number;
  sales_proforma: number;
  agency_weight: number;
  unit_price: number;
  agency_date: string;
  description?: string;
};

interface B2BDistributionModalProps {
  trigger?: React.ReactNode;
  onSubmit?: (data: B2BDistributionFormData) => Promise<void>;
  onClose?: () => void;
  initialData?: Partial<B2BDistributionFormData>;
  onOfferCreated?: () => void;
  readOnly?: boolean;
  isEditing?: boolean;
}

export function B2BDistributionModal({ trigger, onSubmit, onClose, initialData, readOnly = false, isEditing }: B2BDistributionModalProps) {
  const tval = useTranslations("modals.b2bDistribution.validation");
  const t = useTranslations("modals.b2bDistribution");
  const tCommon = useTranslations("common");
  const { customers, refreshData: refreshCoreData } = useCoreData();
  const [isEditMode, setIsEditMode] = useState(!readOnly);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showWarehouseReceiptModal, setShowWarehouseReceiptModal] = useState(false);
  const [showSalesProformaModal, setShowSalesProformaModal] = useState(false);
  const [warehouseReceipts, setWarehouseReceipts] = useState<WarehouseReceipt[]>([]);
  const [salesProformas, setSalesProformas] = useState<SalesProforma[]>([]);
  const [proformaMaxWeight, setProformaMaxWeight] = useState<number | null>(null);

  useEffect(() => {
    if (customers.length === 0) {
      refreshCoreData('customers');
    }
    loadWarehouseReceipts();
    loadSalesProformas();

    // Fetch next distribution ID only when creating new (not editing)
    if (!isEditing && !initialData?.transfer_id) {
      loadNextDistributionId();
    }
  }, [customers.length, refreshCoreData, isEditing, initialData?.transfer_id]);

  const loadNextDistributionId = async () => {
    try {
      const nextId = await fetchNextDistributionId();
      form.setValue('transfer_id', nextId);
    } catch (error) {
      console.error('Failed to load next distribution ID:', error);
    }
  };

  const loadWarehouseReceipts = async () => {
    try {
      const receipts = await fetchWarehouseReceipts();
      // Only receipts valid for B2BDistribution: import_cottage
      const filtered = (receipts || []).filter(r => r.receipt_type === 'import_cottage');
      setWarehouseReceipts(filtered);
    } catch (error) {
      console.error('Failed to load warehouse receipts:', error);
    }
  };

  const loadSalesProformas = async () => {
    try {
      const proformas = await fetchSalesProformas();
      setSalesProformas(proformas || []);
    } catch (error) {
      console.error('Failed to load sales proformas:', error);
    }
  };



  const b2bDistributionSchema = z.object({
    transfer_id: z.string().min(1, tval("transfer-id")),
    warehouse_receipt: z.number().min(1, tval("warehouse-receipt")),
    sales_proforma: z.number().min(1, tval("sales-proforma")),
    customer: z.number().min(1, tval("customer")),
    agency_weight: z.union([z.string(), z.number()])
      .optional()
      .refine((val) => {
        if (!proformaMaxWeight) return true;
        const numVal = typeof val === 'string' ? parseFloat(val) : val;
        return !numVal || numVal <= proformaMaxWeight;
      }, {
        message: tval("agency-weight-exceeds-max"),
      }),
    unit_price: z.union([z.string(), z.number()]).optional(),
    agency_date: z.string().min(1, tval("agency-date")),
    description: z.string().optional(),
  });

  const [open, setOpen] = useState(trigger ? false : true);

  const form = useForm<B2BDistributionFormData>({
    resolver: zodResolver(b2bDistributionSchema) as any,
    defaultValues: {
      transfer_id: initialData?.transfer_id || "",
      warehouse_receipt: initialData?.warehouse_receipt || 0,
      sales_proforma: initialData?.sales_proforma || 0,
      customer: initialData?.customer || 0,
      agency_weight: initialData?.agency_weight || 0,
      unit_price: initialData?.unit_price || 0,
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
          <DialogHeader className="px-3.5 py-4.5 justify-start relative" style={{ backgroundColor: "#f6d265" }}>
            <DialogTitle className="font-bold text-white text-right">{t("title")}</DialogTitle>
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

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4 px-12">
              <fieldset disabled={!isEditMode} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control as any}
                  name="transfer_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("transfer-id")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t("enter-transfer-id")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="sales_proforma"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("sales-proforma")}</FormLabel>
                      <FormControl>
                        <SimpleCombobox
                          value={field.value > 0 ? field.value.toString() : ""}
                          onValueChange={(value) => {
                            if (value) {
                              const proformaId = Number(value);
                              field.onChange(proformaId);

                              // Set customer, max weight, and unit_price from proforma
                              const selectedProforma = salesProformas.find(p => p.id === proformaId);
                              if (selectedProforma) {
                                // Auto-populate customer from proforma
                                if (selectedProforma.customer) {
                                  form.setValue('customer', selectedProforma.customer);
                                }

                                // Calculate and store total weight for display only
                                if (selectedProforma.lines && selectedProforma.lines.length > 0) {
                                  const totalWeight = selectedProforma.lines.reduce((sum, line) => sum + (line.weight || 0), 0);
                                  setProformaMaxWeight(totalWeight);

                                  // Auto-populate unit_price
                                  const avgUnitPrice = selectedProforma.lines.length > 0
                                    ? selectedProforma.lines.reduce((sum, line) => sum + (line.unit_price || 0), 0) / selectedProforma.lines.length
                                    : 0;
                                  form.setValue('unit_price', avgUnitPrice);
                                }
                              }
                            } else {
                              setProformaMaxWeight(null);
                            }
                          }}
                          options={salesProformas.map(proforma => ({
                            value: proforma.id.toString(),
                            label: `${proforma.serial_number} - ${proforma.customer_name || proforma.customer}`,
                            id: proforma.id,
                            name: proforma.serial_number
                          }))}
                          placeholder={t("select-sales-proforma")}
                          searchPlaceholder={tCommon("search_placeholders.search_proformas")}
                          showCreateNew={true}
                          createNewText={t("create-new-sales-proforma")}
                          onCreateNew={() => setShowSalesProformaModal(true)}
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
                  name="warehouse_receipt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("warehouse_receipt")}</FormLabel>
                      <FormControl>
                        <SimpleCombobox
                          value={field.value > 0 ? field.value.toString() : ""}
                          onValueChange={(value) => {
                            if (value) {
                              field.onChange(Number(value));
                            }
                          }}
                          options={warehouseReceipts.map(receipt => ({
                            value: receipt.id.toString(),
                            label: describeWarehouseReceipt(receipt),
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
                name="customer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("distributor")}</FormLabel>
                    <FormControl>
                      <SimpleCombobox
                        value={field.value > 0 ? field.value.toString() : ""}
                        onValueChange={(value) => {
                          if (value) {
                            field.onChange(Number(value));
                          }
                        }}
                        options={customers.map(customer => ({
                          value: customer.id.toString(),
                          label: describeParty(customer),
                          id: customer.id,
                          name: getPartyDisplayName(customer)
                        }))}
                        placeholder={t("select-distributor")}
                        searchPlaceholder={tCommon("search_placeholders.search_distributors")}
                        showCreateNew={true}
                        createNewText={tCommon("create_new.customer")}
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
                      <FormLabel>
                        <span>{t("agency-weight")}</span>
                        {proformaMaxWeight && (
                          <span className="mr-2 text-sm font-normal text-muted-foreground">
                            - نهایت {Number(proformaMaxWeight).toLocaleString('fa-IR')} کیلوگرم
                          </span>
                        )}
                      </FormLabel>
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
                          disabled={true}
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
              </fieldset>

              {isEditMode && (
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={handleClose}>
                    {t("cancel")}
                  </Button>
                  <Button type="submit" className="hover:bg-[#f6d265]">{t("save")}</Button>
                </div>
              )}
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

      {showSalesProformaModal && (
        <SalesProformaModal
          onSubmit={async (newProforma) => {
            try {
              const proformaData = {
                ...newProforma,
                payment_description: newProforma.payment_description || null
              };
              const created = await createSalesProforma(proformaData as any);
              if (created) {
                await loadSalesProformas();
                form.setValue('sales_proforma', created.id);

                // Auto-populate customer from the newly created proforma
                if (created.customer) {
                  form.setValue('customer', created.customer);
                }

                // Set max weight and unit_price from the newly created proforma
                if (created.lines && created.lines.length > 0) {
                  const totalWeight = created.lines.reduce((sum, line) => sum + (line.weight || 0), 0);
                  setProformaMaxWeight(totalWeight);

                  // Auto-populate unit_price
                  const avgUnitPrice = created.lines.length > 0
                    ? created.lines.reduce((sum, line) => sum + (line.unit_price || 0), 0) / created.lines.length
                    : 0;
                  form.setValue('unit_price', avgUnitPrice);
                }

                setShowSalesProformaModal(false);
              }
            } catch (error) {
              console.error("Failed to create sales proforma:", error);
              throw error;
            }
          }}
          onClose={() => setShowSalesProformaModal(false)}
        />
      )}

    </>
  );
}
