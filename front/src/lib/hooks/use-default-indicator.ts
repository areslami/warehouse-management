import { useEffect, useState } from "react";
import type { UseFormReturn } from "react-hook-form";

import { fetchDefaultIndicator, updateIndicator } from "@/lib/api/core";
import type { IndicatorSection, Indicator } from "@/lib/interfaces/core";
import {
  DEFAULT_INDICATOR_TEMPLATE,
  renderIndicatorFormat,
  renderIndicatorFormatWithSpacing,
} from "@/lib/indicator-format";

interface UseDefaultIndicatorOptions<FormValues> {
  section: IndicatorSection;
  form: UseFormReturn<FormValues>;
  fieldName: keyof FormValues & string;
  enabled?: boolean;
  formatWithSpacing?: boolean;
}

const getCurrentPeriodKey = (frequency: "year" | "month"): string => {
  const now = new Date();
  if (frequency === "year") {
    return `${now.getUTCFullYear()}`;
  }
  return `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}`;
};

export function useDefaultIndicator<FormValues>({
  section,
  form,
  fieldName,
  enabled = true,
  formatWithSpacing = false,
}: UseDefaultIndicatorOptions<FormValues>) {
  const [currentIndicator, setCurrentIndicator] = useState<Indicator | null>(
    null
  );

  useEffect(() => {
    if (!enabled) return;

    let isMounted = true;

    const applyDefault = async () => {
      const currentValue = form.getValues(fieldName);
      if (currentValue) return;

      try {
        const indicator = await fetchDefaultIndicator(section);
        if (indicator && isMounted) {
          let indicatorToUse = indicator;

          // Auto reset counter based on configured frequency
          if (
            indicator.reset_frequency &&
            indicator.reset_frequency !== "never" &&
            typeof window !== "undefined"
          ) {
            const periodKey = getCurrentPeriodKey(indicator.reset_frequency);
            const storageKey = `indicator-reset-${indicator.id}`;
            const lastPeriod = localStorage.getItem(storageKey);
            const startNumber = indicator.start_number ?? 1;

            if (lastPeriod !== periodKey) {
              try {
                await updateIndicator(indicator.id, {
                  counter: startNumber - 1,
                });
                indicatorToUse = {
                  ...indicator,
                  counter: startNumber - 1,
                };
                localStorage.setItem(storageKey, periodKey);
              } catch (error) {
                console.error("Failed to reset indicator counter:", error);
              }
            }
          }

          const existingValue = form.getValues(fieldName);
          if (!existingValue) {
            const template = indicatorToUse.format_template || DEFAULT_INDICATOR_TEMPLATE;
            const formatFn = formatWithSpacing
              ? renderIndicatorFormatWithSpacing
              : renderIndicatorFormat;
            const nextValue = formatFn(template, {
              counter: (indicatorToUse.counter ?? 0) + 1,
            });
            form.setValue(
              fieldName as keyof FormValues,
              nextValue as FormValues[keyof FormValues],
              { shouldDirty: false, shouldTouch: false }
            );
          }
          setCurrentIndicator(indicatorToUse);
        }
      } catch (error) {
        console.error(
          `Failed to fetch default indicator for ${section}:`,
          error
        );
      }
    };

    applyDefault();

    return () => {
      isMounted = false;
    };
  }, [section, form, fieldName, enabled, formatWithSpacing]);

  return currentIndicator;
}
