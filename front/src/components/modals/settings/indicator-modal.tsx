"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
} from "../../ui/form";
import { Input } from "../../ui/input";
import { SimpleCombobox } from "../../ui/simple-combobox";
import { useTranslations } from "next-intl";
import type { IndicatorSection } from "@/lib/interfaces/core";
import { INDICATOR_SECTIONS } from "@/lib/constants/indicator-sections";
import { DEFAULT_INDICATOR_TEMPLATE } from "@/lib/indicator-format";
import { IndicatorFormatBuilder } from "./indicator-format-builder";
import { toPersianDigits } from "@/lib/utils/numbers";

export type IndicatorFormData = {
  name: string;
  belongs: IndicatorSection;
  format_template: string;
  start_number: number;
  end_number: number;
  reset_frequency: "never" | "year" | "month";
};

type IndicatorFormValues = IndicatorFormData & {
  counter_digits: number;
};

interface IndicatorModalProps {
  onSubmit?: (data: IndicatorFormData) => Promise<void> | void;
  onClose?: () => void;
  initialData?: Partial<IndicatorFormData>;
  readOnly?: boolean;
}

export function IndicatorModal({
  onSubmit,
  onClose,
  initialData,
  readOnly = false,
}: IndicatorModalProps) {
  const MAX_END_NUMBER = 9_999_999;
  const t = useTranslations("modals.indicator");
  const tVal = useTranslations("modals.indicator.validation");
  const tSidebar = useTranslations("sidebar");
  const [open, setOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const belongsOptions = useMemo(
    () =>
      INDICATOR_SECTIONS.map(({ key, translationKey }) => ({
        value: key,
        label: tSidebar(translationKey),
      })),
    [tSidebar]
  );

  const indicatorSchema = z.object({
    name: z.string().min(1, tVal("name-required")),
    belongs: z.string().min(1, tVal("belongs-required")),
    format_template: z.string().min(1, tVal("format-required")),
    counter_digits: z.number().int().min(1, tVal("counter-digits-min")).max(7, tVal("counter-digits-max")),
    start_number: z.number().int().positive().min(1),
    end_number: z
      .number()
      .int()
      .positive()
      .min(1)
      .max(MAX_END_NUMBER, tVal("end-number-max")),
    reset_frequency: z.enum(["never", "year", "month"]),
  });

  const fallbackSection =
    (INDICATOR_SECTIONS[0]?.key as IndicatorSection | undefined) ??
    "warehouse_receipt";

  const calculateDigitsFromEndNumber = (endNumber?: number): number => {
    if (!endNumber) return 3;
    const numStr = endNumber.toString();
    if (endNumber === Math.pow(10, numStr.length) - 1) {
      return numStr.length;
    }
    return Math.max(1, Math.min(7, numStr.length));
  };

  const form = useForm<IndicatorFormValues>({
    resolver: zodResolver(indicatorSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      belongs:
        (initialData?.belongs as IndicatorSection | undefined) ??
        fallbackSection,
      format_template:
        initialData?.format_template ?? DEFAULT_INDICATOR_TEMPLATE,
      counter_digits: calculateDigitsFromEndNumber(initialData?.end_number) || 3,
      start_number: initialData?.start_number ?? 1,
      end_number: Math.min(initialData?.end_number ?? 999, MAX_END_NUMBER),
      reset_frequency: initialData?.reset_frequency ?? "never",
    },
  });

  useEffect(() => {
    form.reset({
      name: initialData?.name ?? "",
      belongs:
        (initialData?.belongs as IndicatorSection | undefined) ??
        fallbackSection,
      format_template:
        initialData?.format_template ?? DEFAULT_INDICATOR_TEMPLATE,
      counter_digits: calculateDigitsFromEndNumber(initialData?.end_number) || 3,
      start_number: initialData?.start_number ?? 1,
      end_number: Math.min(initialData?.end_number ?? 999, MAX_END_NUMBER),
      reset_frequency: initialData?.reset_frequency ?? "never",
    });
  }, [initialData, form, fallbackSection, MAX_END_NUMBER]);

  // Watch counter_digits and update start/end numbers automatically
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "counter_digits" && value.counter_digits) {
        const counterDigitsDirty = form.getFieldState("counter_digits").isDirty;
        if (!counterDigitsDirty) return;
        const digits = value.counter_digits;
        const endNumber = Math.pow(10, digits) - 1;
        form.setValue("start_number", 1, { shouldValidate: true });
        form.setValue("end_number", endNumber, { shouldValidate: true });
      }
      // When end_number changes, ensure counter_digits can accommodate it
      if (name === "end_number" && value.end_number) {
        const endNum = value.end_number;
        const requiredDigits = endNum.toString().length;
        const currentDigits = value.counter_digits || 3;

        // If end_number requires more digits than currently selected, auto-update counter_digits
        if (requiredDigits > currentDigits && requiredDigits <= 7) {
          form.setValue("counter_digits", requiredDigits, { shouldValidate: true });
        }
        // If end_number is too large for max digits (7), cap it
        else if (requiredDigits > 7) {
          form.setValue("end_number", MAX_END_NUMBER, { shouldValidate: true });
          if (currentDigits < 7) {
            form.setValue("counter_digits", 7, { shouldValidate: true });
          }
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, MAX_END_NUMBER]);

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!onSubmit || readOnly) {
      onClose?.();
      return;
    }
    const resolvedBelongs =
      (values.belongs as IndicatorSection | undefined) ?? fallbackSection;
    try {
      setIsSubmitting(true);
      await onSubmit({
        name: values.name,
        belongs: resolvedBelongs as IndicatorSection,
        format_template: values.format_template,
        start_number: values.start_number,
        end_number: values.end_number,
        reset_frequency: values.reset_frequency,
      });
      setOpen(false);
      onClose?.();
    } catch (error) {
      console.error("Indicator modal submission failed:", error);
      const rawMessage =
        error instanceof Error ? error.message : String(error ?? "");
      const normalizedMessage = rawMessage.toLowerCase();
      const duplicateMatch = [
        "duplicate",
        "already exist",
        "already exists",
        "unique",
        "تکراری",
        "قبلا",
        "قبلاً",
      ].some(
        (keyword) =>
          normalizedMessage.includes(keyword) ||
          rawMessage.includes(keyword)
      );

      if (duplicateMatch) {
        form.setError("name", {
          type: "manual",
          message: tVal("name-duplicate"),
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  });

  const handleClose = () => {
    setOpen(false);
    onClose?.();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) {
          onClose?.();
        }
      }}
    >
      <DialogContent
        dir="rtl"
        className="min-w-[75%] max-h-[90vh] overflow-y-auto scrollbar-hide p-0 my-0 mx-auto [&>button]:hidden"
      >
        <DialogHeader
          dir="rtl"
          className="px-5 py-4 text-right sm:text-right items-end justify-start"
          style={{ backgroundColor: "#f6d265", textAlign: "right" }}
        >
          <DialogTitle className="text-white text-lg font-bold w-full text-right" dir="rtl">
            {t("title")}
          </DialogTitle>
          <DialogDescription className="text-white/90 text-sm w-full text-right" dir="rtl">
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-white px-8 py-6">
          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("fields.name")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t("placeholders.name")}
                          disabled={readOnly || isSubmitting}
                          onChange={(event) => {
                            form.clearErrors("name");
                            field.onChange(event);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="belongs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("fields.belongs")}</FormLabel>
                      <FormControl>
                        <SimpleCombobox
                          options={belongsOptions}
                          value={field.value || ""}
                          onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue("belongs", value as IndicatorSection, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                          }}
                          placeholder={t("placeholders.belongs")}
                          searchPlaceholder={t("placeholders.belongs")}
                          disabled={readOnly || isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="counter_digits"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("fields.counter_digits")}</FormLabel>
                      <FormControl>
                        <SimpleCombobox
                          options={[
                            { value: "1", label: toPersianDigits("1") },
                            { value: "2", label: toPersianDigits("2") },
                            { value: "3", label: toPersianDigits("3") },
                            { value: "4", label: toPersianDigits("4") },
                            { value: "5", label: toPersianDigits("5") },
                            { value: "6", label: toPersianDigits("6") },
                            { value: "7", label: toPersianDigits("7") },
                          ]}
                          value={field.value?.toString() || "3"}
                          onValueChange={(value) => {
                            const numValue = parseInt(value) || 3;
                            field.onChange(numValue);
                            form.setValue("counter_digits", numValue, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                          }}
                          placeholder={t("placeholders.counter_digits")}
                          searchPlaceholder={t("placeholders.counter_digits")}
                          disabled={readOnly || isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="reset_frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("fields.reset_frequency")}</FormLabel>
                      <FormControl>
                        <SimpleCombobox
                          options={[
                            { value: "never", label: t("reset_options.never") },
                            { value: "year", label: t("reset_options.year") },
                            { value: "month", label: t("reset_options.month") },
                          ]}
                          value={field.value || "never"}
                          onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue("reset_frequency", value as "never" | "year" | "month", {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                          }}
                          placeholder={t("placeholders.reset_frequency")}
                          searchPlaceholder={t("placeholders.reset_frequency")}
                          disabled={readOnly || isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="start_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("fields.start_number")}</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          inputMode="numeric"
                          min="1"
                          placeholder={t("placeholders.start_number")}
                          disabled={readOnly || isSubmitting}
                          value={toPersianDigits(field.value?.toString() || "")}
                          onChange={(e) => {
                            const input = e.target.value;
                            const englishDigits = input.replace(/[۰-۹]/g, (d) =>
                              String.fromCharCode(d.charCodeAt(0) - 1728)
                            );
                            const numericValue = englishDigits.replace(/\D/g, "");
                            const parsedValue = parseInt(numericValue) || 1;
                            field.onChange(parsedValue);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              <FormField
                control={form.control}
                name="end_number"
                render={({ field }) => (
                  <FormItem>
                      <FormLabel>{t("fields.end_number")}</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          inputMode="numeric"
                          min="1"
                          maxLength={7}
                          placeholder={t("placeholders.end_number")}
                          disabled={readOnly || isSubmitting}
                          value={toPersianDigits(field.value?.toString() || "")}
                          onChange={(e) => {
                            const input = e.target.value;
                            const englishDigits = input.replace(/[۰-۹]/g, (d) =>
                              String.fromCharCode(d.charCodeAt(0) - 1728)
                            );
                            const numericValue = englishDigits.replace(/\D/g, "");
                            const parsedValue = Math.min(
                              parseInt(numericValue) || 999,
                              MAX_END_NUMBER
                            );
                            field.onChange(parsedValue);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="format_template"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel >{t("fields.format_template")}</FormLabel>
                    <FormDescription>{t("format.helper")}</FormDescription>
                    <FormControl>
                      <IndicatorFormatBuilder
                        ref={field.ref}
                        value={field.value}
                        onChange={(next) => field.onChange(next)}
                        disabled={readOnly || isSubmitting}
                        endNumber={form.watch("end_number")}
                        previewCounter={form.watch("start_number")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  {t("actions.cancel")}
                </Button>
                {!readOnly && (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? t("actions.saving") : t("actions.save")}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
