"use client";

import { useState, useEffect } from "react";
import { Upload, FileSpreadsheet, X, Check, AlertCircle } from "lucide-react";
import { Button } from "../ui/button";
import { useTranslations } from "next-intl";
import { uploadExcel, previewDistribution, createDistributionsBatch } from "@/lib/api/excel";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { CustomerModal } from "./customer-modal";
import { B2BOfferModal } from "./b2b/b2b-offer-modal";
import { createCustomer } from "@/lib/api/core";
import { fetchWarehouseReceipts } from "@/lib/api/warehouse";
import { fetchB2BOffers, createB2BOffer } from "@/lib/api/b2b";
import { Card } from "../ui/card";
import { Progress } from "../ui/progress";

interface ExcelUploadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ExcelUploadModal({ open, onClose, onSuccess }: ExcelUploadModalProps) {
  const t = useTranslations("modals.excelUpload");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [currentRowIndex, setCurrentRowIndex] = useState(0);
  const [previewData, setPreviewData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [processedRows, setProcessedRows] = useState<any[]>([]);
  const [uploadStep, setUploadStep] = useState<"select" | "processing" | "complete">("select");
  const [selectedReceipt, setSelectedReceipt] = useState<number | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<number | null>(null);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      loadReceipts();
      loadOffers();
    }
  }, [open]);


  const loadReceipts = async () => {
    try {
      const data = await fetchWarehouseReceipts();
      const cottageReceipts = data?.filter((r: any) => r.receipt_type === 'import_cottage') || [];
      setReceipts(cottageReceipts);
    } catch (error) {
      console.error("Failed to load receipts:", error);
    }
  };

  const loadOffers = async () => {
    try {
      const data = await fetchB2BOffers();
      const activeOffers = data?.filter((o: any) => o.status === 'active' || o.status === 'pending') || [];
      setOffers(activeOffers);
    } catch (error) {
      console.error("Failed to load offers:", error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    if (!selectedReceipt || !selectedOffer) {
      toast.error(t("select_receipt_offer"));
      return;
    }

    setLoading(true);
    setUploadStep("processing");
    try {
      const result = await uploadExcel(file);
      setRows(result.rows);
      if (result.rows.length > 0) {
        processNextRow(result.rows, 0, []);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error(t("upload_failed"));
      setUploadStep("select");
    } finally {
      setLoading(false);
    }
  };

  const processNextRow = async (allRows: any[], index: number, processed: any[]) => {
    if (index >= allRows.length) {
      submitBatch(processed);
      return;
    }

    setCurrentRowIndex(index);
    const row = allRows[index];

    try {
      const preview = await previewDistribution({
        ...row,
        warehouse_receipt: selectedReceipt,
        offer: { id: selectedOffer },
      });
      setPreviewData(preview);
      setShowPreview(true);
    } catch (error) {
      console.error("Preview failed:", error);
      toast.error(t("preview_failed"));
      processNextRow(allRows, index + 1, processed);
    }
  };

  const handleConfirmRow = async (updatedData?: any) => {
    const dataToSave = updatedData || previewData?.distribution_data;
    const newProcessed = [...processedRows, dataToSave];
    setProcessedRows(newProcessed);
    setShowPreview(false);

    processNextRow(rows, currentRowIndex + 1, newProcessed);
  };

  const handleSkipRow = () => {
    setShowPreview(false);
    processNextRow(rows, currentRowIndex + 1, processedRows);
  };

  const submitBatch = async (distributions: any[]) => {
    if (distributions.length === 0) {
      toast.info(t("no_rows_to_process"));
      resetState();
      return;
    }

    setLoading(true);
    try {
      const result = await createDistributionsBatch(distributions);
      toast.success(t("batch_success", { count: result.count }));
      setUploadStep("complete");
      setTimeout(() => {
        onSuccess?.();
        handleClose();
      }, 2000);
    } catch (error) {
      console.error("Batch creation failed:", error);
      toast.error(t("batch_failed"));
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setRows([]);
    setCurrentRowIndex(0);
    setPreviewData(null);
    setProcessedRows([]);
    setUploadStep("select");
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleCreateCustomer = async (customerData: any) => {
    try {
      const newCustomer = await createCustomer(customerData);

      if (previewData) {
        const updatedData = {
          ...previewData.distribution_data,
          customer: newCustomer.id,
        };
        setPreviewData({
          ...previewData,
          distribution_data: updatedData,
          needs_customer_creation: false,
        });
      }

      setShowCustomerModal(false);
      toast.success(t("customer_created"));
    } catch (error) {
      console.error("Customer creation failed:", error);
      toast.error(t("customer_creation_failed"));
    }
  };

  const handleCreateOffer = async (offerData: any) => {
    try {
      const newOffer = await createB2BOffer(offerData);
      
      if (newOffer) {
        await loadOffers();
        setSelectedOffer(newOffer.id);
        setShowOfferModal(false);
        toast.success(t("offer_created"));
      }
    } catch (error) {
      console.error("Offer creation failed:", error);
      toast.error(t("offer_creation_failed"));
    }
  };

  const progress = rows.length > 0 ? ((currentRowIndex + 1) / rows.length) * 100 : 0;

  return (
    <>
      <Dialog open={open && !showPreview} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
          </DialogHeader>

          {uploadStep === "select" && (
            <div className="space-y-4">
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

              <div className="space-y-3">

                <div>
                  <label className="block text-sm font-medium mb-1">{t("b2b_offer")}</label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={selectedOffer || ""}
                    onChange={(e) => {
                      if (e.target.value === "new") {
                        setShowOfferModal(true);
                      } else {
                        setSelectedOffer(e.target.value ? Number(e.target.value) : null);
                      }
                    }}
                  >
                    <option value="">{t("select_offer")}</option>
                    <option value="new" style={{color: '#f6d265', fontWeight: 'bold'}}>+ {t("create_new_offer")}</option>
                    {offers.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.offer_id} - {o.product_name} ({o.offer_weight} kg)
                      </option>
                    ))}
                  </select>
                </div>


                <div>
                  <label className="block text-sm font-medium mb-1">{t("warehouse_receipt")}</label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={selectedReceipt || ""}
                    onChange={(e) => setSelectedReceipt(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">{t("select_receipt")}</option>
                    {receipts.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.receipt_id} - {r.cottage_serial_number}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleClose}>
                  {t("cancel")}
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!file || !selectedReceipt || !selectedOffer || loading}
                  className="bg-[#f6d265] hover:bg-[#f5c842] text-black"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {t("start_import")}
                </Button>
              </div>
            </div>
          )}

          {uploadStep === "processing" && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  {t("processing_row", { current: currentRowIndex + 1, total: rows.length })}
                </p>
                <Progress value={progress} className="w-full" />
              </div>
              <div className="text-center text-sm text-gray-500">
                {t("confirmed_count", { count: processedRows.length })}
              </div>
            </div>
          )}

          {uploadStep === "complete" && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <Check className="w-16 h-16 text-green-500" />
              </div>
              <p className="text-lg font-semibold">{t("import_complete")}</p>
              <p className="text-sm text-gray-600">
                {t("records_created", { count: processedRows.length })}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {t("preview_title")} ({currentRowIndex + 1}/{rows.length})
            </DialogTitle>
          </DialogHeader>

          {previewData && (
            <div className="space-y-4">
              <Card className="p-4">
                <h3 className="font-semibold mb-3">{t("mapped_fields")}</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">{t("purchase_id")}:</span>
                    <p className="mt-1">{previewData.distribution_data.purchase_id || "-"}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">{t("weight")}:</span>
                    <p className="mt-1">{previewData.distribution_data.agency_weight} kg</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">{t("date")}:</span>
                    <p className="mt-1">{previewData.distribution_data.agency_date}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">{t("customer")}:</span>
                    <p className="mt-1">{previewData.customer_name}</p>
                  </div>
                  {previewData.distribution_data.description && (
                    <div className="col-span-2">
                      <span className="font-medium text-gray-600">{t("description")}:</span>
                      <p className="mt-1">{previewData.distribution_data.description}</p>
                    </div>
                  )}
                </div>
              </Card>

              {Object.keys(previewData.unmapped_fields).length > 0 && (
                <Card className="p-4 bg-yellow-50 border-yellow-200">
                  <h3 className="font-semibold mb-2 text-yellow-800">
                    {t("unmapped_fields")}
                  </h3>
                  <div className="space-y-1 text-sm text-yellow-700">
                    {Object.entries(previewData.unmapped_fields).map(([key, value]) => (
                      <div key={key}>
                        <span className="font-medium">{key}:</span> {String(value)}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {previewData.needs_customer_creation && (
                <Card className="p-4 bg-orange-50 border-orange-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-orange-800 font-medium">
                        {t("customer_not_found")}
                      </p>
                      <p className="text-sm text-orange-700 mt-1">
                        {previewData.customer_name}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowCustomerModal(true)}
                        className="mt-3"
                      >
                        {t("create_customer")}
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {previewData.needs_product_creation && (
                <Card className="p-4 bg-red-50 border-red-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-red-800 font-medium">
                        {t("product_not_found")}
                      </p>
                      <p className="text-sm text-red-700 mt-1">
                        {previewData.product_name}
                      </p>
                      <p className="text-xs text-red-600 mt-2">
                        {t("product_skip_warning")}
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              <div className="flex justify-between pt-4 border-t">
                <Button variant="outline" onClick={handleSkipRow}>
                  <X className="w-4 h-4 mr-1" />
                  {t("skip")}
                </Button>
                <Button
                  onClick={() => handleConfirmRow()}
                  disabled={previewData.needs_customer_creation || previewData.needs_product_creation}
                  className="bg-[#f6d265] hover:bg-[#f5c842] text-black"
                >
                  <Check className="w-4 h-4 mr-1" />
                  {t("confirm")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {showCustomerModal && (
        <CustomerModal
          initialData={{ full_name: previewData?.customer_name }}
          onSubmit={handleCreateCustomer}
          onClose={() => setShowCustomerModal(false)}
        />
      )}

      {showOfferModal && (
        <B2BOfferModal
          onSubmit={handleCreateOffer}
          onClose={() => setShowOfferModal(false)}
        />
      )}
    </>
  );
}