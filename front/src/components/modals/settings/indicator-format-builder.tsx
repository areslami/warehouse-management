"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type HTMLAttributes,
} from "react";
import { useTranslations } from "next-intl";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  renderIndicatorSegmentSample,
  serializeIndicatorSegments,
} from "@/lib/indicator-format";
import { toPersianDigits } from "@/lib/utils/numbers";

type IndicatorFormatBuilderProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  previewCounter?: number;
  endNumber?: number;
} & Omit<HTMLAttributes<HTMLDivElement>, "onChange">;

type AddSegmentButtonProps = {
  position: "start" | "end";
  disabled?: boolean;
  onAdd: (segment: IndicatorFormatSegment) => void;
  sampleDate: Date;
  sampleCounter: number;
  endNumber?: number;
  t: ReturnType<typeof useTranslations>;
};

const sampleDateReference = new Date("2024-10-12T00:00:00Z");
const sampleCounterReference = 128;
const formatCounterSample = (
  segment: IndicatorFormatSegment,
  sample: string
) => {
  if (segment.type === "counter" && segment.digits <= 2) {
    return sample.slice(-1 * segment.digits);
  }
  return sample;
};
const SEPARATOR_SYMBOLS = ["/", "_", "-", "#"] as const;
type SeparatorSymbol = (typeof SEPARATOR_SYMBOLS)[number];

const isSeparatorChar = (value?: string): value is SeparatorSymbol =>
  typeof value === "string" &&
  value.length === 1 &&
  SEPARATOR_SYMBOLS.includes(value as SeparatorSymbol);

const splitLiteralSeparators = (segments: IndicatorFormatSegment[]) => {
  return segments.flatMap((segment) => {
    if (segment.type !== "literal" || !segment.value) {
      return [segment];
    }

    let hasSeparator = false;
    let buffer = "";
    const parts: IndicatorFormatSegment[] = [];
    const flushBuffer = () => {
      if (!buffer) return;
      parts.push(createLiteralSegment(buffer));
      buffer = "";
    };

    for (const char of segment.value) {
      if (isSeparatorChar(char)) {
        hasSeparator = true;
        flushBuffer();
        parts.push(createLiteralSegment(char));
      } else {
        buffer += char;
      }
    }

    flushBuffer();

    return hasSeparator ? parts : [segment];
  });
};

const getSegmentLabel = (
  segment: IndicatorFormatSegment,
  t: ReturnType<typeof useTranslations>
) => {
  switch (segment.type) {
    case "counter":
      return t("chips.counter");
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
      if (isSeparatorChar(segment.value)) {
        return t("chips.separator", { value: segment.value });
      }
      // Check if the literal is a number
      if (segment.value && /^\d+$/.test(segment.value)) {
        return t("chips.number", { value: toPersianDigits(segment.value) });
      }
      return t("chips.literal", { value: segment.value || "-" });
    default:
      return "";
  }
};

const calculateDigits = (
  endNumber?: number,
  fallback: 1 | 2 | 3 | 4 | 5 | 6 | 7 = 3
): 1 | 2 | 3 | 4 | 5 | 6 | 7 => {
  if (!endNumber || endNumber < 1) return fallback;
  const digits = endNumber.toString().length;
  return Math.min(7, Math.max(1, digits)) as 1 | 2 | 3 | 4 | 5 | 6 | 7;
};

const buildTokenSections = (
  t: ReturnType<typeof useTranslations>,
  sampleCounter: number,
  sampleDate: Date,
  endNumber?: number
) => {
  const describe = (factory: () => IndicatorFormatSegment) => {
    const segment = factory();
    const sample = renderIndicatorSegmentSample(segment, {
      counter: sampleCounter,
      date: sampleDate,
    });
    return formatCounterSample(segment, sample);
  };

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
  endNumber,
  t,
}: AddSegmentButtonProps) => {
  const [open, setOpen] = useState(false);
  const [literalValue, setLiteralValue] = useState("");
  const sections = useMemo(
    () => buildTokenSections(t, sampleCounter, sampleDate, endNumber),
    [t, sampleCounter, sampleDate, endNumber]
  );

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
    <Popover
      open={open}
      onOpenChange={(next) => !disabled && setOpen(next)}
      modal={true}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={disabled}
          aria-label={position === "start" ? t("add_prefix") : t("add_suffix")}
          className="h-9 w-9 rounded-full border border-[#f6d265] text-[#f6d265] bg-white hover:bg-[#f6d265]/10 focus-visible:ring-[#f6d265] shadow-sm"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="pointer-events-auto z-[9999] grid w-80 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-md border bg-popover p-0 shadow-md"
        align="start"
        side="bottom"
        sideOffset={6}
        collisionPadding={{ top: 16, bottom: 16 }}
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <div className="border-b px-4 py-3">
          <p className="text-sm font-semibold text-foreground">
            {t("tokens.title")}
          </p>
          <p className="text-xs text-muted-foreground">
            {position === "start" ? t("add_prefix") : t("add_suffix")}
          </p>
        </div>
        <ScrollArea className="max-h-80">
          <div
            className="space-y-4 px-3 py-2"
            dir="rtl"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {sections.map((section) => (
              <div
                key={section.key}
                className={cn(
                  "space-y-1",
                  section.dividerAbove && "border-t border-dashed pt-3"
                )}
              >
                <p className="text-[11px] font-semibold text-muted-foreground px-1">
                  {section.title}
                </p>
                {section.options.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    className="w-full rounded-md border border-transparent px-3 py-2 text-right text-sm transition-colors hover:border-gray-200 hover:bg-gray-50"
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
            </div>
            <div className="space-y-2 border-t border-dashed pt-2">
              <p className="text-[11px] font-semibold text-muted-foreground px-1">
                {t("tokens.separator_label")}
              </p>
              <div className="flex flex-wrap gap-2">
                {SEPARATOR_SYMBOLS.map((symbol) => (
                  <Button
                    key={symbol}
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-10 min-w-[48px] rounded-lg border border-gray-200 bg-white text-base font-semibold shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
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
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export const IndicatorFormatBuilder = forwardRef<
  HTMLDivElement,
  IndicatorFormatBuilderProps
>(({ value, onChange, disabled = false, previewCounter, endNumber, className, ...rest }, ref) => {
  const formatT = useTranslations("modals.indicator.format");
  const safeValue = value ?? "";
  const segments = useMemo(
    () => splitLiteralSeparators(parseIndicatorFormat(safeValue)),
    [safeValue]
  );
  const defaultSegments = useMemo(
    () => splitLiteralSeparators(parseIndicatorFormat(DEFAULT_INDICATOR_TEMPLATE)),
    []
  );
  const previewSegments = segments.length ? segments : defaultSegments;
  const previewPieces = useMemo(
    () =>
      previewSegments.map((segment) => ({
        id: segment.id,
        value: renderIndicatorSegmentSample(segment, {
          counter: previewCounter ?? 1,
          date: sampleDateReference,
        }),
      })),
    [previewSegments, previewCounter]
  );

  const currentCounterDigits = useMemo(
    () => segments.find((segment) => segment.type === "counter")?.digits,
    [segments]
  );

  const resolvedCounterDigits = useMemo(
    () =>
      calculateDigits(
        endNumber,
        (currentCounterDigits ?? 3) as 1 | 2 | 3 | 4 | 5 | 6 | 7
      ),
    [endNumber, currentCounterDigits]
  );

  const updateSegments = useCallback(
    (next: IndicatorFormatSegment[]) => {
      onChange(serializeIndicatorSegments(next));
    },
    [onChange]
  );

  useEffect(() => {
    const needsUpdate = segments.some(
      (segment) =>
        segment.type === "counter" && segment.digits !== resolvedCounterDigits
    );
    if (!needsUpdate) return;

    const normalizedSegments = segments.map((segment) =>
      segment.type === "counter"
        ? { ...segment, digits: resolvedCounterDigits }
        : segment
    );
    updateSegments(normalizedSegments);
  }, [segments, resolvedCounterDigits, updateSegments]);

  const handleAdd = (segment: IndicatorFormatSegment, position: "start" | "end") => {
    const nextSegments =
      position === "start" ? [segment, ...segments] : [...segments, segment];
    updateSegments(nextSegments);
  };

  const handleRemove = (segmentId: string) => {
    const segmentToRemove = segments.find((s) => s.id === segmentId);
    if (!segmentToRemove) return;

    // Never allow removing counter segments
    if (segmentToRemove.type === "counter") return;

    if (segments.length <= 1) return;
    updateSegments(segments.filter((segment) => segment.id !== segmentId));
  };

  const canRemoveSegment = (segment: IndicatorFormatSegment) => {
    // Counter segments can never be removed
    if (segment.type === "counter") return false;
    // Can only remove if there's more than one segment
    return segments.length > 1;
  };

  return (
    <div className="space-y-4" ref={ref} {...rest}>
      <div
        className={cn(
          "rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3",
          className
        )}
      >
        <div
          className="flex flex-wrap items-center justify-center gap-3"
          dir="rtl"
        >
          <AddSegmentButton
            position="start"
            disabled={disabled}
            onAdd={(segment) => handleAdd(segment, "start")}
            sampleCounter={sampleCounterReference}
            sampleDate={sampleDateReference}
            endNumber={endNumber}
            t={formatT}
          />
          <div className="flex min-h-[42px] flex-wrap items-center justify-center gap-2">
            {segments.length === 0 ? (
              <span className="text-xs text-muted-foreground">
                {formatT("empty")}
              </span>
            ) : (
              segments.map((segment) => (
                <div
                  key={segment.id}
                  className={cn(
                    "flex items-center gap-2 rounded-full border border-gray-200 bg-white shadow-sm h-9",
                    segment.type === "counter"
                      ? "px-6 text-xs"
                      : "px-3 text-xs"
                  )}
                >
                  <div className="flex flex-col text-right leading-tight" dir="rtl">
                    <span className="font-semibold text-gray-800">
                      {getSegmentLabel(segment, formatT)}
                    </span>
                  </div>
                  {canRemoveSegment(segment) && !disabled && (
                    <button
                      type="button"
                      onClick={() => handleRemove(segment.id)}
                      className="rounded-full border border-transparent p-1 text-gray-400 hover:text-red-500 hover:border-red-100 text-right"
                      aria-label={formatT("remove_segment")}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
          <AddSegmentButton
            position="end"
            disabled={disabled}
            onAdd={(segment) => handleAdd(segment, "end")}
            sampleCounter={sampleCounterReference}
            sampleDate={sampleDateReference}
            endNumber={endNumber}
            t={formatT}
          />
        </div>
      </div>

      <div
        className="mx-auto w-full max-w-xs rounded-2xl border border-white/70 bg-gradient-to-br from-[#fff7e6] via-[#fff3c4] to-[#f7faa2] px-4 py-3 text-center shadow-md ring-1 ring-[#f6d265]/40"
        dir="rtl"
      >
        <div className="flex flex-row flex-wrap justify-center font-mono text-lg font-bold leading-tight text-gray-800 tracking-wide">
          {previewPieces.map(({ id, value }, index) => (
            <bdi
              key={id ?? `preview-${index}`}
              dir="auto"
              className="leading-none"
            >
              {toPersianDigits(value)}
            </bdi>
          ))}
        </div>
      </div>
    </div>
  );
});

IndicatorFormatBuilder.displayName = "IndicatorFormatBuilder";
