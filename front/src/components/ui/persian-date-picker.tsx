"use client";

import React, { useState, useEffect } from 'react';
import DatePicker from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import DateObject from 'react-date-object';
import { toGregorian, toJalali, convertToEnglishNumbers, convertToPersianNumbers } from '@/lib/utils/persian-date';
import { Input } from './input';
import { Calendar } from 'lucide-react';

interface PersianDatePickerProps {
  value?: string; // Gregorian date in YYYY-MM-DD format
  onChange?: (date: string) => void; // Returns Gregorian date in YYYY-MM-DD format
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
}

export function PersianDatePicker({
  value,
  onChange,
  placeholder = 'انتخاب تاریخ',
  disabled = false,
  className = '',
  id,
  name
}: PersianDatePickerProps) {
  const [displayValue, setDisplayValue] = useState<string>('');
  const [dateObject, setDateObject] = useState<any>(null);

  // Convert incoming Gregorian date to Jalali for display
  useEffect(() => {
    if (value) {
      const jalaliDate = toJalali(value, 'jYYYY/jMM/jDD');
      const persianDisplay = convertToPersianNumbers(jalaliDate);
      setDisplayValue(persianDisplay);
      
      // Create DateObject for the picker from Gregorian date
      const parts = value.split('-');
      if (parts.length === 3) {
        // Create a Gregorian date object first
        const gregorianDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        // Then convert to Persian calendar
        const date = new DateObject(gregorianDate).convert(persian, persian_fa);
        setDateObject(date);
      }
    } else {
      setDisplayValue('');
      setDateObject(null);
    }
  }, [value]);

  const handleChange = (dateValue: any) => {
    if (dateValue) {
      setDateObject(dateValue);
      
      // Get the formatted date
      const jalaliFormatted = dateValue.format('YYYY/MM/DD');
      const persianDisplay = convertToPersianNumbers(jalaliFormatted);
      setDisplayValue(persianDisplay);
      
      // Convert to Gregorian date object
      const gregorianDate = dateValue.toDate();
      
      // Format as YYYY-MM-DD
      const year = gregorianDate.getFullYear();
      const month = String(gregorianDate.getMonth() + 1).padStart(2, '0');
      const day = String(gregorianDate.getDate()).padStart(2, '0');
      const formattedGregorian = `${year}-${month}-${day}`;
      
      onChange?.(formattedGregorian);
    } else {
      setDisplayValue('');
      setDateObject(null);
      onChange?.('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setDisplayValue(input);
    
    // Try to parse and validate the input
    const englishNumbers = convertToEnglishNumbers(input);
    const parts = englishNumbers.split('/');
    
    if (parts.length === 3) {
      const [year, month, day] = parts.map(p => parseInt(p));
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        try {
          const gregorianDate = toGregorian(englishNumbers, 'YYYY/MM/DD', 'YYYY-MM-DD');
          onChange?.(gregorianDate);
        } catch (error) {
          // Invalid date, wait for valid input
        }
      }
    }
  };

  return (
    <div className="relative">
      <DatePicker
        value={dateObject}
        onChange={handleChange}
        calendar={persian}
        locale={persian_fa}
        disabled={disabled}
        format="YYYY/MM/DD"
        containerClassName="w-full"
        render={(value, openCalendar) => (
          <div className="relative">
            <Input
              id={id}
              name={name}
              value={displayValue}
              onChange={handleInputChange}
              onClick={openCalendar}
              placeholder={placeholder}
              disabled={disabled}
              className={`pl-10 ${className}`}
              dir="ltr"
            />
            <Calendar 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" 
            />
          </div>
        )}
        style={{
          width: '100%',
        }}
        inputClass="hidden"
        containerStyle={{
          width: '100%'
        }}
      />
    </div>
  );
}

// Simple date display component for showing dates
export function PersianDateDisplay({ 
  date, 
  format = 'YYYY/MM/DD',
  className = '' 
}: { 
  date?: string | Date | null; 
  format?: string;
  className?: string;
}) {
  if (!date) return <span className={className}>-</span>;
  
  const jalaliDate = toJalali(date, format);
  return <span className={className}>{jalaliDate}</span>;
}