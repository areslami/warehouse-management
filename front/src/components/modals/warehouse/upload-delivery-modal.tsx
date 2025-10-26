"use client"

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, FileSpreadsheet, Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { formatNumber } from "@/lib/utils/number-format";
import { SimpleCombobox } from "@/components/ui/simple-combobox";
import { useCoreData } from "@/lib/core-data-context";
import { ShippingCompanyModal } from "@/components/modals/shipping-company-modal";

interface UploadDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Required fields for delivery mapping
const REQUIRED_FIELDS = [
  { key: "delivery_id", label: "delivery_id_field", required: true },
  { key: "waybill_serial", label: "waybill_serial_field", required: false },
  { key: "allocation_id", label: "allocation_id_field", required: true },
  { key: "issue_date", label: "issue_date_field", required: true },
  { key: "driver_name", label: "driver_name_field", required: true },
  { key: "driver_phone", label: "driver_phone_field", required: true },
  { key: "license_plate", label: "license_plate_field", required: true },
  { key: "total_weight", label: "total_weight_field", required: true },
  { key: "destination", label: "destination_field", required: false },
  { key: "receiver", label: "receiver_field", required: true },
  { key: "fare", label: "fare_field", required: true },
] as const;

export default function UploadDeliveryModal({ isOpen, onClose, onSuccess }: UploadDeliveryModalProps) {
  const t = useTranslations("modals.uploadDelivery");
  const { shippingCompanies, refreshData } = useCoreData();

  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<object[]>([]);
  const [selectedShippingCompany, setSelectedShippingCompany] = useState<number | "" | "new">("");

  const [loading, setLoading] = useState(false);
  const [uploadStep, setUploadStep] = useState<"select" | "mapping" | "processing" | "complete">("select");
  const [showShippingCompanyModal, setShowShippingCompanyModal] = useState(false);

  // Column mapping state
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});

  // Batch creation result
  const [batchResult, setBatchResult] = useState<{ count: number; error_count: number; errors?: any[] } | null>(null);

  const handleClose = () => {
    toast.dismiss(); // Dismiss any persistent toasts
    resetState();
    onClose();
  };

  // Cleanup toasts when modal closes
  useEffect(() => {
    return () => {
      if (!isOpen) {
        toast.dismiss();
      }
    };
  }, [isOpen]);

  const resetState = () => {
    setFile(null);
    setRows([]);
    setSelectedShippingCompany("");
    setLoading(false);
    setUploadStep("select");
    setShowShippingCompanyModal(false);
    setExcelColumns([]);
    setColumnMappings({});
    setBatchResult(null);
  };

  const handleCreateShippingCompany = async (data: any) => {
    try {
      // This will be handled by the ShippingCompanyModal's onSubmit
      await refreshData("shippingCompanies");
      setShowShippingCompanyModal(false);
    } catch (error) {
      console.error("Failed to create shipping company:", error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error(t("select_file"));
      return;
    }
    if (!selectedShippingCompany) {
      toast.error(t("select_shipping_company"));
      return;
    }

    setLoading(true);

    try {
      // Create FormData and send file to backend
      const formData = new FormData();
      formData.append("file", file);
      formData.append("shipping_company_id", String(selectedShippingCompany));

      const { getApiBaseUrl } = await import("@/lib/api/config");
      const response = await fetch(`${getApiBaseUrl()}warehouse/deliveries/upload/`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      const { columns, rows: dataRows } = result;

      if (!columns || columns.length === 0) {
        toast.error(t("no_columns_found"));
        setUploadStep("select");
        setLoading(false);
        return;
      }

      setExcelColumns(columns);
      setRows(dataRows || []);
      setUploadStep("mapping");

      toast.success(t("upload_success") + ` - ${columns.length} ستون یافت شد`);
    } catch (error) {
      toast.error(t("upload_failed") + ": " + (error instanceof Error ? error.message : "Unknown error"));
      setUploadStep("select");
    } finally {
      setLoading(false);
    }
  };

  const handleMappingConfirm = async () => {
    // Check if all required fields are mapped (only check fields where required: true)
    const allRequiredFieldsMapped = REQUIRED_FIELDS
      .filter(field => field.required)
      .every(field => columnMappings[field.key]);

    if (!allRequiredFieldsMapped) {
      toast.error(t("all_fields_required"));
      return;
    }

    setLoading(true);
    setUploadStep("processing");

    try {
      const { getApiBaseUrl } = await import("@/lib/api/config");
      const response = await fetch(`${getApiBaseUrl()}warehouse/deliveries/batch/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deliveries: rows,
          column_mappings: columnMappings,
          shipping_company_id: selectedShippingCompany,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      const { count, errors, error_count } = result;

      // Store result for the complete step
      setBatchResult({ count: count || 0, error_count: error_count || 0, errors: errors || [] });

      if (error_count > 0) {
        // Don't show toast - the modal shows all details
        // Don't auto-close the modal when there are errors, but refresh data if some succeeded
        setUploadStep("complete");
        if (count > 0 && onSuccess) {
          // Refresh data in background for successful rows
          await onSuccess();
        }
      } else {
        toast.success(t("batch_success", { count }));
        setUploadStep("complete");

        // Refresh data immediately
        if (onSuccess) {
          await onSuccess();
        }
      }
    } catch (error) {
      toast.error(t("batch_failed") + ": " + (error instanceof Error ? error.message : "Unknown error"));
      setUploadStep("select");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
          </DialogHeader>

          {uploadStep === "select" && (
            <div className="space-y-4 pb-2">
              <div className="space-y-4">
                <div className="w-full">
                  <label className="block text-sm font-medium mb-2">{t("shipping_company")}</label>
                  <SimpleCombobox
                    options={shippingCompanies.map((sc: any) => ({
                      value: String(sc.id),
                      label: sc.name,
                      id: sc.id,
                      name: sc.name,
                    }))}
                    value={selectedShippingCompany ? String(selectedShippingCompany) : ""}
                    onValueChange={(v) => setSelectedShippingCompany(v ? Number(v) : "")}
                    placeholder={t("select_shipping_company")}
                    searchPlaceholder={t("search_shipping_company")}
                    showCreateNew={true}
                    createNewText={t("create_new_shipping_company")}
                    onCreateNew={() => setShowShippingCompanyModal(true)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FileSpreadsheet className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">{t("click_to_upload")}</span>
                    </p>
                    <p className="text-xs text-gray-500">{t("supported_formats")}</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".xls,.xlsx,.html"
                    onChange={handleFileSelect}
                  />
                </label>
              </div>

              {file && (
                <Card className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{file.name}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setFile(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleClose}>
                  {t("cancel")}
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!file || !selectedShippingCompany || loading}
                  className="bg-[#f6d265] hover:bg-[#f5c842] text-black"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {t("start_import")}
                </Button>
              </div>
            </div>
          )}

          {uploadStep === "mapping" && (
            <div className="space-y-4 pb-2">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  {t("mapping_instructions")}
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  تعداد ستون‌های یافت شده: {excelColumns.length}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 font-semibold text-sm">
                <div className="text-right">{t("required_field")}</div>
                <div className="text-right">{t("excel_column")}</div>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {REQUIRED_FIELDS.map((field) => {
                  // Get all selected columns except the current field's selection
                  const selectedColumns = Object.entries(columnMappings)
                    .filter(([key, _]) => key !== field.key)
                    .map(([_, value]) => value);

                  // Filter available columns to exclude already-selected ones
                  const availableColumns = excelColumns.filter(
                    col => !selectedColumns.includes(col) || col === columnMappings[field.key]
                  );

                  return (
                    <div key={field.key} className="grid grid-cols-2 gap-4 items-center">
                      <div className="text-right">
                        <label className="text-sm font-medium">
                          {t(field.label)}
                          {!field.required && (
                            <span className="text-gray-400 text-xs mr-1">(اختیاری)</span>
                          )}
                        </label>
                      </div>
                      <div>
                        <Select
                          value={columnMappings[field.key] || ""}
                          onValueChange={(value) => {
                            if (value === "__clear__") {
                              // Clear the selection
                              setColumnMappings(prev => {
                                const newMappings = { ...prev };
                                delete newMappings[field.key];
                                return newMappings;
                              });
                            } else {
                              setColumnMappings(prev => ({
                                ...prev,
                                [field.key]: value
                              }));
                            }
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={t("select_column")} />
                          </SelectTrigger>
                          <SelectContent dir="rtl">
                            {/* Empty/Clear option */}
                            <SelectItem value="__clear__">
                              <span className="text-gray-400 italic">- حذف انتخاب -</span>
                            </SelectItem>

                            {availableColumns.length === 0 ? (
                              <SelectItem value="no-columns" disabled>
                                هیچ ستونی باقی نمانده
                              </SelectItem>
                            ) : (
                              availableColumns.map((column, idx) => (
                                <SelectItem key={`${column}-${idx}`} value={column}>
                                  {column}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setUploadStep("select")}>
                  {t("back")}
                </Button>
                <Button
                  onClick={handleMappingConfirm}
                  disabled={!REQUIRED_FIELDS.filter(f => f.required).every(field => columnMappings[field.key])}
                  className="bg-[#f6d265] hover:bg-[#f5c842] text-black disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("start_data_import")}
                </Button>
              </div>
            </div>
          )}

          {uploadStep === "processing" && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f6d265]"></div>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {t("processing_deliveries")}
                </p>
                <p className="text-xs text-gray-500">
                  {t("please_wait")}
                </p>
              </div>
            </div>
          )}

          {uploadStep === "complete" && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="flex justify-center">
                  <Check className="w-16 h-16 text-green-500" />
                </div>
                <p className="text-lg font-semibold">{t("import_complete")}</p>
                {batchResult && (
                  <div className="text-sm text-gray-600 mt-4">
                    {batchResult.count > 0 && (
                      <p className="text-green-600 font-medium">
                        ✓ {batchResult.count} تحویل با موفقیت ایجاد شد
                      </p>
                    )}
                    {batchResult.error_count > 0 && (
                      <p className="text-orange-600 font-medium mt-2">
                        ✗ {batchResult.error_count} مورد با خطا مواجه شد
                      </p>
                    )}
                  </div>
                )}
              </div>

              {batchResult && batchResult.errors && batchResult.errors.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2" dir="rtl">جزئیات خطاها:</p>
                  <div className="max-h-64 overflow-y-auto bg-red-50 border border-red-200 rounded p-3" dir="rtl">
                    {batchResult.errors.map((err: any, idx: number) => (
                      <div key={idx} className="text-xs mb-2 pb-2 border-b border-red-200 last:border-b-0">
                        <span className="font-semibold text-red-700">ردیف {err.row}:</span>{' '}
                        <span className="text-red-600">{err.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-center pt-4 border-t">
                <Button
                  onClick={() => {
                    toast.dismiss(); // Dismiss all toasts
                    handleClose();
                  }}
                  className="bg-[#f6d265] hover:bg-[#f5c842] text-black"
                >
                  {batchResult?.error_count && batchResult.error_count > 0 ? 'بستن' : 'تایید و بستن'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {showShippingCompanyModal && (
        <ShippingCompanyModal
          onSubmit={async (data) => {
            try {
              const { createShippingCompany } = await import("@/lib/api/core");
              const created = await createShippingCompany(data);
              if (created) {
                await refreshData("shippingCompanies");
                setSelectedShippingCompany(created.id);
                toast.success(t("shipping_company_created"));
              }
              setShowShippingCompanyModal(false);
            } catch (error) {
              console.error("Failed to create shipping company:", error);
              toast.error(t("shipping_company_creation_failed"));
            }
          }}
          onClose={() => setShowShippingCompanyModal(false)}
        />
      )}
    </>
  );
}
