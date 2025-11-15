/**
 * Converts English numbers (0-9) to Persian numbers (۰-۹)
 */
export function convertEnglishToPersianNumbers(input: string): string {
  if (!input) return input;

  const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

  let result = input;
  for (let i = 0; i < englishNumbers.length; i++) {
    result = result.replace(new RegExp(englishNumbers[i], 'g'), persianNumbers[i]);
  }

  return result;
}

export function formatNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';

  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '';

  const formatted = numValue.toLocaleString('en-US');
  return convertEnglishToPersianNumbers(formatted);
}

export function formatIntegerNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';

  const numValue = typeof value === 'string' ? parseInt(value.replace(/,/g, ''), 10) : Math.floor(value);
  if (isNaN(numValue)) return '';

  const formatted = numValue.toLocaleString('en-US');
  return convertEnglishToPersianNumbers(formatted);
}

export function parseNumberFromString(value: string): number {
  if (!value) return 0;
  // Convert Persian numerals to English first, then remove commas
  const englishValue = convertPersianToEnglishNumbers(value);
  return parseFloat(englishValue.replace(/,/g, ''));
}

export function parseIntegerFromString(value: string): number {
  if (!value) return 0;
  // Convert Persian numerals to English first, then remove commas
  const englishValue = convertPersianToEnglishNumbers(value);
  return parseInt(englishValue.replace(/,/g, ''), 10);
}

export function formatInputNumber(value: string): string {
  // First convert Persian numerals to English
  const englishValue = convertPersianToEnglishNumbers(value);

  // Remove all non-digit characters except commas
  const cleanValue = englishValue.replace(/[^0-9,]/g, '');

  // Remove existing commas to reformat
  const numberOnly = cleanValue.replace(/,/g, '');

  if (!numberOnly) return '';

  // Parse and format with commas
  const num = parseInt(numberOnly, 10);
  if (isNaN(num)) return '';

  const formatted = num.toLocaleString('en-US');
  return convertEnglishToPersianNumbers(formatted);
}

export function convertPersianToEnglishNumbers(input: string): string {
  if (!input) return input;
  
  const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  
  let result = input;
  for (let i = 0; i < persianNumbers.length; i++) {
    result = result.replace(new RegExp(persianNumbers[i], 'g'), englishNumbers[i]);
  }
  
  return result;
}