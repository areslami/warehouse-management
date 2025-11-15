"use client";

import { ComponentType } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Plus } from "lucide-react";
import { useModal } from "@/lib/modal-context";
import { useTranslations } from "next-intl";

interface SelectOption {
  id: number;
  name?: string;
  display?: string;
  [key: string]: any;
}

interface SelectWithCreateProps<T extends SelectOption> {
  value?: number | string;
  onChange?: (value: number | undefined) => void;
  options: T[];
  placeholder?: string;
  createLabel?: string;
  displayFormat?: (item: T) => string;
  createModal?: ComponentType<any>;
  onCreateSubmit?: (data: any) => Promise<T | null>;
  refreshData?: () => Promise<void>;
  allowEmpty?: boolean;
  emptyLabel?: string;
  emptyValue?: string;
  disabled?: boolean;
}

export function SelectWithCreate<T extends SelectOption>({
  value,
  onChange,
  options,
  placeholder = "Select...",
  createLabel,
  displayFormat = (item) => item.name || item.display || `#${item.id}`,
  createModal,
  onCreateSubmit,
  refreshData,
  allowEmpty = false,
  emptyLabel = "None",
  emptyValue = "none",
  disabled = false,
}: SelectWithCreateProps<T>) {
  const { openModal } = useModal();
  const t = useTranslations();

  const handleChange = (selectedValue: string) => {
    if (selectedValue === "new" && createModal && onCreateSubmit) {
      // Use setTimeout to prevent parent modal from closing
      setTimeout(() => {
        openModal(createModal, {
          onSubmit: async (newData: any) => {
            const created = await onCreateSubmit(newData);
            if (created) {
              if (refreshData) {
                await refreshData();
              }
              onChange?.(created.id);
            }
          },
          trigger: <span />, // Provide trigger to prevent parent modal from closing
        });
      }, 0);
    } else if (selectedValue === emptyValue) {
      onChange?.(undefined);
    } else {
      onChange?.(Number(selectedValue));
    }
  };

  const currentValue = value ? value.toString() : "";

  return (
    <Select
      value={currentValue}
      onValueChange={handleChange}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {createModal && onCreateSubmit && (
          <>
            <SelectItem value="new" className="font-semibold text-[#f6d265]">
              <Plus className="inline-block w-4 h-4 mr-2" />
              {createLabel || "Create New"}
            </SelectItem>
            {(options.length > 0 || allowEmpty) && (
              <div className="border-t my-1" />
            )}
          </>
        )}
        {allowEmpty && (
          <SelectItem value={emptyValue}>
            {emptyLabel}
          </SelectItem>
        )}
        {allowEmpty && options.length > 0 && (
          <div className="border-t my-1" />
        )}
        {options.map((option) => (
          <SelectItem key={option.id} value={option.id.toString()}>
            {displayFormat(option)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}