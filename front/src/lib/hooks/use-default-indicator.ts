import { useEffect, useState } from "react";
import type { UseFormReturn } from "react-hook-form";

import { fetchDefaultIndicator } from "@/lib/api/core";
import type { IndicatorSection, Indicator } from "@/lib/interfaces/core";

interface UseDefaultIndicatorOptions<FormValues> {
  section: IndicatorSection;
  form: UseFormReturn<FormValues>;
  fieldName: keyof FormValues & string;
  enabled?: boolean;
}

export function useDefaultIndicator<FormValues>({
  section,
  form,
  fieldName,
  enabled = true,
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
          const existingValue = form.getValues(fieldName);
          if (!existingValue) {
            const nextValue = `${indicator.name}${indicator.counter + 1}`;
            form.setValue(
              fieldName as keyof FormValues,
              nextValue as FormValues[keyof FormValues],
              { shouldDirty: false, shouldTouch: false }
            );
          }
          setCurrentIndicator(indicator);
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
  }, [section, form, fieldName, enabled]);

  return currentIndicator;
}
