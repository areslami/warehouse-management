"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Input } from "./input";
import { cn } from "@/lib/utils";

interface SearchableSelectOption {
  value: string;
  label: string;
  id?: number | string;
  name?: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
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

export function SearchableSelect({
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
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full text-ellipsis justify-between", className)}
          disabled={disabled}
        >
      <span className="truncate flex-1 min-w-0 overflow-hidden block">
        {selectedOption ? selectedOption.label : placeholder}
      </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 z-[9999]" align="start" sideOffset={4}>
        <div className="p-2">
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8"
          />
        </div>
        <div className="max-h-60 overflow-auto">
          {showCreateNew && onCreateNew && (
            <>
              <div
                className="flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-accent rounded-sm font-semibold text-[#f6d265]"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onCreateNew();
                  setOpen(false);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                {createNewText}
              </div>
              {filteredOptions.length > 0 && (
                <div className="border-t my-1 mx-2" />
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
                  "flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-accent rounded-sm",
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
      </PopoverContent>
    </Popover>
  );
}