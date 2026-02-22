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
import {
  createCustomer,
  createProduct,
  incrementIndicatorCounter,
} from "@/lib/api/core";
import {
  createSalesProformaPreset,
  fetchSalesProformaPresets,
} from "@/lib/api/finance";
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
import {
  ProformaPresetFormData,
  ProformaPresetModal,
} from "@/components/modals/finance/proforma-preset-modal";
import { ProformaExportPreset } from "@/lib/interfaces/finance";

export type ProformaFormData = {
  serial_number: string;
  date: string;
  tax: string;
  discount: string;
  shipping_cost?: string;
  commission?: string;
  other_cost?: string;
  export_preset?: number | null;
  payment_type: "cash" | "credit" | "other";
  payment_description?: string;
  customer: number;
  lines: {
    product: number;
    weight: string;
    unit_price: string;
    tax: string;
    discount: string;
  }[];
};

interface ProformaModalProps {
  trigger?: React.ReactNode;
  onSubmit?: (data: ProformaFormData) => void;
  onClose?: () => void;
  initialData?: Partial<ProformaFormData>;
  readOnly?: boolean;
  isEditing?: boolean;
}

export function SalesProformaModal({
  trigger,
  onSubmit,
  onClose,
  initialData,
  readOnly = false,
  isEditing,
}: ProformaModalProps) {
  const tval = useTranslations("modals.salesProforma.validation");
  const t = useTranslations("modals.salesProforma");
  const tCommon = useTranslations("common");
  const { data, refreshData } = useCoreData();
  const { openModal } = useModal();
  const [isEditMode, setIsEditMode] = useState(!readOnly);
  const [presets, setPresets] = useState<ProformaExportPreset[]>([]);

  useEffect(() => {
    if (data.customers.length === 0) {
      refreshData("customers");
    }
    if (data.products.length === 0) {
      refreshData("products");
    }

    fetchSalesProformaPresets()
      .then((items) => setPresets(items || []))
      .catch(() => setPresets([]));
  }, []);
  const getTodayDate = () => {
    if (typeof window === "undefined") return "";
    return getTodayGregorian();
  };
  const toDecimal = (v?: string | number) => {
    if (v === undefined || v === null || v === "") return 0;
    const n = typeof v === "number" ? v : parseFloat(v.replace(/,/g, "."));
    return Number.isFinite(n) ? n : 0;
  };

  const proformaLineSchema = z.object({
    product: z.number().min(1, tval("product-required")),

    weight: z
      .union([z.string(), z.number()])
      .transform((val) => {
        if (val === "" || val === null || val === undefined) return 0;
        const num = typeof val === "string" ? parseFloat(val) : val;
        return isNaN(num) ? 0 : num;
      })
      .pipe(z.number().positive(tval("weight-required"))),

    unit_price: z
      .union([z.string(), z.number()])
      .transform((val) => {
        if (val === "" || val === null || val === undefined) return 0;
        const num = typeof val === "string" ? parseFloat(val) : val;
        return isNaN(num) ? 0 : num;
      })
      .pipe(z.number().positive(tval("unit-price-required"))),

    discount: z.preprocess(
      (val) => (val === undefined ? null : val),
      z.union([z.string(), z.number(), z.null()])
        .superRefine((val, ctx) => {
          if (val === null || val === "") {
            ctx.addIssue({ code: "custom", message: tval("discount-required") });
            return;
          }
          const num = typeof val === "string" ? parseFloat(val) : Number(val);
          if (isNaN(num) || num < 0) {
            ctx.addIssue({ code: "custom", message: tval("discount") });
          }
        })
        .transform((val) => {
          if (val === null || val === "") return 0;
          const num = typeof val === "string" ? parseFloat(val) : Number(val);
          return isNaN(num) ? 0 : num;
        })
    ),

    tax: z.preprocess(
      (val) => (val === undefined ? null : val),
      z.union([z.string(), z.number(), z.null()])
        .superRefine((val, ctx) => {
          if (val === null || val === "") {
            ctx.addIssue({ code: "custom", message: tval("tax-required") });
            return;
          }
          const num = typeof val === "string" ? parseFloat(val) : Number(val);
          if (isNaN(num) || num < 0) {
            ctx.addIssue({ code: "custom", message: tval("tax") });
          }
        })
        .transform((val) => {
          if (val === null || val === "") return 0;
          const num = typeof val === "string" ? parseFloat(val) : Number(val);
          return isNaN(num) ? 0 : num;
        })
    ),
  });

  const salesProformaSchema = z.object({
    serial_number: z
      .string()
      .min(1, tval("serialnumber"))
      .max(20, tval("serialnumber")),
    date: z.string().min(1, tval("date")),
    tax: z
      .union([z.string(), z.number()])
      .transform((val) => {
        if (val === "" || val === null || val === undefined) return 0;
        const num = typeof val === "string" ? parseFloat(val) : val;
        return isNaN(num) ? 0 : num;
      })
      .pipe(z.number().min(0)),
    discount: z
      .union([z.string(), z.number()])
      .transform((val) => {
        if (val === "" || val === null || val === undefined) return 0;
        const num = typeof val === "string" ? parseFloat(val) : val;
        return isNaN(num) ? 0 : num;
      })
      .pipe(z.number().min(0)),
    shipping_cost: z
      .union([z.string(), z.number()])
      .transform((val) => {
        if (val === "" || val === null || val === undefined) return 0;
        const num = typeof val === "string" ? parseFloat(val) : val;
        return isNaN(num) ? 0 : num;
      })
      .pipe(z.number().min(0))
      .optional(),
    commission: z
      .union([z.string(), z.number()])
      .transform((val) => {
        if (val === "" || val === null || val === undefined) return 0;
        const num = typeof val === "string" ? parseFloat(val) : val;
        return isNaN(num) ? 0 : num;
      })
      .pipe(z.number().min(0))
      .optional(),
    other_cost: z
      .union([z.string(), z.number()])
      .transform((val) => {
        if (val === "" || val === null || val === undefined) return 0;
        const num = typeof val === "string" ? parseFloat(val) : val;
        return isNaN(num) ? 0 : num;
      })
      .pipe(z.number().min(0))
      .optional(),
    export_preset: z
      .union([z.string(), z.number(), z.null(), z.undefined()])
      .transform((val) => {
        if (val === "" || val === null || val === undefined) return null;
        const num = typeof val === "string" ? Number(val) : val;
        if (!num || Number.isNaN(num)) return null;
        return num;
      })
      .nullable()
      .optional(),
    payment_type: z.enum(["cash", "credit", "other"]),
    payment_description: z.string().optional(),
    customer: z.number().min(1, tval("customer")),
    lines: z.array(proformaLineSchema).min(1, tval("lines")),
  });

  const [open, setOpen] = useState(trigger ? false : true);

  const form = useForm<ProformaFormData>({
    resolver: zodResolver(salesProformaSchema) as any,
    defaultValues: {
      serial_number: initialData?.serial_number
        ? compactIndicatorValue(initialData.serial_number)
        : "",
      date: initialData?.date || getTodayDate(),
      tax: initialData?.tax || "",
      discount: initialData?.discount || "",
      shipping_cost: initialData?.shipping_cost || "",
      commission: initialData?.commission || "",
      other_cost: initialData?.other_cost || "",
      export_preset: initialData?.export_preset ?? null,
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
  const hasExistingSerialNumber = Boolean(initialData?.serial_number);
  const showSerialInput = hasExistingSerialNumber || !indicatorPreview;
  const showGeneratedSerialPreview =
    !hasExistingSerialNumber && !!indicatorPreview && !!currentIndicatorPreview;
  const serialInputClassNames = [
    "font-mono",
    "text-right",
    hasExistingSerialNumber ? "bg-gray-100" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  });

  const handleSubmit = async (data: any) => {
    if (isCounterExhausted) return;
    if (onSubmit) {
      const apiData = {
        ...data,
        payment_description: data.payment_description || null,
        export_preset: data.export_preset || null,
      };
      await onSubmit(apiData);
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
          <IndicatorCapacityGuard indicator={defaultIndicator} onClose={handleClose} />
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
              <fieldset disabled={!isEditMode || isCounterExhausted} className="space-y-6">
              <div className="grid grid-cols-2 gap-4 items-start">
                <FormField
                  control={form.control as any}
                  name="serial_number"
                  render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('serialnumber')}</FormLabel>
                  <FormControl>
                    {showSerialInput ? (
                      <Input
                        {...field}
                        value={toPersianDigits(field.value ?? "")}
                        onChange={(e) => !hasExistingSerialNumber && !defaultIndicator && field.onChange(e.target.value)}
                        dir="rtl"
                        style={{ unicodeBidi: "plaintext" }}
                        className={serialInputClassNames}
                        placeholder={t('serialnumber')}
                        readOnly={hasExistingSerialNumber || !!defaultIndicator}
                      />
                    ) : (
                      <input type="hidden" {...field} value={field.value ?? ""} />
                    )}
                  </FormControl>
                      {showGeneratedSerialPreview && currentIndicatorPreview && (
                        <div
                          className={`flex h-9 w-full items-center justify-start rounded-md border border-input bg-gray-100 px-3 py-1 text-sm text-right shadow-sm ${
                            isEditing ? "cursor-not-allowed" : ""
                          }`} dir="rtl"
                        >
                           {renderLocalizedValue(
                              "",
                              currentIndicatorPreview.parts.map((part, index) => (
                                <bdi
                                  key={`sales-proforma-preview-${index}`}
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
                      {showGeneratedSerialPreview && indicatorPreview && (
                        <FormDescription className="text-xs text-muted-foreground" dir="rtl">
                          {renderLocalizedValue(
                            indicatorDescriptionTemplate,
                            indicatorPreview.parts.map((part, index) => (
                              <bdi
                                key={`sales-proforma-desc-${index}`}
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
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("date")}</FormLabel>
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
                        <FormLabel>{t("customer")}</FormLabel>
                        <FormControl>
                          <Select
                            value={
                              field.value > 0 ? field.value.toString() : ""
                            }
                            onValueChange={(value) => {
                              if (value === "new") {
                                openModal(CustomerModal, {
                                  onSubmit: async (
                                    newCustomer: CustomerFormData
                                  ) => {
                                    const created = await createCustomer(
                                      newCustomer
                                    );
                                    if (created) {
                                      await refreshData("customers");
                                      form.setValue("customer", created.id);
                                    }
                                  },
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
                                <SelectItem
                                  key={customer.id}
                                  value={customer.id.toString()}
                                >
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
                        <FormLabel>{t("payment")}</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                          >
                            <option value="cash">{t("payment_cash")}</option>
                            <option value="credit">
                              {t("payment_credit")}
                            </option>
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
                  name="export_preset"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("export_preset")}{" "}
                        <span className="text-gray-400 text-sm">
                          {t("optional")}
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Select
                          value={field.value ? String(field.value) : "0"}
                          onValueChange={(value) => {
                            if (value === "new") {
                              openModal(ProformaPresetModal, {
                                onSubmit: async (
                                  newPreset: ProformaPresetFormData
                                ) => {
                                  const created =
                                    await createSalesProformaPreset(newPreset);
                                  const fresh =
                                    await fetchSalesProformaPresets().catch(
                                      () => null
                                    );
                                  setPresets(fresh || []);
                                  if (created) {
                                    form.setValue("export_preset", created.id);
                                  }
                                },
                              });
                            } else if (value === "0") {
                              field.onChange(null);
                            } else {
                              field.onChange(Number(value));
                            }
                          }}
                          disabled={!isEditMode}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t("select-export-preset")}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">{tCommon("none")}</SelectItem>
                            <SelectItem
                              value="new"
                              className="font-semibold text-[#f6d265]"
                              onPointerDown={(e) => e.preventDefault()}
                            >
                              <Plus className="inline-block w-4 h-4 mr-2" />
                              {t("create-new-export-preset")}
                            </SelectItem>
                            {presets.length > 0 && (
                              <div className="border-t my-1" />
                            )}
                            {presets.map((preset) => (
                              <SelectItem
                                key={preset.id}
                                value={preset.id.toString()}
                              >
                                {preset.name}
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
                  name="payment_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("payment_desc")}{" "}
                        <span className="text-gray-400 text-sm">
                          {t("optional")}
                        </span>
                      </FormLabel>
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

                <div className="grid grid-cols-3 gap-4 items-start">
                  <FormField
                    control={form.control as any}
                    name="shipping_cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("shipping_cost")}</FormLabel>
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
                    name="commission"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("commission")}</FormLabel>
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
                    name="other_cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("other_cost")}</FormLabel>
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
                      onClick={() =>
                        append({
                          product: 0,
                          weight: "",
                          unit_price: "",
                          tax: "",
                          discount: "",
                        })
                      }
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {t("add-line")}
                    </Button>
                  </div>

                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-6 gap-4 p-4 border rounded-lg items-start"
                    >
                      <FormField
                        control={form.control as any}
                        name={`lines.${index}.product`}
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
                                          const lines = form.getValues("lines");
                                          lines[currentIndex].product =
                                            created.id;
                                          form.setValue("lines", lines);
                                        }
                                      },
                                    });
                                  } else if (value) {
                                    field.onChange(Number(value));
                                  }
                                }}
                              >
                                <SelectTrigger className="w-full overflow-hidden" dir="rtl">
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
                            <FormLabel>{t("unit_price")}</FormLabel>
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
                      <FormField
                        control={form.control as any}
                        name={`lines.${index}.discount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("discount")}</FormLabel>
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

                      <FormField
                        control={form.control as any}
                        name={`lines.${index}.tax`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("tax")}</FormLabel>
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

                      <div className="flex items-start mt-6">
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
