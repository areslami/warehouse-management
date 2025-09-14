"use client";

import * as React from "react";
import { useState, useMemo, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { cn } from "@/lib/utils";

interface ComboboxOption {
  value: string;
  label: string;
  id?: number | string;
  name?: string;
}

interface SimpleComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  showCreateNew?: boolean;
  createNewText?: string;
  onCreateNew?: () => void;
  className?: string;
}

export function SimpleCombobox({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  searchPlaceholder = "جستجو...",
  emptyText = "No options found.",
  disabled = false,
  showCreateNew = false,
  createNewText = "Create new",
  onCreateNew,
  className
}: SimpleComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    
    const searchTerm = search.toLowerCase();
    return options.filter(option => {
      const label = option.label.toLowerCase();
      const id = option.id?.toString().toLowerCase() || "";
      const name = option.name?.toLowerCase() || "";
      
      return label.includes(searchTerm) || 
             id.includes(searchTerm) || 
             name.includes(searchTerm);
    });
  }, [options, search]);

  const selectedOption = options.find(option => option.value === value);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [open]);

  // Focus search input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between"
        disabled={disabled}
        onClick={(e) => {
          e.preventDefault();
          setOpen(!open);
        }}
        type="button"
      >
        {selectedOption ? selectedOption.label : placeholder}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {open && (
        <div className="absolute top-full left-0 right-0 z-[10000] mt-1 bg-popover text-popover-foreground border rounded-md shadow-md animate-in fade-in-0 zoom-in-95">
          <div className="p-2">
            <Input
              ref={inputRef}
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8"
            />
          </div>
          <div className="max-h-60 overflow-auto p-1">
            {showCreateNew && onCreateNew && (
              <>
                <div
                  className="flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-accent focus:bg-accent rounded-sm font-semibold text-[#f6d265]"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onCreateNew();
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {createNewText}
                </div>
                {filteredOptions.length > 0 && (
                  <div className="border-t my-1" />
                )}
              </>
            )}
            
            {filteredOptions.length === 0 && !showCreateNew ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                {emptyText}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={cn(
                    "flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-accent focus:bg-accent rounded-sm",
                    value === option.value && "bg-accent"
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onValueChange?.(option.value);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}