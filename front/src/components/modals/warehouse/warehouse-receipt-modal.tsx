"use client";


import { useState, useEffect, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../../ui/form";
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
import { createWarehouse, fetchWarehouseReceipts } from "@/lib/api/warehouse";
import { createProduct } from "@/lib/api/core";
import { createPurchaseProforma } from "@/lib/api/finance";
import { ProformaLine } from "@/lib/interfaces/finance";
import { formatNumber } from "@/lib/utils/number-format";
import { useDefaultIndicator } from "@/lib/hooks/use-default-indicator";
import { IndicatorCapacityGuard } from "@/components/indicator-capacity-guard";
import { incrementIndicatorCounter } from "@/lib/api/core";
import { toPersianDigits } from "@/lib/utils/numbers";
import {
  DEFAULT_INDICATOR_TEMPLATE,
  buildIndicatorPreview,
  compactIndicatorValue,
} from "@/lib/indicator-format";
import {
  INDICATOR_TEXT_PROPS,
  renderLocalizedValue,
  VALUE_PLACEHOLDER,
} from "@/lib/utils/localized-value";

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
  const [selectedProformaLines, setSelectedProformaLines] = useState<ProformaLine[]>([]);


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
  }, []);
  const getTodayDate = () => {
    if (typeof window === 'undefined') return '';
    return getTodayGregorian();
  };

  const receiptItemSchema = z.object({
    product: z.number().min(1, tval("product-required")),
    weight: z.union([z.string(), z.number()]).refine(
      (val) => {
        if (val === "" || val === null || val === undefined) return false;
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return !isNaN(num) && num > 0;
      },
      { message: tval("weight-required") }
    ),
  });

  const warehouseReceiptSchema = z.object({
    id: z.number().optional(),
    receipt_id: z.string().min(1, tval("receipt-id")),
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
    items: z.array(receiptItemSchema).min(1, tval("items")).superRefine((items, ctx) => {
      if (selectedProformaLines.length > 0) {
        items.forEach((item, index) => {
          const proformaLine = selectedProformaLines[index];
          if (proformaLine) {
            const weight = typeof item.weight === 'string' ? parseFloat(item.weight) : item.weight;
            if (!isNaN(weight) && weight > proformaLine.weight) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: tval("weight-exceeds-max"),
                path: [index, 'weight'],
              });
            }
          }
        });
      }
    }),
  });

  const [open, setOpen] = useState(trigger ? false : true);

  const form = useForm<WarehouseReceiptFormData>({
    resolver: zodResolver(warehouseReceiptSchema) as any,
    defaultValues: {
      id: initialData?.id,
      receipt_id: initialData?.receipt_id
        ? compactIndicatorValue(initialData.receipt_id)
        : "",
      receipt_type: initialData?.receipt_type || "purchase",
      date: initialData?.date || getTodayDate(),
      warehouse: initialData?.warehouse || 0,
      description: initialData?.description || "",
      cottage_serial_number: initialData?.cottage_serial_number || "",
      proforma: initialData?.proforma || undefined,
      items: initialData?.items || [{ product: 0, weight: "" }],
    },
  });

  const defaultIndicator = useDefaultIndicator({
    section: "warehouse_receipt",
    form,
    fieldName: "receipt_id",
    enabled: !readOnly && !isEditing && !initialData?.receipt_id,
    formatWithSpacing: true,
  });

  const isCounterExhausted = useMemo(
    () =>
      !!defaultIndicator &&
      typeof defaultIndicator.counter === "number" &&
      typeof defaultIndicator.end_number === "number" &&
      defaultIndicator.counter >= defaultIndicator.end_number,
    [defaultIndicator]
  );

  const indicatorPreview = useMemo(() => {
    if (!defaultIndicator) return null;
    const startNumber = defaultIndicator.start_number ?? 1;
    const currentCounter = Math.max((defaultIndicator.counter ?? 0) + 1, startNumber);
    return buildIndicatorPreview(
      defaultIndicator.format_template || DEFAULT_INDICATOR_TEMPLATE,
      { counter: currentCounter + 1 }
    );
  }, [defaultIndicator]);

  const currentIndicatorPreview = useMemo(() => {
    if (!defaultIndicator) return null;
    const startNumber = defaultIndicator.start_number ?? 1;
    const currentCounter = Math.max((defaultIndicator.counter ?? 0) + 1, startNumber);
    return buildIndicatorPreview(
      defaultIndicator.format_template || DEFAULT_INDICATOR_TEMPLATE,
      { counter: currentCounter }
    );
  }, [defaultIndicator]);

  const indicatorDescriptionTemplate = useMemo(
    () => tCommon("indicator_next_value", { value: VALUE_PLACEHOLDER }),
    [tCommon]
  );

  const hasExistingReceiptId = Boolean(initialData?.receipt_id);
  const showReceiptInput = hasExistingReceiptId || !indicatorPreview;
  const showGeneratedReceiptPreview =
    !hasExistingReceiptId && !!indicatorPreview && !!currentIndicatorPreview;
  const receiptInputClassNames = [
    "font-mono",
    "text-right",
    hasExistingReceiptId ? "bg-gray-100" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const receiptType = form.watch("receipt_type");

  useEffect(() => {
    if (receiptType === "import_cottage") {
      form.setValue("proforma", undefined);
      setSelectedProformaLines([]);
    }
  }, [receiptType, form]);

  const handleSubmit = async (data: any) => {
    if (isCounterExhausted) return;

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
          <IndicatorCapacityGuard indicator={defaultIndicator} onClose={handleClose}/>
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
              <fieldset disabled={!isEditMode || isCounterExhausted} className="space-y-6">
              <div className="grid grid-cols-2 gap-4 items-start">
                <FormField
                  control={form.control as any}
                  name="receipt_id"
                  render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("receipt-id")}</FormLabel>
                  <FormControl>
                    {showReceiptInput ? (
                      <Input
                        {...field}
                        value={toPersianDigits(field.value ?? "")}
                        onChange={(e) => !hasExistingReceiptId && !defaultIndicator && field.onChange(e.target.value)}
                        dir="rtl"
                        className={receiptInputClassNames}
                        placeholder={t("receipt-id")}
                        readOnly={hasExistingReceiptId || !!defaultIndicator}
                      />
                    ) : (
                      <input type="hidden" {...field} value={field.value ?? ""} />
                    )}
                  </FormControl>
                  {showGeneratedReceiptPreview && currentIndicatorPreview && (
                    <div
                      className={`flex h-9 w-full items-center justify-start rounded-md border border-input bg-gray-100 px-3 py-1 text-sm text-right shadow-sm ${
                        isEditing ? "cursor-not-allowed" : ""
                      }`}
                      dir="rtl"
                    >
                      {renderLocalizedValue(
                        "",
                        currentIndicatorPreview.parts.map((part, index) => (
                          <bdi
                            key={`warehouse-receipt-preview-${index}`}
                            dir="auto"
                            style={{ unicodeBidi: "plaintext" }}
                            className="leading-none"
                          >
                            {part}
                          </bdi>
                        )),
                        "font-mono"
                      )}
                    </div>
                  )}
                  {showGeneratedReceiptPreview && indicatorPreview && (
                    <FormDescription className="text-xs text-muted-foreground" dir="rtl">
                      {renderLocalizedValue(
                        indicatorDescriptionTemplate,
                        indicatorPreview.parts.map((part, index) => (
                          <bdi
                            key={`warehouse-receipt-preview-desc-${index}`}
                            dir="auto"
                            style={{ unicodeBidi: "plaintext" }}
                            className="leading-none"
                          >
                            {part}
                          </bdi>
                        )),
                        "font-mono"
                      )}
                    </FormDescription>
                  )}
                  <FormMessage className="min-h-[1.25rem]" />
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
                      <FormMessage className="min-h-[1.25rem]" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 items-start">
                <FormField
                  control={form.control as any}
                  name="receipt_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("receipt-type")}</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                        >
                          <option value="import_cottage">{t("type-import")}</option>
                          <option value="distribution_cottage">{t("type-distribution")}</option>
                          <option value="purchase">{t("type-purchase")}</option>
                        </select>
                      </FormControl>
                      <FormMessage className="min-h-[1.25rem]" />
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
                      <FormMessage className="min-h-[1.25rem]" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 items-start">
                {(receiptType === "import_cottage" || receiptType === "distribution_cottage") && (
                  <FormField
                    control={form.control as any}
                    name="cottage_serial_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("cottage-serial")} <span className="text-gray-400 text-sm">{t("optional")}</span></FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage className="min-h-[1.25rem]" />
                      </FormItem>
                    )}
                  />
                )}

                {receiptType !== "import_cottage" && (
                  <FormField
                    control={form.control as any}
                    name="proforma"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("proforma")} <span className="text-gray-400 text-sm">{t("optional")}</span></FormLabel>
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
                                      if (created.lines && created.lines.length > 0) {
                                        form.setValue('items', created.lines.map(line => ({ product: line.product, weight: line.weight })));
                                        setSelectedProformaLines(created.lines);
                                      }
                                    }
                                  },
                                },);
                              } else if (value === "none") {
                                field.onChange(undefined);
                                setSelectedProformaLines([]);
                              } else {
                                const proformaId = Number(value);
                                field.onChange(proformaId);
                                const selectedProforma = (data.purchaseProformas || []).find(p => p.id === proformaId);
                                if (selectedProforma?.lines && selectedProforma.lines.length > 0) {
                                  form.setValue('items', selectedProforma.lines.map(line => ({ product: line.product, weight: line.weight })));
                                  setSelectedProformaLines(selectedProforma.lines);
                                } else {
                                  setSelectedProformaLines([]);
                                }
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
                                    if (created.lines && created.lines.length > 0) {
                                      form.setValue('items', created.lines.map(line => ({ product: line.product, weight: line.weight })));
                                      setSelectedProformaLines(created.lines);
                                    }
                                  }
                                },
                              },);
                            }}
                          />
                        </FormControl>
                        <FormMessage className="min-h-[1.25rem]" />
                      </FormItem>
                    )}
                  />
                )}
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
                  <div key={field.id} className="grid grid-cols-[1fr_1fr_auto] gap-4 p-4 border rounded-lg items-end">
                    <FormField
                      control={form.control as any}
                      name={`items.${index}.product`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col justify-between">
                          <FormLabel className="min-h-[2.5rem] flex items-center">{t("product")}</FormLabel>
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
                          <FormMessage className="min-h-[1.25rem]" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control as any}
                      name={`items.${index}.weight`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col justify-between">
                          <FormLabel className="min-h-[2.5rem] flex items-center">
                            {t("weight")}
                            {selectedProformaLines[index] && (
                              <span className="mr-2 text-sm font-normal text-muted-foreground">
                                - نهایت {formatNumber(selectedProformaLines[index].weight)} کیلوگرم
                              </span>
                            )}
                          </FormLabel>
                          <FormControl>
                            <NumberInput
                              value={typeof field.value === 'string' ? parseInt(field.value) || 0 : field.value || 0}
                              onChange={(value) => field.onChange(value)}
                            />
                          </FormControl>
                          <FormMessage className="min-h-[1.25rem]" />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-6"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              </fieldset>

              {isEditMode && (
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={handleClose}>
                    {t("cancel")}
                  </Button>
                  <Button
                    type="submit"
                    className="hover:bg-[#f6d265]"
                    disabled={isCounterExhausted}
                  >
                    {t("save")}
                  </Button>
                </div>
              )}
            </form>
          </Form>
        </DialogContent>
      </Dialog>

    </>
  );
}
