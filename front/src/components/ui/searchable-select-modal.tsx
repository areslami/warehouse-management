"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { Button } from "./button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Input } from "./input";
import { cn } from "@/lib/utils";

interface SearchableSelectOption {
  value: string;
  label: string;
  id?: number | string;
  name?: string;
}

interface SearchableSelectModalProps {
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

export function SearchableSelectModal({
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
}: SearchableSelectModalProps) {
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
    <>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className={cn("w-full justify-between", className)}
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        {selectedOption ? selectedOption.label : placeholder}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right">{searchPlaceholder}</DialogTitle>
          </DialogHeader>
          
          <div className="p-4 space-y-4">
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10"
            />
            
            <div className="max-h-60 overflow-auto space-y-1">
              {showCreateNew && onCreateNew && (
                <>
                  <div
                    className="flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-accent rounded-md font-semibold text-[#f6d265] border border-dashed border-[#f6d265]"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Create new clicked (modal version)');
                      onCreateNew();
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {createNewText}
                  </div>
                  {filteredOptions.length > 0 && (
                    <div className="border-t my-2" />
                  )}
                </>
              )}
              
              {filteredOptions.length === 0 && !showCreateNew ? (
                <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                  {emptyText}
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <div
                    key={option.value}
                    className={cn(
                      "flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-accent rounded-md",
                      value === option.value && "bg-accent"
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Option clicked (modal version):', option.value, option.label);
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
        </DialogContent>
      </Dialog>
    </>
  );
}