"use client";

import * as React from "react";
import { Input } from "./input";
import { formatInputNumber, parseIntegerFromString, convertPersianToEnglishNumbers } from "@/lib/utils/number-format";
import { cn } from "@/lib/utils";

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: number | string;
  onChange?: (value: number) => void;
  className?: string;
}

export function NumberInput({ 
  value = '', 
  onChange, 
  className,
  ...props 
}: NumberInputProps) {
  const [displayValue, setDisplayValue] = React.useState<string>('');

  React.useEffect(() => {
    if (value === '' || value === 0 || value === null || value === undefined) {
      setDisplayValue('');
    } else {
      setDisplayValue(formatInputNumber(value.toString()));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;
    
    // Convert Persian numbers to English
    inputValue = convertPersianToEnglishNumbers(inputValue);
    
    // Format the input with commas
    const formatted = formatInputNumber(inputValue);
    setDisplayValue(formatted);
    
    // Parse the numeric value for the callback
    const numericValue = parseIntegerFromString(formatted);
    onChange?.(numericValue);
  };

  return (
    <Input
      {...props}
      type="text"
      value={displayValue}
      onChange={handleChange}
      className={cn("text-right", className)}
    />
  );
}