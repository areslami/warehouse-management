const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toPersianDigits(value: number | string): string {
  return String(value).replace(/\d/g, (d) => FA_DIGITS[parseInt(d)]);
}

export function formatPersianNumber(value: number): string {
  return toPersianDigits(value.toLocaleString('en-US'));
}

// Abbreviate a Toman value with Persian scale suffixes
function abbreviateToman(toman: number): string {
  const abs = Math.abs(toman);
  const sign = toman < 0 ? '−' : '';
  // Format a scaled value: drop trailing decimals if whole number
  const fmt = (n: number, decimals: number) => {
    const rounded = parseFloat(n.toFixed(decimals));
    return toPersianDigits(rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(decimals).replace(/\.?0+$/, ''));
  };

  if (abs >= 1_000_000_000_000) return sign + fmt(abs / 1_000_000_000_000, 2) + ' همت';
  if (abs >= 1_000_000_000)     return sign + fmt(abs / 1_000_000_000, 2)     + ' میلیارد تومان';
  if (abs >= 1_000_000)         return sign + fmt(abs / 1_000_000, 1)         + ' میلیون تومان';
  if (abs >= 1_000)             return sign + fmt(abs / 1_000, 1)             + ' هزار تومان';
  return sign + toPersianDigits(abs) + ' تومان';
}

// Convert Rial → Toman (÷10) then format with smart abbreviation
export function formatToman(rialValue: number): string {
  const toman = rialValue / 10;
  return abbreviateToman(toman);
}

// Raw Toman value (already in Toman, no conversion)
export function formatTomanDirect(tomanValue: number): string {
  return abbreviateToman(tomanValue);
}

// Short axis label for charts
export function formatTomanAxis(rialValue: number): string {
  const toman = rialValue / 10;
  const abs = Math.abs(toman);
  const fmt = (n: number) => toPersianDigits(parseFloat(n.toFixed(1)));
  if (abs >= 1_000_000_000_000) return fmt(toman / 1_000_000_000_000) + 'همت';
  if (abs >= 1_000_000_000) return fmt(toman / 1_000_000_000) + 'م';
  if (abs >= 1_000_000) return fmt(toman / 1_000_000) + 'میل';
  if (abs >= 1_000) return fmt(toman / 1_000) + 'ه';
  return toPersianDigits(toman);
}

export function formatWeight(value: number): string {
  return `${formatPersianNumber(value)} کیلوگرم`;
}
