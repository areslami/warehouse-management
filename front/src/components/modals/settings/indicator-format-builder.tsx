"use client";

import {
  forwardRef,
  useCallback,
  useMemo,
  useState,
  type HTMLAttributes,
} from "react";
import { useTranslations } from "next-intl";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  DEFAULT_INDICATOR_TEMPLATE,
  INDICATOR_LITERAL_MAX,
  IndicatorFormatSegment,
  createCounterSegment,
  createDaySegment,
  createLiteralSegment,
  createMonthSegment,
  createYearSegment,
  parseIndicatorFormat,
  renderIndicatorFormat,
  renderIndicatorSegmentSample,
  serializeIndicatorSegments,
} from "@/lib/indicator-format";

type IndicatorFormatBuilderProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  previewCounter?: number;
} & Omit<HTMLAttributes<HTMLDivElement>, "onChange">;

type AddSegmentButtonProps = {
  position: "start" | "end";
  disabled?: boolean;
  onAdd: (segment: IndicatorFormatSegment) => void;
  sampleDate: Date;
  sampleCounter: number;
  t: ReturnType<typeof useTranslations>;
};

const sampleDateReference = new Date("2024-10-12T00:00:00Z");
const sampleCounterReference = 128;

const getSegmentLabel = (
  segment: IndicatorFormatSegment,
  t: ReturnType<typeof useTranslations>
) => {
  switch (segment.type) {
    case "counter":
      return t("chips.counter", { digits: segment.digits });
    case "jalaliYear":
      if (segment.variant === "yyyy") return t("chips.year_full");
      if (segment.variant === "yyy") return t("chips.year_three");
      return t("chips.year_two");
    case "jalaliMonth":
      if (segment.variant === "mm") return t("chips.month_number");
      if (segment.variant === "mmm") return t("chips.month_short");
      return t("chips.month_long");
    case "jalaliDay":
      return segment.variant === "dd"
        ? t("chips.day_two")
        : t("chips.day_one");
    case "literal":
      return t("chips.literal", { value: segment.value || "-" });
    default:
      return "";
  }
};

const buildTokenSections = (
  t: ReturnType<typeof useTranslations>,
  sampleCounter: number,
  sampleDate: Date
) => {
  const describe = (factory: () => IndicatorFormatSegment) =>
    renderIndicatorSegmentSample(factory(), {
      counter: sampleCounter,
      date: sampleDate,
    });

  const counterFactory = (digits: 1 | 2 | 3 | 4 | 5) => () => createCounterSegment(digits);

  const counterOptions = [1, 2, 3, 4, 5].map((digits) => ({
    key: `counter-${digits}`,
    label: t("tokens.counter", { digits }),
    description: t("tokens.counter_description", { digits }),
    sample: describe(counterFactory(digits as 1 | 2 | 3 | 4 | 5)),
    create: counterFactory(digits as 1 | 2 | 3 | 4 | 5),
  }));

  const dateOptions = [
    {
      key: "yyyy",
      label: t("tokens.year_full"),
      description: t("tokens.year_full_description"),
      create: () => createYearSegment("yyyy"),
    },
    {
      key: "yyy",
      label: t("tokens.year_three"),
      description: t("tokens.year_three_description"),
      create: () => createYearSegment("yyy"),
    },
    {
      key: "yy",
      label: t("tokens.year_two"),
      description: t("tokens.year_two_description"),
      create: () => createYearSegment("yy"),
    },
    {
      key: "mm",
      label: t("tokens.month_number"),
      description: t("tokens.month_number_description"),
      create: () => createMonthSegment("mm"),
    },
    {
      key: "mmm",
      label: t("tokens.month_short"),
      description: t("tokens.month_short_description"),
      create: () => createMonthSegment("mmm"),
    },
    {
      key: "mmmm",
      label: t("tokens.month_long"),
      description: t("tokens.month_long_description"),
      create: () => createMonthSegment("mmmm"),
    },
    {
      key: "dd",
      label: t("tokens.day_two"),
      description: t("tokens.day_two_description"),
      create: () => createDaySegment("dd"),
    },
  ].map((option) => ({
    ...option,
    sample: describe(option.create),
  }));

  return [
    {
      key: "counter",
      title: t("tokens.counter_group"),
      options: counterOptions,
    },
    {
      key: "date",
      title: t("tokens.date_group"),
      options: dateOptions,
    },
  ];
};

const AddSegmentButton = ({
  position,
  disabled,
  onAdd,
  sampleCounter,
  sampleDate,
  t,
}: AddSegmentButtonProps) => {
  const [open, setOpen] = useState(false);
  const [literalValue, setLiteralValue] = useState("");
  const sections = useMemo(
    () => buildTokenSections(t, sampleCounter, sampleDate),
    [t, sampleCounter, sampleDate]
  );

  const separatorPresets = ["/", "_", "-", "#"];

  const addSegment = (factory: () => IndicatorFormatSegment) => {
    onAdd(factory());
    setOpen(false);
  };

  const handleAddLiteral = () => {
    const text = literalValue.trim();
    if (!text) return;
    onAdd(createLiteralSegment(text));
    setLiteralValue("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={(next) => !disabled && setOpen(next)}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={disabled}
          aria-label={position === "start" ? t("add_prefix") : t("add_suffix")}
          className="h-8 w-8 rounded-full border-dashed border-gray-300 text-muted-foreground hover:text-gray-900"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="border-b px-4 py-3">
          <p className="text-sm font-semibold text-foreground">
            {t("tokens.title")}
          </p>
          <p className="text-xs text-muted-foreground">
            {position === "start" ? t("add_prefix") : t("add_suffix")}
          </p>
        </div>
        <div className="max-h-80 overflow-y-auto px-3 py-2 space-y-4">
          {sections.map((section) => (
            <div key={section.key} className="space-y-1">
              <p className="text-[11px] font-semibold text-muted-foreground px-1">
                {section.title}
              </p>
              {section.options.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className="w-full rounded-md border border-transparent px-3 py-2 text-right text-sm hover:border-gray-200 hover:bg-gray-50 transition-colors"
                  onClick={() => addSegment(option.create)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-foreground">{option.label}</p>
                      {option.description && (
                        <p className="text-[11px] text-muted-foreground">
                          {option.description.toUpperCase()}
                        </p>
                      )}
                    </div>
                    <span className="font-mono text-xs text-muted-foreground" dir="ltr">
                      {option.sample}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ))}
          <div className="space-y-2 border-t border-dashed pt-2">
            <p className="text-[11px] font-semibold text-muted-foreground px-1">
              {t("tokens.literal_label")}
            </p>
            <div className="flex items-center gap-2">
              <Input
                value={literalValue}
                onChange={(event) => setLiteralValue(event.target.value)}
                maxLength={INDICATOR_LITERAL_MAX}
                placeholder={t("literal_input.placeholder")}
                className="h-8"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddLiteral}
                disabled={!literalValue.trim()}
              >
                {t("tokens.literal_add")}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground px-1">
              {t("literal_input.limit", { count: INDICATOR_LITERAL_MAX })}
            </p>
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-muted-foreground px-1">
                {t("tokens.separator_label")}
              </p>
              <div className="flex flex-wrap gap-1">
                {separatorPresets.map((symbol) => (
                  <Button
                    key={symbol}
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2"
                    onClick={() => addSegment(() => createLiteralSegment(symbol))}
                  >
                    {symbol}
                  </Button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground px-1">
                {t("tokens.separator_hint")}
              </p>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export const IndicatorFormatBuilder = forwardRef<
  HTMLDivElement,
  IndicatorFormatBuilderProps
>(({ value, onChange, disabled = false, previewCounter, className, ...rest }, ref) => {
  const formatT = useTranslations("modals.indicator.format");
  const safeValue = value ?? "";
  const segments = useMemo(() => parseIndicatorFormat(safeValue), [safeValue]);
  const preview = useMemo(
    () =>
      renderIndicatorFormat(safeValue || DEFAULT_INDICATOR_TEMPLATE, {
        counter: previewCounter ?? 1,
        date: sampleDateReference,
      }),
    [safeValue, previewCounter]
  );

  const updateSegments = useCallback(
    (next: IndicatorFormatSegment[]) => {
      onChange(serializeIndicatorSegments(next));
    },
    [onChange]
  );

  const handleAdd = (segment: IndicatorFormatSegment, position: "start" | "end") => {
    const nextSegments =
      position === "start" ? [segment, ...segments] : [...segments, segment];
    updateSegments(nextSegments);
  };

  const handleRemove = (segmentId: string) => {
    updateSegments(segments.filter((segment) => segment.id !== segmentId));
  };

  return (
    <div
      ref={ref}
      {...rest}
      className={cn(
        "rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <div className="flex-shrink-0">
          <AddSegmentButton
            position="start"
            disabled={disabled}
            onAdd={(segment) => handleAdd(segment, "start")}
            sampleCounter={sampleCounterReference}
            sampleDate={sampleDateReference}
            t={formatT}
          />
        </div>
        <div className="flex-1">
          <div className="flex min-h-[42px] flex-wrap items-center justify-center gap-2">
            {segments.length === 0 ? (
              <span className="text-xs text-muted-foreground">
                {formatT("empty")}
              </span>
            ) : (
              segments.map((segment) => (
                <div
                  key={segment.id}
                  className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs shadow-sm"
                >
                  <div className="flex flex-col text-right leading-tight">
                    <span className="font-semibold text-gray-800">
                      {getSegmentLabel(segment, formatT)}
                    </span>
                    <span className="font-mono text-[10px] uppercase text-gray-500" dir="ltr">
                      {renderIndicatorSegmentSample(segment, {
                        counter: previewCounter ?? sampleCounterReference,
                        date: sampleDateReference,
                      })}
                    </span>
                  </div>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => handleRemove(segment.id)}
                      className="rounded-full border border-transparent p-1 text-gray-400 hover:text-red-500 hover:border-red-100"
                      aria-label={formatT("remove_segment")}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
        <div className="flex-shrink-0">
          <AddSegmentButton
            position="end"
            disabled={disabled}
            onAdd={(segment) => handleAdd(segment, "end")}
            sampleCounter={sampleCounterReference}
            sampleDate={sampleDateReference}
            t={formatT}
          />
        </div>
      </div>
      <div className="mt-3 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">
          {formatT("preview_label")}:
        </span>{" "}
        <span className="font-mono text-sm" dir="ltr">
          {preview}
        </span>
      </div>
    </div>
  );
});

IndicatorFormatBuilder.displayName = "IndicatorFormatBuilder";
