export function formatNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '';
  
  return numValue.toLocaleString('en-US');
}

export function formatIntegerNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  
  const numValue = typeof value === 'string' ? parseInt(value.replace(/,/g, ''), 10) : Math.floor(value);
  if (isNaN(numValue)) return '';
  
  return numValue.toLocaleString('en-US');
}

export function parseNumberFromString(value: string): number {
  if (!value) return 0;
  return parseFloat(value.replace(/,/g, ''));
}

export function parseIntegerFromString(value: string): number {
  if (!value) return 0;
  return parseInt(value.replace(/,/g, ''), 10);
}

export function formatInputNumber(value: string): string {
  // Remove all non-digit characters except commas
  const cleanValue = value.replace(/[^0-9,]/g, '');
  
  // Remove existing commas to reformat
  const numberOnly = cleanValue.replace(/,/g, '');
  
  if (!numberOnly) return '';
  
  // Parse and format with commas
  const num = parseInt(numberOnly, 10);
  if (isNaN(num)) return '';
  
  return num.toLocaleString('en-US');
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