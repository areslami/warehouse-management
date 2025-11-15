import moment from "moment-jalaali";
import { toPersianDigits } from "@/lib/utils/numbers";

moment.loadPersian({ usePersianDigits: false, dialect: "persian-modern" });

export const DEFAULT_INDICATOR_TEMPLATE = "{{COUNTER3}}";

export type IndicatorFormatSegment =
  | { id: string; type: "literal"; value: string }
  | { id: string; type: "counter"; digits: 1 | 2 | 3 | 4 | 5 }
  | {
      id: string;
      type: "jalaliYear";
      variant: "yyyy" | "yyy" | "yy";
    }
  | {
      id: string;
      type: "jalaliMonth";
      variant: "mm" | "mmm" | "mmmm";
    }
  | { id: string; type: "jalaliDay"; variant: "dd" | "d" };

type SegmentWithoutId = IndicatorFormatSegment & { id?: string };

const createSegmentId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `seg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

const TOKEN_REGEX = /\{\{([A-Z0-9_]+)\}\}/g;

const CODE_TO_SEGMENT: Record<string, SegmentWithoutId> = {
  COUNTER: { type: "counter", digits: 1 },
  COUNTER2: { type: "counter", digits: 2 },
  COUNTER3: { type: "counter", digits: 3 },
  COUNTER4: { type: "counter", digits: 4 },
  COUNTER5: { type: "counter", digits: 5 },

  JYEAR4: { type: "jalaliYear", variant: "yyyy" },
  JYEAR3: { type: "jalaliYear", variant: "yyy" },
  JYEAR2: { type: "jalaliYear", variant: "yy" },

  JMONTH2: { type: "jalaliMonth", variant: "mm" },
  JMONTH_SHORT: { type: "jalaliMonth", variant: "mmm" },
  JMONTH_LONG: { type: "jalaliMonth", variant: "mmmm" },

  JDAY2: { type: "jalaliDay", variant: "dd" },
  JDAY1: { type: "jalaliDay", variant: "d" },
};

const COUNTER_CODE_BY_DIGITS: Record<number, string> = {
  1: "COUNTER",
  2: "COUNTER2",
  3: "COUNTER3",
  4: "COUNTER4",
  5: "COUNTER5",
};

const YEAR_CODE_BY_VARIANT: Record<"yyyy" | "yyy" | "yy", string> = {
  yyyy: "JYEAR4",
  yyy: "JYEAR3",
  yy: "JYEAR2",
};

const MONTH_CODE_BY_VARIANT: Record<"mm" | "mmm" | "mmmm", string> = {
  mm: "JMONTH2",
  mmm: "JMONTH_SHORT",
  mmmm: "JMONTH_LONG",
};

const DAY_CODE_BY_VARIANT: Record<"dd" | "d", string> = {
  dd: "JDAY2",
  d: "JDAY1",
};

const mergeLiteralSegments = (segments: IndicatorFormatSegment[]) => {
  return segments.reduce<IndicatorFormatSegment[]>((acc, segment) => {
    const prev = acc[acc.length - 1];
    if (segment.type === "literal" && prev?.type === "literal") {
      prev.value += segment.value;
      return acc;
    }
    acc.push(segment);
    return acc;
  }, []);
};

const createSegmentFromCode = (code: string): IndicatorFormatSegment | null => {
  const definition = CODE_TO_SEGMENT[code];
  if (!definition) return null;
  return { ...definition, id: createSegmentId() } as IndicatorFormatSegment;
};

export const parseIndicatorFormat = (template?: string): IndicatorFormatSegment[] => {
  if (!template) return [];
  const segments: IndicatorFormatSegment[] = [];
  let cursor = 0;

  template.replace(TOKEN_REGEX, (match, code, offset) => {
    if (offset > cursor) {
      segments.push({
        id: createSegmentId(),
        type: "literal",
        value: template.slice(cursor, offset),
      });
    }
    const parsed = createSegmentFromCode(code);
    if (parsed) {
      segments.push(parsed);
    } else {
      segments.push({
        id: createSegmentId(),
        type: "literal",
        value: match,
      });
    }
    cursor = offset + match.length;
    return "";
  });

  if (cursor < template.length) {
    segments.push({
      id: createSegmentId(),
      type: "literal",
      value: template.slice(cursor),
    });
  }

  return mergeLiteralSegments(segments);
};

const segmentToCode = (segment: IndicatorFormatSegment): string | null => {
  switch (segment.type) {
    case "literal":
      return null;
    case "counter":
      return COUNTER_CODE_BY_DIGITS[segment.digits] ?? COUNTER_CODE_BY_DIGITS[3];
    case "jalaliYear":
      return YEAR_CODE_BY_VARIANT[segment.variant];
    case "jalaliMonth":
      return MONTH_CODE_BY_VARIANT[segment.variant];
    case "jalaliDay":
      return DAY_CODE_BY_VARIANT[segment.variant];
    default:
      return null;
  }
};

export const serializeIndicatorSegments = (segments: IndicatorFormatSegment[]): string => {
  if (!segments.length) return "";
  return mergeLiteralSegments(segments)
    .map((segment) => {
      if (segment.type === "literal") {
        return segment.value;
      }
      const code = segmentToCode(segment);
      return code ? `{{${code}}}` : "";
    })
    .join("");
};

const jalaliMonths = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

const padNumber = (value: number, length: number) => value.toString().padStart(length, "0");

const getJalaliContext = (dateInput?: Date) => {
  const instance = dateInput ? moment(dateInput) : moment();
  const year = instance.jYear();
  const monthIndex = instance.jMonth();
  const day = instance.jDate();
  const yearStr = year.toString();

  return {
    year4: padNumber(year, 4),
    year3: yearStr.slice(-3).padStart(3, "0"),
    year2: yearStr.slice(-2).padStart(2, "0"),
    monthNumber: padNumber(monthIndex + 1, 2),
    monthShort: jalaliMonths[monthIndex]?.slice(0, 2) ?? "",
    monthLong: jalaliMonths[monthIndex] ?? "",
    day2: padNumber(day, 2),
    day1: day.toString(),
  };
};

const renderSegment = (
  segment: IndicatorFormatSegment,
  options?: { counter?: number; date?: Date }
): string => {
  if (segment.type === "literal") {
    return segment.value;
  }

  const counterValue = Math.max(1, options?.counter ?? 1);
  const jalali = getJalaliContext(options?.date);

  switch (segment.type) {
    case "counter":
      return padNumber(counterValue, segment.digits);
    case "jalaliYear":
      if (segment.variant === "yyyy") return jalali.year4;
      if (segment.variant === "yyy") return jalali.year3;
      return jalali.year2;
    case "jalaliMonth":
      if (segment.variant === "mm") return jalali.monthNumber;
      if (segment.variant === "mmm") return jalali.monthShort;
      return jalali.monthLong;
    case "jalaliDay":
      return segment.variant === "dd" ? jalali.day2 : jalali.day1;
    default:
      return "";
  }
};

export const renderIndicatorFormatParts = (
  template?: string,
  options?: { counter?: number; date?: Date }
) => {
  const segments = template ? parseIndicatorFormat(template) : [];
  const counterValue = Math.max(1, options?.counter ?? 1);

  if (!segments.length) {
    return [counterValue.toString()];
  }

  return segments.map((segment) =>
    renderSegment(segment, {
      counter: counterValue,
      date: options?.date,
    })
  );
};

export const renderIndicatorFormat = (
  template: string,
  options?: { counter?: number; date?: Date }
) => renderIndicatorFormatParts(template, options).join("");

export const renderIndicatorFormatWithSpacing = (
  template: string,
  options?: { counter?: number; date?: Date }
) =>
  renderIndicatorFormatParts(template, options)
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .join(" ");

export const INDICATOR_LITERAL_MAX = 16;

export const createLiteralSegment = (value = "-"): IndicatorFormatSegment => ({
  id: createSegmentId(),
  type: "literal",
  value,
});

export const createCounterSegment = (digits: 1 | 2 | 3 | 4 | 5 = 3): IndicatorFormatSegment => ({
  id: createSegmentId(),
  type: "counter",
  digits,
});

export const createYearSegment = (
  variant: "yyyy" | "yyy" | "yy" = "yyyy"
): IndicatorFormatSegment => ({
  id: createSegmentId(),
  type: "jalaliYear",
  variant,
});

export const createMonthSegment = (
  variant: "mm" | "mmm" | "mmmm" = "mm"
): IndicatorFormatSegment => ({
  id: createSegmentId(),
  type: "jalaliMonth",
  variant,
});

export const createDaySegment = (variant: "dd" | "d" = "dd"): IndicatorFormatSegment => ({
  id: createSegmentId(),
  type: "jalaliDay",
  variant,
});

export const renderIndicatorSegmentSample = (
  segment: IndicatorFormatSegment,
  options?: { counter?: number; date?: Date }
) => renderSegment(segment, options);

export type IndicatorPreview = {
  parts: string[];
  text: string;
};

export const buildIndicatorPreview = (
  template?: string,
  options?: { counter?: number; date?: Date }
): IndicatorPreview => {
  const safeTemplate = template || DEFAULT_INDICATOR_TEMPLATE;
  const segments = parseIndicatorFormat(safeTemplate);
  const counterValue = Math.max(1, options?.counter ?? 1);

  if (!segments.length) {
    const fallback = toPersianDigits(counterValue);
    return { text: fallback, parts: [fallback] };
  }

  const parts = segments.map((segment) =>
    toPersianDigits(
      renderIndicatorSegmentSample(segment, {
        counter: counterValue,
        date: options?.date,
      })
    )
  );

  return {
    text: parts.join(""),
    parts,
  };
};

const reverseAdjacentNumbers = (input: string): string => {
  return input.replace(/((?:\d+\s+){1,}\d+)/g, (match) => {
    const parts = match.trim().split(/\s+/);
    return parts.reverse().join("");
  });
};

export const compactIndicatorValue = (value?: string | null) => {
  if (!value) return "";
  const reordered = reverseAdjacentNumbers(value);
  return reordered.replace(/ /g, "");
};
