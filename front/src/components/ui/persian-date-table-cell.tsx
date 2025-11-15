import { toJalali, formatPersianDate, convertToPersianNumbers } from '@/lib/utils/persian-date';

interface PersianDateTableCellProps {
  date?: string | Date | null;
  format?: 'short' | 'long' | 'full';
  className?: string;
}

export function PersianDateTableCell({ 
  date, 
  format = 'short',
  className = '' 
}: PersianDateTableCellProps) {
  if (!date) return <span className={className}>-</span>;
  
  let formattedDate: string;
  
  switch (format) {
    case 'full':
      formattedDate = formatPersianDate(date); // With Persian numerals
      break;
    case 'long':
      formattedDate = convertToPersianNumbers(toJalali(date, 'jDD jMMMM jYYYY'));
      break;
    case 'short':
    default:
      formattedDate = convertToPersianNumbers(toJalali(date, 'jYYYY/jMM/jDD'));
      break;
  }
  
  return <span className={className} dir="ltr">{formattedDate}</span>;
}