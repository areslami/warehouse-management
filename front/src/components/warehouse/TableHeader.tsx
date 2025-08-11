import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";

interface TableHeaderProps {
  title: string;
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onCreateClick: () => void;
  createButtonLabel: string;
}

export function TableHeader({
  title,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  onCreateClick,
  createButtonLabel
}: TableHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="flex gap-2 items-center">
        <div className="relative">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pr-10 w-64"
          />
        </div>
        <Button
          className="bg-[#f6d265] hover:bg-[#f5c842] text-white"
          onClick={onCreateClick}
        >
          <Plus className="ml-2 h-4 w-4" />
          {createButtonLabel}
        </Button>
      </div>
    </div>
  );
}