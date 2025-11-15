"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Check, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ExportColumn } from "@/lib/excel-mappings";

type ExportColumnsModalProps = {
  open: boolean;
  entityLabel?: string;
  columns: ExportColumn[];
  requiredColumn?: string;
  selectedColumns: string[];
  isExporting: boolean;
  onAddColumn: (columnKey: string) => void;
  onRemoveColumn: (columnKey: string) => void;
  onSelectAll: () => void;
  onConfirm: () => void;
  onClose: () => void;
};

export function ExportColumnsModal({
  open,
  entityLabel,
  columns,
  requiredColumn,
  selectedColumns,
  isExporting,
  onAddColumn,
  onRemoveColumn,
  onSelectAll,
  onConfirm,
  onClose,
}: ExportColumnsModalProps) {
  const t = useTranslations("pages.b2b.export_modal");
  const tCommon = useTranslations("common");

  const selectedColumnMeta = useMemo(
    () => columns.filter((column) => selectedColumns.includes(column.key)),
    [columns, selectedColumns]
  );
  const unselectedColumns = useMemo(
    () => columns.filter((column) => !selectedColumns.includes(column.key)),
    [columns, selectedColumns]
  );
  const allColumnsSelected =
    columns.length > 0 && selectedColumns.length >= columns.length;

  const modalTitle = entityLabel
    ? `${entityLabel} - ${t("title")}`
    : t("title");

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{modalTitle}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        {columns.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-600">
                {t("available_for", { entity: entityLabel || "" })}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={onSelectAll}
                disabled={allColumnsSelected}
              >
                {t("select_all")}
              </Button>
            </div>
            <div className="space-y-5">
              <div>
                <p className="mb-2 text-xs font-semibold text-gray-500">
                  {t("available_heading")}
                </p>
                <div className="flex max-h-60 flex-wrap gap-2 overflow-y-auto rounded-md border border-dashed border-gray-300 p-3">
                  {unselectedColumns.length === 0 ? (
                    <p className="text-xs text-gray-500">{t("all_selected")}</p>
                  ) : (
                    unselectedColumns.map((column) => (
                      <button
                        key={column.key}
                        type="button"
                        onClick={() => onAddColumn(column.key)}
                        className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
                      >
                        <Check className="h-4 w-4 text-green-600" />
                        <span>{column.label}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold text-gray-500">
                  {t("selected_heading")}
                </p>
                <div className="flex min-h-[110px] flex-wrap gap-2 rounded-md border border-blue-200 bg-blue-50/80 p-3">
                  {selectedColumnMeta.length === 0 ? (
                    <p className="text-xs text-gray-600">
                      {t("select_prompt")}
                    </p>
                  ) : (
                    selectedColumnMeta.map((column) => {
                      const isRequired = column.key === requiredColumn;
                      return (
                        <div
                          key={column.key}
                          className="flex items-center gap-2 rounded-full border border-blue-200 bg-white max-h-10 px-3 py-1 text-sm text-blue-900 shadow-sm"
                        >
                          <span>{column.label}</span>
                          {isRequired ? (
                            <span className="text-[11px] text-gray-500">
                              {t("mandatory")}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onRemoveColumn(column.key)}
                              className="text-blue-500 transition hover:text-blue-700"
                              aria-label={`Remove ${column.label}`}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            {tCommon("buttons.cancel")}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isExporting || selectedColumns.length === 0}
          >
            {isExporting ? t("downloading") : tCommon("buttons.download_excel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
