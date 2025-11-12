const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

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
