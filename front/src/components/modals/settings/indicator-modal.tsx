"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
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
  FormMessage,
} from "../../ui/form";
import { Input } from "../../ui/input";
import { SimpleCombobox } from "../../ui/simple-combobox";
import { useTranslations } from "next-intl";
import type { IndicatorSection } from "@/lib/interfaces/core";
import { INDICATOR_SECTIONS } from "@/lib/constants/indicator-sections";

export type IndicatorFormData = {
  name: string;
  belongs: IndicatorSection;
};

type IndicatorFormValues = {
  name: string;
  belongs: IndicatorSection;
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
});

  const fallbackSection =
    (INDICATOR_SECTIONS[0]?.key as IndicatorSection | undefined) ??
    "warehouse_receipt";

  const form = useForm<IndicatorFormValues>({
    resolver: zodResolver(indicatorSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      belongs:
        (initialData?.belongs as IndicatorSection | undefined) ??
        fallbackSection,
    },
  });

  useEffect(() => {
    form.reset({
      name: initialData?.name ?? "",
      belongs:
        (initialData?.belongs as IndicatorSection | undefined) ??
        fallbackSection,
    });
  }, [initialData, form, fallbackSection]);

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
      });
      setOpen(false);
      onClose?.();
    } catch (error) {
      console.error("Indicator modal submission failed:", error);
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground mb-4">{t("description")}</p>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="flex justify-end gap-2 pt-2">
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
      </DialogContent>
    </Dialog>
  );
}
