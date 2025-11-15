const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
const easternDigitMap: Record<string, string> = {
  "۰": "0",
  "۱": "1",
  "۲": "2",
  "۳": "3",
  "۴": "4",
  "۵": "5",
  "۶": "6",
  "۷": "7",
  "۸": "8",
  "۹": "9",
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
};

export const toPersianDigits = (
  input: string | number | null | undefined
): string => {
  if (input === null || input === undefined) {
    return "";
  }
  return String(input).replace(/\d/g, (digit) => {
    const index = Number(digit);
    return Number.isNaN(index) ? digit : persianDigits[index] ?? digit;
  });
};

export const toEnglishDigits = (
  input: string | number | null | undefined
): string => {
  if (input === null || input === undefined) {
    return "";
  }

  return String(input).replace(/[۰-۹٠-٩]/g, (digit) => easternDigitMap[digit] ?? digit);
};
