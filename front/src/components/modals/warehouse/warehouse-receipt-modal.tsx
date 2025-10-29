"use client";


import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../../ui/form";
import { Input } from "../../ui/input";
import { SimpleCombobox } from "../../ui/simple-combobox";
import { NumberInput } from "../../ui/number-input";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCoreData } from "@/lib/core-data-context";
import { useModal } from "@/lib/modal-context";
import { PersianDatePicker } from "../../ui/persian-date-picker";
import { getTodayGregorian } from "@/lib/utils/persian-date";
import { getPartyDisplayName } from "@/lib/utils/party-utils";
import { describeWarehouse, describePurchaseProforma, describeProduct } from "@/lib/utils/label-utils";
import { WarehouseFormData, WarehouseModal } from "./warehouse-modal";
import { ProductFormData, ProductModal } from "../product-modal";
import { PurchaseProformaFormData, PurchaseProformaModal } from "../finance/purchaseproforma-modal";
import { createWarehouse, fetchWarehouseReceipts, fetchNextReceiptId } from "@/lib/api/warehouse";
import { createProduct } from "@/lib/api/core";
import { createPurchaseProforma } from "@/lib/api/finance";

export type WarehouseReceiptFormData = {
  id?: number;
  receipt_id?: string;
  receipt_type: "import_cottage" | "distribution_cottage" | "purchase";
  date: string;
  warehouse: number;
  description?: string;
  cottage_serial_number?: string;
  proforma?: number;
  items: {
    product: number;
    weight: string | number;
  }[];
};

interface WarehouseReceiptModalProps {
  trigger?: React.ReactNode;
  onSubmit?: (data: WarehouseReceiptFormData) => void;
  onClose?: () => void;
  initialData?: Partial<WarehouseReceiptFormData>;
  readOnly?: boolean;
  isEditing?: boolean;
}

export function WarehouseReceiptModal({ trigger, onSubmit, onClose, initialData, readOnly = false, isEditing }: WarehouseReceiptModalProps) {
  const tval = useTranslations("modals.warehouseReceipt.validation");
  const t = useTranslations("modals.warehouseReceipt");
  const tCommon = useTranslations("common");
  const { data, refreshData } = useCoreData();
  const { openModal } = useModal();
  const [existingCottageNumbers, setExistingCottageNumbers] = useState<Set<string>>(new Set());
  const [isEditMode, setIsEditMode] = useState(!readOnly);


  useEffect(() => {
    if (data.warehouses.length === 0) {
      refreshData('warehouses');
    }
    if (data.products.length === 0) {
      refreshData('products');
    }
    if (data.purchaseProformas.length === 0) {
      refreshData('purchaseProformas');
    }
    if (data.suppliers.length === 0) {
      refreshData('suppliers');
    }

    // Load existing cottage serial numbers for validation
    const loadExistingCottageNumbers = async () => {
      try {
        const receipts = await fetchWarehouseReceipts();
        if (receipts) {
          const cottageNumbers = new Set(
            receipts
              .map(r => r.cottage_serial_number)
              .filter((num): num is string => num !== null && num !== undefined && num.trim() !== '')
          );
          setExistingCottageNumbers(cottageNumbers);
        }
      } catch (error) {
        console.error('Failed to load existing cottage numbers:', error);
      }
    };

    loadExistingCottageNumbers();

    // Fetch next receipt ID only when creating new (not editing)
    if (!isEditing && !initialData?.receipt_id) {
      loadNextReceiptId();
    }
  }, [isEditing, initialData?.receipt_id]);

  const loadNextReceiptId = async () => {
    try {
      const nextId = await fetchNextReceiptId();
      form.setValue('receipt_id', nextId);
    } catch (error) {
      console.error('Failed to load next receipt ID:', error);
    }
  };
  const getTodayDate = () => {
    if (typeof window === 'undefined') return '';
    return getTodayGregorian();
  };

  const receiptItemSchema = z.object({
    product: z.number().min(1, tval("product-required")),
    weight: z.union([z.string(), z.number()]).optional(),
  });

  const warehouseReceiptSchema = z.object({
    id: z.number().optional(),
    receipt_id: z.string().optional(),
    receipt_type: z.enum(["import_cottage", "distribution_cottage", "purchase"]),
    date: z.string().min(1, tval("date")),
    warehouse: z.number().min(1, tval("warehouse")),
    description: z.string().optional(),
    cottage_serial_number: z.string().optional().refine(
      (value) => {
        // Allow empty values
        if (!value || value.trim() === '') return true;

        // When editing, exclude the current record's cottage number from the check
        const currentCottageNumber = initialData?.cottage_serial_number;
        if (currentCottageNumber && value.trim() === currentCottageNumber.trim()) {
          return true;
        }

        // Check if the cottage number already exists
        return !existingCottageNumbers.has(value.trim());
      },
      {
        message: tval("cottage-serial-exists"),
      }
    ),
    proforma: z.number().positive().optional(),
    items: z.array(receiptItemSchema).min(1, tval("items")),
  });

  const [open, setOpen] = useState(trigger ? false : true);

  const form = useForm<WarehouseReceiptFormData>({
    resolver: zodResolver(warehouseReceiptSchema) as any,
    defaultValues: {
      id: initialData?.id,
      receipt_id: initialData?.receipt_id || "",
      receipt_type: initialData?.receipt_type || "purchase",
      date: initialData?.date || getTodayDate(),
      warehouse: initialData?.warehouse || 0,
      description: initialData?.description || "",
      cottage_serial_number: initialData?.cottage_serial_number || "",
      proforma: initialData?.proforma || undefined,
      items: initialData?.items || [{ product: 0, weight: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const receiptType = form.watch("receipt_type");

  const handleSubmit = async (data: any) => {

    try {
      // Convert empty cottage_serial_number to undefined to avoid unique constraint issues
      // Remove id field as it's not needed in the submission payload
      const { id, ...dataWithoutId } = data;
      const submissionData = {
        ...dataWithoutId,
        cottage_serial_number: data.cottage_serial_number?.trim() || undefined,
      };

      if (onSubmit) {
        await onSubmit(submissionData);
      }
      if (trigger) {
        setOpen(false);
      } else {
        onClose?.();
      }
      form.reset();
    } catch (error) {
      console.error("Error in form submission:", error);
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
        <DialogContent dir="rtl" className="min-w-[80%] max-h-[90vh] overflow-y-auto scrollbar-hide  p-0 my-0 mx-auto [&>button]:hidden">
          <DialogHeader className="px-3.5 py-4.5  justify-start relative" style={{ backgroundColor: "#f6d265" }}>
            <DialogTitle className="font-bold text-white text-right">{t("title")}</DialogTitle>
            <DialogDescription className="sr-only">Create or edit warehouse receipt</DialogDescription>
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
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control as any}
                  name="receipt_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("receipt-id")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          readOnly={isEditing}
                          className={isEditing ? "bg-gray-100 cursor-not-allowed" : ""}
                          autoFocus={false}
                          tabIndex={isEditing ? -1 : undefined}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("date")}</FormLabel>
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control as any}
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
                  control={form.control as any}
                  name="warehouse"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("warehouse")}</FormLabel>
                      <FormControl>
                        <SimpleCombobox
                          value={field.value > 0 ? field.value.toString() : ""}
                          onValueChange={(value) => {
                            if (value) {
                              field.onChange(Number(value));
                            }
                          }}
                          options={(data.warehouses || []).map(warehouse => ({
                            value: warehouse.id.toString(),
                            label: describeWarehouse(warehouse),
                            id: warehouse.id,
                            name: warehouse.name
                          }))}
                          placeholder={t("select-warehouse")}
                          searchPlaceholder={tCommon("search_placeholders.search_warehouses")}
                          showCreateNew={true}
                          createNewText={t("create-new-warehouse")}
                          onCreateNew={() => {
                            openModal(WarehouseModal, {
                              onSubmit: async (newWarehouse: WarehouseFormData) => {
                                const created = await createWarehouse(newWarehouse);
                                if (created) {
                                  await refreshData('warehouses');
                                  form.setValue('warehouse', created.id);
                                }
                              }
                            });
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {(receiptType === "import_cottage" || receiptType === "distribution_cottage") && (
                  <FormField
                    control={form.control as any}
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
                  control={form.control as any}
                  name="proforma"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("proforma")}</FormLabel>
                      <FormControl>
                        <SimpleCombobox
                          value={field.value !== undefined && field.value !== null && field.value > 0 ? field.value.toString() : "none"}
                          onValueChange={(value) => {
                            if (value === "new") {
                              openModal(PurchaseProformaModal, {
                                onSubmit: async (newProforma: PurchaseProformaFormData) => {
                                  const created = await createPurchaseProforma(newProforma);
                                  if (created) {
                                    await refreshData('purchaseProformas');
                                    form.setValue('proforma', created.id);
                                    form.trigger('proforma');
                                  }
                                },
                              },);
                            } else {
                              field.onChange(value === "none" ? undefined : Number(value));
                            }
                          }}
                          options={[
                            { value: "none", label: t("no-proforma") },
                            ...(data.purchaseProformas || []).map(proforma => ({
                              value: proforma.id.toString(),
                              label: describePurchaseProforma(proforma),
                              id: proforma.id,
                              name: proforma.serial_number
                            }))
                          ]}
                          placeholder={t("select-proforma")}
                          searchPlaceholder={tCommon("search_placeholders.search_proformas")}
                          showCreateNew={true}
                          createNewText={t("create-new-proforma")}
                          onCreateNew={() => {
                            openModal(PurchaseProformaModal, {
                              onSubmit: async (newProforma: PurchaseProformaFormData) => {
                                const created = await createPurchaseProforma(newProforma);
                                if (created) {
                                  await refreshData('purchaseProformas');
                                  form.setValue('proforma', created.id);
                                  form.trigger('proforma');
                                }
                              },
                            },);
                          }}
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
                    onClick={() => append({ product: 0, weight: "" })}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t("add-item")}
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-3 gap-4 p-4 border rounded-lg">
                    <FormField
                      control={form.control as any}
                      name={`items.${index}.product`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("product")}</FormLabel>
                          <FormControl>
                            <SimpleCombobox
                              value={field.value > 0 ? field.value.toString() : ""}
                              onValueChange={(value) => {
                                if (value) {
                                  field.onChange(Number(value));
                                }
                              }}
                              options={(data.products || []).map(product => ({
                                value: product.id.toString(),
                                label: describeProduct(product),
                                id: product.id,
                                name: product.name
                              }))}
                              placeholder={t("select-product")}
                              searchPlaceholder={tCommon("search_placeholders.search_products")}
                              showCreateNew={true}
                              createNewText={t("create-new-product")}
                              onCreateNew={() => {
                                const currentIndex = index;
                                openModal(ProductModal, {
                                  onSubmit: async (newProduct: ProductFormData) => {
                                    const created = await createProduct(newProduct);
                                    if (created) {
                                      await refreshData('products');
                                      const items = form.getValues('items');
                                      items[currentIndex].product = created.id;
                                      form.setValue('items', items);
                                    }
                                  }
                                });
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control as any}
                      name={`items.${index}.weight`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("weight")}</FormLabel>
                          <FormControl>
                            <NumberInput
                              value={typeof field.value === 'string' ? parseInt(field.value) || 0 : field.value || 0}
                              onChange={(value) => field.onChange(value)}
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
