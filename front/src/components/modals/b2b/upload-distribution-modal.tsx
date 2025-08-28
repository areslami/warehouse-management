"use client";

import { useState, useEffect } from "react";
import { Upload, FileSpreadsheet, X, Check, AlertCircle } from "lucide-react";
import { uploadDistributionExcel, previewDistribution, createDistributionsBatch } from "@/lib/api/excel";
import { Button } from "../../ui/button";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog";
import { CustomerFormData, CustomerModal } from "../customer-modal";
import { B2BOfferFormData, B2BOfferModal } from "./b2b-offer-modal";
import { ProductFormData, ProductModal } from "../product-modal";
import { createCustomer, createProduct } from "@/lib/api/core";
import { fetchB2BOffers, createB2BOffer } from "@/lib/api/b2b";
import { Card } from "../../ui/card";
import { Progress } from "../../ui/progress";
import { B2BOffer } from "@/lib/interfaces/b2b";

interface UploadDistributionModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface DistributionData {
  purchase_id: number;
  b2b_offer: number;
  warehouse_receipt: number;
  product: number;
  customer: number | undefined;
  agency_weight: number;
  agency_date: string;
  description: string;
};
interface PreviewResponse {
  distribution_data: DistributionData;
  unmapped_fields: { [key: string]: string | number | null };
  needs_customer_creation: boolean;
  customer_name: string;
  needs_product_creation: boolean;
  product_name: string;
}
export function UploadDistributionModal({ open, onClose, onSuccess }: UploadDistributionModalProps) {
  const t = useTranslations("modals.uploadDistribution");

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<object[]>([]);

  const [currentRowIndex, setCurrentRowIndex] = useState(0);
  const [previewData, setPreviewData] = useState<PreviewResponse>({} as PreviewResponse);
  const [showPreview, setShowPreview] = useState(false);

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [createdProducts, setCreatedProducts] = useState<{ [key: string]: number }>({});
  const [createdCustomers, setCreatedCustomers] = useState<{ [key: string]: number }>({});

  const [processedRows, setProcessedRows] = useState<object[]>([]);
  const [uploadStep, setUploadStep] = useState<"select" | "processing" | "complete">("select");



  const [selectedReceipt, setSelectedReceipt] = useState<number | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<number | null>(null);
  const [saleType, setSaleType] = useState<"your_sale" | "distributor_sale">("your_sale");

  const [receipts, setReceipts] = useState<object[]>([]);
  const [offers, setOffers] = useState<object[]>([]);

  useEffect(() => {
    if (open) {
      loadOffers();
    }
  }, [open]);

  const loadOffers = async () => {
    try {
      const data = await fetchB2BOffers();
      const activeOffers = data?.filter((o: B2BOffer) => o.status === 'active' || o.status === 'pending') || [];
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
    
    // Only check for offer if it's "your_sale" type
    if (saleType === "your_sale" && !selectedOffer) {
      toast.error(t("select_offer"));
      return;
    }

    setLoading(true);
    setUploadStep("processing");
    try {
      const result = await uploadDistributionExcel(file, saleType);
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

  const processNextRow = async (allRows: object[], index: number, processed: object[]) => {
    if (index >= allRows.length) {
      submitBatch(processed);
      return;
    }

    setCurrentRowIndex(index);
    let row: any = allRows[index];

    // Check if we have already created this product or customer
    const productName = row.product_name;
    if (productName && createdProducts[productName.toLowerCase()]) {
      row = {
        ...row,
        product: { id: createdProducts[productName.toLowerCase()] }
      };
    }

    const customerName = row.customer_name;
    if (customerName && createdCustomers[customerName.toLowerCase()]) {
      row = {
        ...row,
        customer: { id: createdCustomers[customerName.toLowerCase()] }
      };
    }

    try {
      const previewData: any = { ...row };
      // Only add offer for "your_sale" type and if it's selected
      if (saleType === "your_sale" && selectedOffer) {
        previewData.offer = { id: selectedOffer };
      }
      
      const preview = await previewDistribution(previewData);
      setPreviewData(preview);
      setShowPreview(true);
    } catch (error) {
      console.error("Preview failed:", error);
      toast.error(t("preview_failed"));
      processNextRow(allRows, index + 1, processed);
    }
  };

  const handleConfirmRow = async (updatedData?: unknown) => {
    const dataToSave = updatedData || previewData.distribution_data;

    const newProcessed = [...processedRows, dataToSave];
    setProcessedRows(newProcessed);
    setShowPreview(false);

    processNextRow(rows, currentRowIndex + 1, newProcessed);
  };

  const handleSkipRow = () => {
    setShowPreview(false);
    processNextRow(rows, currentRowIndex + 1, processedRows);
  };

  const submitBatch = async (distributions: object[]) => {
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
    setPreviewData({} as PreviewResponse);
    setProcessedRows([]);
    setUploadStep("select");
    setCreatedProducts({});
    setCreatedCustomers({});
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleCreateProduct = async (productData: ProductFormData) => {
    try {
      const newProduct = await createProduct(productData);
      if (previewData && newProduct) {
        // Store the created product for future rows
        const productName = previewData.product_name;
        if (productName) {
          setCreatedProducts(prev => ({
            ...prev,
            [productName.toLowerCase()]: newProduct.id
          }));
        }

        const updatedData = {
          ...previewData.distribution_data,
          product: newProduct.id,
        };
        setPreviewData({
          ...previewData,
          needs_product_creation: false,
          distribution_data: updatedData,
        });
      }
      toast.success(t("product_created"));
      setShowProductModal(false);
    } catch (error) {
      console.error("Failed to create product:", error);
      toast.error(t("product_creation_failed"));
    }
  };

  const handleCreateCustomer = async (customerData: CustomerFormData) => {
    try {
      const newCustomer = await createCustomer(customerData);

      if (previewData && newCustomer) {
        // Store the created customer for future rows
        const customerName = previewData.customer_name;
        if (customerName) {
          setCreatedCustomers(prev => ({
            ...prev,
            [customerName.toLowerCase()]: newCustomer.id
          }));
        }

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
  const handleCreateOffer = async (offerData: B2BOfferFormData) => {
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
                  <label className="block text-sm font-medium mb-1">{t("sale_type")}</label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="your_sale"
                        checked={saleType === "your_sale"}
                        onChange={(e) => setSaleType(e.target.value as "your_sale" | "distributor_sale")}
                        className="mr-2"
                      />
                      {t("your_sale")}
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="distributor_sale"
                        checked={saleType === "distributor_sale"}
                        onChange={(e) => setSaleType(e.target.value as "your_sale" | "distributor_sale")}
                        className="mr-2"
                      />
                      {t("distributor_sale")}
                    </label>
                  </div>
                </div>

                {saleType === "your_sale" && (
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
                      <option value="new" style={{ color: '#f6d265', fontWeight: 'bold' }}>+ {t("create_new_offer")}</option>
                      {(offers as B2BOffer[]).map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.offer_id} - {o.product_name} ({o.offer_weight} kg)
                        </option>
                      ))}
                    </select>
                  </div>
                )}


              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleClose}>
                  {t("cancel")}
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!file || (saleType === "your_sale" && !selectedOffer) || loading}
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

          {previewData && (() => {
            console.log(previewData);
            return (
              <div className="space-y-4">
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">{t("mapped_fields")}</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">{t("purchase_id")}:</span>
                      <p className="mt-1">{previewData.distribution_data?.purchase_id || "-"}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">{t("weight")}:</span>
                      <p className="mt-1">{previewData.distribution_data?.agency_weight} kg</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">{t("date")}:</span>
                      <p className="mt-1">{previewData.distribution_data?.agency_date}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">{t("customer")}:</span>
                      <p className="mt-1">{previewData.customer_name}</p>
                    </div>
                    {previewData.distribution_data?.description && (
                      <div className="col-span-2">
                        <span className="font-medium text-gray-600">{t("description")}:</span>
                        <p className="mt-1">{previewData.distribution_data?.description}</p>
                      </div>
                    )}
                  </div>
                </Card>

                {Object.keys(previewData?.unmapped_fields || {}).length > 0 && (
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowProductModal(true)}
                          className="mt-2 bg-white hover:bg-gray-50"
                        >
                          {t("create_product")}
                        </Button>
                        <p className="text-xs text-red-600 mt-2">
                          {t("product_skip_warning")}
                        </p>
                      </div>
                    </div>
                  </Card>
                )}

                <div className="flex justify-between pt-4 border-t">
                  <Button 
                    variant="secondary"
                    onClick={() => {
                      // Accept all remaining rows without preview
                      const remainingRows = rows.slice(currentRowIndex);
                      const acceptedRows = remainingRows.map(row => ({
                        ...row,
                        b2b_offer: selectedOffer,
                        warehouse: selectedReceipt,
                      }));
                      submitBatch([...processedRows, ...acceptedRows]);
                    }}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    {t("accept_all")}
                  </Button>
                  <div className="flex gap-2">
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
              </div>);
          })()}
        </DialogContent>
      </Dialog>

      {showCustomerModal && (
        <CustomerModal
          initialData={{ full_name: previewData?.customer_name }}
          onSubmit={handleCreateCustomer}
          onClose={() => setShowCustomerModal(false)}
        />
      )}
      {showProductModal && previewData && (
        <ProductModal
          initialData={{ name: previewData?.product_name }}
          onSubmit={handleCreateProduct}
          onClose={() => setShowProductModal(false)}
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