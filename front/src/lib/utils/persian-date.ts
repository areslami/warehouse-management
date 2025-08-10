import moment from 'moment-jalaali';

// Configure moment-jalaali
moment.loadPersian({ dialect: 'persian-modern' });

/**
 * Convert Gregorian date to Jalali date string
 * @param gregorianDate - Date in YYYY-MM-DD format or Date object
 * @param format - Output format (default: 'jYYYY/jMM/jDD')
 * @returns Jalali date string
 */
export function toJalali(gregorianDate: string | Date, format: string = 'jYYYY/jMM/jDD'): string {
  if (!gregorianDate) return '';
  return moment(gregorianDate).format(format);
}

/**
 * Convert Jalali date to Gregorian date string
 * @param jalaliDate - Jalali date string (e.g., '1402/09/15')
 * @param inputFormat - Input format (default: 'jYYYY/jMM/jDD')
 * @param outputFormat - Output format (default: 'YYYY-MM-DD')
 * @returns Gregorian date string
 */
export function toGregorian(
  jalaliDate: string,
  inputFormat: string = 'jYYYY/jMM/jDD',
  outputFormat: string = 'YYYY-MM-DD'
): string {
  if (!jalaliDate) return '';
  return moment(jalaliDate, inputFormat).format(outputFormat);
}

/**
 * Format a Gregorian date to Persian date with Persian numerals
 * @param gregorianDate - Date in YYYY-MM-DD format or Date object
 * @returns Formatted Persian date string with Persian numerals
 */
export function formatPersianDate(gregorianDate: string | Date): string {
  if (!gregorianDate) return '';
  const persianDate = moment(gregorianDate).format('jDD jMMMM jYYYY');
  return convertToPersianNumbers(persianDate);
}

/**
 * Convert English numbers to Persian numbers
 * @param str - String containing English numbers
 * @returns String with Persian numbers
 */
export function convertToPersianNumbers(str: string): string {
  const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/[0-9]/g, (digit) => persianNumbers[parseInt(digit)]);
}

/**
 * Convert Persian numbers to English numbers
 * @param str - String containing Persian numbers
 * @returns String with English numbers
 */
export function convertToEnglishNumbers(str: string): string {
  const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  let result = str;
  persianNumbers.forEach((persian, index) => {
    const regex = new RegExp(persian, 'g');
    result = result.replace(regex, index.toString());
  });
  return result;
}

/**
 * Get today's date in Jalali format
 * @param format - Output format (default: 'jYYYY/jMM/jDD')
 * @returns Today's Jalali date
 */
export function getTodayJalali(format: string = 'jYYYY/jMM/jDD'): string {
  return moment().format(format);
}

/**
 * Get today's date in Gregorian format
 * @returns Today's date in YYYY-MM-DD format
 */
export function getTodayGregorian(): string {
  return moment().format('YYYY-MM-DD');
}

/**
 * Validate Jalali date
 * @param jalaliDate - Jalali date string
 * @param format - Expected format (default: 'jYYYY/jMM/jDD')
 * @returns true if valid, false otherwise
 */
export function isValidJalaliDate(jalaliDate: string, format: string = 'jYYYY/jMM/jDD'): boolean {
  if (!jalaliDate) return false;
  const m = moment(jalaliDate, format);
  return m.isValid() && m.format(format) === jalaliDate;
}

/**
 * Parse Jalali date components
 * @param jalaliDate - Jalali date string
 * @returns Object with year, month, day
 */
export function parseJalaliDate(jalaliDate: string): { year: number; month: number; day: number } | null {
  const cleanDate = convertToEnglishNumbers(jalaliDate);
  const parts = cleanDate.split('/');
  if (parts.length !== 3) return null;
  
  return {
    year: parseInt(parts[0]),
    month: parseInt(parts[1]),
    day: parseInt(parts[2])
  };
}

/**
 * Format datetime to Persian date and time
 * @param datetime - DateTime string or Date object
 * @returns Formatted Persian datetime
 */
export function formatPersianDateTime(datetime: string | Date): string {
  if (!datetime) return '';
  const formatted = moment(datetime).format('jYYYY/jMM/jDD - HH:mm');
  return convertToPersianNumbers(formatted);
}