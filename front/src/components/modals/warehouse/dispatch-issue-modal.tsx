"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../ui/form";
import { Input } from "../../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { NumberInput } from "../../ui/number-input";
import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCoreData } from "@/lib/core-data-context";
import { useModal } from "@/lib/modal-context";
import { PersianDatePicker } from "../../ui/persian-date-picker";
import { getTodayGregorian } from "@/lib/utils/persian-date";
import { getPartyDisplayName } from "@/lib/utils/party-utils";
import {
  describeWarehouse,
  describeSalesProforma,
  describeShippingCompany,
  describeProduct,
  describeParty,
} from "@/lib/utils/label-utils";
import { WarehouseFormData, WarehouseModal } from "./warehouse-modal";
import { ProductFormData, ProductModal } from "../product-modal";
import { ReceiverFormData, ReceiverModal } from "../receiver-modal";
import {
  ShippingCompanyFormData,
  ShippingCompanyModal,
} from "../shipping-company-modal";
import {
  SalesProformaFormData,
  SalesProformaModal,
} from "../finance/salesproforma-modal";
import { createWarehouse } from "@/lib/api/warehouse";
import {
  createProduct,
  createReceiver,
  createShippingCompany,
  incrementIndicatorCounter,
} from "@/lib/api/core";
import { createSalesProforma } from "@/lib/api/finance";
import { useDefaultIndicator } from "@/lib/hooks/use-default-indicator";
import { IndicatorCapacityGuard } from "@/components/indicator-capacity-guard";
import { toPersianDigits } from "@/lib/utils/numbers";
import {
  DEFAULT_INDICATOR_TEMPLATE,
  buildIndicatorPreview,
  renderIndicatorFormat,
  compactIndicatorValue,
} from "@/lib/indicator-format";
import {
  renderLocalizedValue,
  VALUE_PLACEHOLDER,
} from "@/lib/utils/localized-value";

type DispatchIssueFormData = {
  dispatch_id: string;
  warehouse: number;
  sales_proforma: number;
  issue_date: string;
  validity_date: string;
  description?: string;
  shipping_company: number;
  items: {
    product: number;
    weight?: string | number;
    vehicle_type: "single" | "double" | "trailer";
    receiver: number;
  }[];
};

interface DispatchIssueModalProps {
  trigger?: React.ReactNode;
  onSubmit?: (data: DispatchIssueFormData) => void;
  onClose?: () => void;
  initialData?: Partial<DispatchIssueFormData>;
  isEditing?: boolean;
}

export function DispatchIssueModal({
  trigger,
  onSubmit,
  onClose,
  initialData,
  isEditing,
}: DispatchIssueModalProps) {
  const tval = useTranslations("modals.dispatchIssue.validation");
  const t = useTranslations("modals.dispatchIssue");
  const tCommon = useTranslations("common");
  const { data, refreshData } = useCoreData();
  const { openModal } = useModal();

  useEffect(() => {
    if (data.warehouses.length === 0) {
      refreshData("warehouses");
    }
    if (data.products.length === 0) {
      refreshData("products");
    }
    if (data.receivers.length === 0) {
      refreshData("receivers");
    }
    if (data.shippingCompanies.length === 0) {
      refreshData("shippingCompanies");
    }
    if (data.salesProformas.length === 0) {
      refreshData("salesProformas");
    }
  }, []);

  const getTodayDate = () => {
    if (typeof window === "undefined") return "";
    return getTodayGregorian();
  };

  const dispatchItemSchema = z.object({
    product: z.number().min(1, tval("product-required")),
    weight: z.union([z.string(), z.number()]).refine(
      (val) => {
        if (val === "" || val === null || val === undefined) return false;
        const num = typeof val === "string" ? parseFloat(val) : val;
        return !isNaN(num) && num > 0;
      },
      { message: tval("weight-required") }
    ),
    vehicle_type: z.enum(["single", "double", "trailer"]),
    receiver: z.number().min(0),
  });

  const dispatchIssueSchema = z.object({
    dispatch_id: z.string().min(1, tval("dispatch-id")),
    warehouse: z.number().min(0),
    sales_proforma: z.number().min(0),
    issue_date: z.string().min(1, tval("issue-date")),
    validity_date: z.string().min(1, tval("validity-date")),
    description: z.string().optional(),
    shipping_company: z.number().min(0),
    items: z.array(dispatchItemSchema).min(1, tval("items")),
  });

  const [open, setOpen] = useState(trigger ? false : true);

  const form = useForm<DispatchIssueFormData>({
    resolver: zodResolver(dispatchIssueSchema) as any,
    defaultValues: {
      dispatch_id: initialData?.dispatch_id
        ? compactIndicatorValue(initialData.dispatch_id)
        : "",
      warehouse: initialData?.warehouse || 0,
      sales_proforma: initialData?.sales_proforma || 0,
      issue_date: initialData?.issue_date || getTodayDate(),
      validity_date: initialData?.validity_date || getTodayDate(),
      description: initialData?.description || "",
      shipping_company: initialData?.shipping_company || 0,
      items: initialData?.items || [
        { product: 0, weight: 0, vehicle_type: "single", receiver: 0 },
      ],
    },
  });

  const defaultIndicator = useDefaultIndicator({
    section: "dispatch_issue",
    form,
    fieldName: "dispatch_id",
    enabled: !isEditing && !initialData?.dispatch_id,
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
  const hasExistingDispatchId = Boolean(initialData?.dispatch_id);
  const showDispatchInput = hasExistingDispatchId || !indicatorPreview;
  const showGeneratedDispatchPreview =
    !hasExistingDispatchId && !!indicatorPreview && !!currentIndicatorPreview;
  const dispatchInputClassNames = [
    "font-mono",
    "text-right",
    hasExistingDispatchId ? "bg-gray-100" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const handleSubmit = async (data: any) => {
    if (isCounterExhausted) return;
    try {
      if (onSubmit) {
        await onSubmit(data);
      }
      if (!isEditing && defaultIndicator) {
        try {
          await incrementIndicatorCounter(defaultIndicator.id);
        } catch (error) {
          console.error("Failed to increment indicator counter:", error);
        }
      }
      // Only close and reset if successful
      if (trigger) {
        setOpen(false);
      } else {
        onClose?.();
      }
      form.reset();
    } catch (error) {
      console.error("Error in form submission:", error);
      // Don't close the modal if there's an error
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
          <IndicatorCapacityGuard indicator={defaultIndicator} onClose={handleClose} />
          <DialogHeader className="px-3.5 py-4.5  justify-start" style={{ backgroundColor: "#f6d265" }}>
            <DialogTitle className="font-bold text-white text-right">{t("title")}</DialogTitle>
            <DialogDescription className="sr-only">Create or edit dispatch issue</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6 py-4 px-12"
            >
              <fieldset disabled={isCounterExhausted} className="space-y-6">
              <div className="grid grid-cols-2 gap-4 items-start">
                <FormField
                  control={form.control as any}
                  name="dispatch_id"
                  render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("dispatch-id")}</FormLabel>
                  <FormControl>
                    {showDispatchInput ? (
                      <Input
                        {...field}
                        value={toPersianDigits(field.value ?? "")}
                        onChange={(e) => !hasExistingDispatchId && !defaultIndicator && field.onChange(e.target.value)}
                        dir="rtl"
                        className={dispatchInputClassNames}
                        placeholder={t("dispatch-id")}
                        readOnly={hasExistingDispatchId || !!defaultIndicator}
                      />
                    ) : (
                      <input type="hidden" {...field} value={field.value ?? ""} />
                    )}
                  </FormControl>
                  {showGeneratedDispatchPreview && currentIndicatorPreview && (
                    <div
                      className="flex h-9 w-full items-center justify-start rounded-md border border-input bg-gray-100 px-3 py-1 text-sm text-right shadow-sm"
                      dir="rtl"
                    >
                      {renderLocalizedValue(
                        "",
                        currentIndicatorPreview.parts.map((part, index) => (
                          <bdi
                            key={`dispatch-issue-preview-${index}`}
                            dir="auto"
                            className="leading-none"
                          >
                            {part}
                          </bdi>
                        )),
                        "font-mono"
                      )}
                    </div>
                  )}
                  {showGeneratedDispatchPreview && indicatorPreview && (
                    <FormDescription className="text-xs text-muted-foreground" dir="rtl">
                      {renderLocalizedValue(
                        indicatorDescriptionTemplate,
                        indicatorPreview.parts.map((part, index) => (
                          <bdi
                            key={`dispatch-issue-preview-desc-${index}`}
                            dir="auto"
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
                    name="warehouse"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("warehouse")}</FormLabel>
                        <FormControl>
                          <Select
                            value={
                              field.value > 0 ? field.value.toString() : ""
                            }
                            onValueChange={(value) => {
                              if (value === "new") {
                                openModal(WarehouseModal, {
                                  onSubmit: async (
                                    newWarehouse: WarehouseFormData
                                  ) => {
                                    const created = await createWarehouse(
                                      newWarehouse
                                    );
                                    if (created) {
                                      await refreshData("warehouses");
                                      form.setValue("warehouse", created.id);
                                    }
                                  },
                                });
                              } else if (value) {
                                field.onChange(Number(value));
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue
                                placeholder={t("select-warehouse")}
                              />
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
                              {data.warehouses.length > 0 && (
                                <div className="border-t my-1" />
                              )}
                              {data.warehouses.map((warehouse) => (
                                <SelectItem
                                  key={warehouse.id}
                                  value={warehouse.id.toString()}
                                >
                                  {describeWarehouse(warehouse)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage className="min-h-[1.25rem]" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 items-start">
                  <FormField
                    control={form.control as any}
                    name="sales_proforma"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("sales-proforma")}</FormLabel>
                        <FormControl>
                          <Select
                            value={
                              field.value > 0 ? field.value.toString() : ""
                            }
                            onValueChange={(value) => {
                              if (value === "new") {
                                openModal(SalesProformaModal, {
                                  onSubmit: async (
                                    newProforma: SalesProformaFormData
                                  ) => {
                                    const cleanProforma = {
                                      ...newProforma,
                                      tax: parseFloat(newProforma.tax) || 0,
                                      discount:
                                        parseFloat(newProforma.discount) || 0,
                                      shipping_cost:
                                        parseFloat(
                                          newProforma.shipping_cost || ""
                                        ) || 0,
                                      commission:
                                        parseFloat(
                                          newProforma.commission || ""
                                        ) || 0,
                                      other_cost:
                                        parseFloat(
                                          newProforma.other_cost || ""
                                        ) || 0,
                                      export_preset:
                                        newProforma.export_preset || null,
                                      lines: newProforma.lines.map((line) => ({
                                        ...line,
                                        weight: parseFloat(line.weight) || 0,
                                        unit_price:
                                          parseFloat(line.unit_price) || 0,
                                      })),
                                    };
                                    const created = await createSalesProforma(
                                      cleanProforma
                                    );
                                    if (created) {
                                      await refreshData("salesProformas");
                                      form.setValue(
                                        "sales_proforma",
                                        created.id
                                      );
                                    }
                                  },
                                });
                              } else if (value) {
                                field.onChange(Number(value));
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue
                                placeholder={t("select-sales-proforma")}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem
                                value="new"
                                className="font-semibold text-[#f6d265]"
                                onPointerDown={(e) => e.preventDefault()}
                              >
                                <Plus className="inline-block w-4 h-4 mr-2" />
                                {t("create-new-sales-proforma")}
                              </SelectItem>
                              {data.salesProformas.length > 0 && (
                                <div className="border-t my-1" />
                              )}
                              {data.salesProformas.map((proforma) => (
                                <SelectItem
                                  key={proforma.id}
                                  value={proforma.id.toString()}
                                >
                                  {describeSalesProforma(proforma)}
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
                    name="shipping_company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("shipping-company")}</FormLabel>
                        <FormControl>
                          <Select
                            value={
                              field.value > 0 ? field.value.toString() : ""
                            }
                            onValueChange={(value) => {
                              if (value === "new") {
                                openModal(ShippingCompanyModal, {
                                  onSubmit: async (
                                    newCompany: ShippingCompanyFormData
                                  ) => {
                                    const created = await createShippingCompany(
                                      newCompany
                                    );
                                    if (created) {
                                      await refreshData("shippingCompanies");
                                      form.setValue(
                                        "shipping_company",
                                        created.id
                                      );
                                    }
                                  },
                                });
                              } else if (value) {
                                field.onChange(Number(value));
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue
                                placeholder={t("select-shipping-company")}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem
                                value="new"
                                className="font-semibold text-[#f6d265]"
                                onPointerDown={(e) => e.preventDefault()}
                              >
                                <Plus className="inline-block w-4 h-4 mr-2" />
                                {t("create-new-shipping-company")}
                              </SelectItem>
                              {data.shippingCompanies.length > 0 && (
                                <div className="border-t my-1" />
                              )}
                              {data.shippingCompanies.map((company) => (
                                <SelectItem
                                  key={company.id}
                                  value={company.id.toString()}
                                >
                                  {describeShippingCompany(company)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage className="min-h-[1.25rem]" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 items-start">
                  <FormField
                    control={form.control as any}
                    name="issue_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("issue-date")}</FormLabel>
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

                  <FormField
                    control={form.control as any}
                    name="validity_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("validity-date")}</FormLabel>
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

                <FormField
                  control={form.control as any}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("description")}{" "}
                        <span className="text-gray-400 text-sm">
                          {t("optional")}
                        </span>
                      </FormLabel>
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
                      onClick={() =>
                        append({
                          product: 0,
                          weight: 0,
                          vehicle_type: "single",
                          receiver: 0,
                        })
                      }
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {t("add-item")}
                    </Button>
                  </div>

                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-5 gap-4 p-4 border rounded-lg items-start"
                    >
                      <FormField
                        control={form.control as any}
                        name={`items.${index}.product`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("product")}</FormLabel>
                            <FormControl>
                              <Select
                                value={
                                  field.value > 0 ? field.value.toString() : ""
                                }
                                onValueChange={(value) => {
                                  if (value === "new") {
                                    const currentIndex = index;
                                    openModal(ProductModal, {
                                      onSubmit: async (
                                        newProduct: ProductFormData
                                      ) => {
                                        const created = await createProduct(
                                          newProduct
                                        );
                                        if (created) {
                                          await refreshData("products");
                                          const items = form.getValues("items");
                                          items[currentIndex].product =
                                            created.id;
                                          form.setValue("items", items);
                                        }
                                      },
                                    });
                                  } else if (value) {
                                    field.onChange(Number(value));
                                  }
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={t("select-product")}
                                  />
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
                                    <SelectItem
                                      key={product.id}
                                      value={product.id.toString()}
                                    >
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
                        name={`items.${index}.weight`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("weight")}</FormLabel>
                            <FormControl>
                              <NumberInput
                                value={field.value || 0}
                                onChange={(value) => field.onChange(value)}
                              />
                            </FormControl>
                            <FormMessage className="min-h-[1.25rem]" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control as any}
                        name={`items.${index}.vehicle_type`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("vehicle-type")}</FormLabel>
                            <FormControl>
                              <select
                                {...field}
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                              >
                                <option value="single">
                                  {t("vehicle-single")}
                                </option>
                                <option value="double">
                                  {t("vehicle-double")}
                                </option>
                                <option value="trailer">
                                  {t("vehicle-trailer")}
                                </option>
                              </select>
                            </FormControl>
                            <FormMessage className="min-h-[1.25rem]" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control as any}
                        name={`items.${index}.receiver`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("receiver")}</FormLabel>
                            <FormControl>
                              <Select
                                value={
                                  field.value > 0 ? field.value.toString() : ""
                                }
                                onValueChange={(value) => {
                                  if (value === "new") {
                                    const currentIndex = index;
                                    openModal(ReceiverModal, {
                                      onSubmit: async (
                                        newReceiver: ReceiverFormData
                                      ) => {
                                        const created = await createReceiver(
                                          newReceiver
                                        );
                                        if (created) {
                                          await refreshData("receivers");
                                          const items = form.getValues("items");
                                          items[currentIndex].receiver =
                                            created.id;
                                          form.setValue("items", items);
                                        }
                                      },
                                    });
                                  } else if (value) {
                                    field.onChange(Number(value));
                                  }
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={t("select-receiver")}
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem
                                    value="new"
                                    className="font-semibold text-[#f6d265]"
                                    onPointerDown={(e) => e.preventDefault()}
                                  >
                                    <Plus className="inline-block w-4 h-4 mr-2" />
                                    {t("create-new-receiver")}
                                  </SelectItem>
                                  {data.receivers.length > 0 && (
                                    <div className="border-t my-1" />
                                  )}
                                  {data.receivers.map((receiver) => (
                                    <SelectItem
                                      key={receiver.id}
                                      value={receiver.id.toString()}
                                    >
                                      {describeParty(receiver)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
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
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
