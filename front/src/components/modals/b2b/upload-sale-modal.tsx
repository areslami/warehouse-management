"use client"

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { createSaleBatch, previewSale, uploadSaleExcel } from "@/lib/api/excel";
import { ProductFormData, ProductModal } from "../product-modal";
import { createProduct } from "@/lib/api/core";
import { Check, FileSpreadsheet, Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";



interface UploadSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}


export default function UploadSaleModal({ isOpen, onClose, onSuccess }: UploadSaleModalProps) {
  const t = useTranslations("modals.uploadSale")
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<object[]>([]);
  const [currentRowIndex, setCurrentRowIndex] = useState(0);
  const [processedRows, setProcessedRows] = useState<object[]>([]);


  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [createdProducts, setCreatedProducts] = useState<{ [key: string]: number }>({});

  const [uploadStep, setUploadStep] = useState<"select" | "processing" | "complete">("select");

  const handleClose = () => {
    resetState();
    onClose();
  };
  const resetState = () => {
    setShowPreview(false);
    setLoading(false);
    setUploadStep("select");
    setShowProductModal(false);
    setCreatedProducts({});
  };

  const handleCreateProduct = async (productData: ProductFormData) => {
    try {
      const newProduct = await createProduct(productData);
      if (previewData && newProduct) {
        // Store the created product for future rows
        const productName = previewData.product_name || previewData.sale_data?.product_name;
        if (productName) {
          setCreatedProducts(prev => ({
            ...prev,
            [productName.toLowerCase()]: newProduct.id
          }));
        }

        const updatedData = {
          ...previewData.sale_data,
          product: newProduct.id,
        };
        setPreviewData({
          ...previewData,
          needs_product_creation: false,
          sale_data: updatedData,
        });
      }
      toast.success(t("product_created"));
      setShowProductModal(false);
    } catch (error) {
      console.error("Failed to create product:", error);
      toast.error(t("product_creation_failed"));
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
    setLoading(true);
    setUploadStep("processing");
    try {
      const result = await uploadSaleExcel(file)
      toast.success(
        `${t("customer_created", { count: result.number_of_customer_created || 0 })}, 
   ${t("receiver_created", { count: result.number_of_receiver_created || 0 })}`
      );
      setRows(result.rows);
      if (result.rows.length > 0) {
        processNextRow(result.rows, 0, []);
      }

    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error(t("upload_failed"));
    } finally {
      setLoading(false);
    }
  }
  const submitBatch = async (sales: object[]) => {
    if (sales.length === 0) {
      toast.info(t("no_rows_to_process"));
      resetState();
      return;
    }
    setLoading(true);
    try {
      const result = await createSaleBatch(sales);
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
  }
  const processNextRow = async (allRows: object[], index: number, processed: object[]) => {
    if (index >= allRows.length) {
      submitBatch(processed);
      return;
    }
    setCurrentRowIndex(index);
    let row: any = allRows[index];

    // Check if we have already created this product
    const productName = row.product_name;
    if (productName && createdProducts[productName.toLowerCase()]) {
      row = {
        ...row,
        product: { id: createdProducts[productName.toLowerCase()] }
      };
    }

    try {
      const preview = await previewSale(row);
      setPreviewData(preview);
      setShowPreview(true);
    } catch (error) {
      console.error("Preview failed:", error);
      toast.error(t("preview_failed"));
      processNextRow(allRows, index + 1, processed);
    }
  }

  const handlePreviewConfirm = () => {
    if (previewData?.sale_data) {
      const updatedRows = [...processedRows, previewData.sale_data];
      setProcessedRows(updatedRows);
      setShowPreview(false);
      processNextRow(rows, currentRowIndex + 1, updatedRows);
    }
  }

  const handlePreviewSkip = () => {
    setShowPreview(false);
    processNextRow(rows, currentRowIndex + 1, processedRows);
  }

  const progress = rows.length > 0 ? ((currentRowIndex + 1) / rows.length) * 100 : 0;
  return (
    <>

      <Dialog open={isOpen && !showPreview} onOpenChange={handleClose}>
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
                {/* 
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


                <div>
                  <label className="block text-sm font-medium mb-1">{t("warehouse_receipt")}</label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={selectedReceipt || ""}
                    onChange={(e) => {
                      if (e.target.value == 'new') {
                        setShowReceiptModal(true);
                      } else {
                        setSelectedReceipt(e.target.value ? Number(e.target.value) : null)
                      }
                    }}
                  >
                    <option value="">{t("select_receipt")}</option>
                    <option value="new" style={{ color: '#f6d265', fontWeight: "bold" }}>+ {t("create_new_receipt")}</option>
                    {(receipts as WarehouseReceipt[]).map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.receipt_id} - {r.cottage_serial_number}
                      </option>
                    ))}
                  </select>
                </div> */}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleClose}>
                  {t("cancel")}
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!file || loading}
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

      <Dialog open={showPreview} onOpenChange={(open) => !open && handlePreviewSkip()}>
        <DialogContent className="max-w-3xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {t("preview_title")} ({currentRowIndex + 1}/{rows.length})
            </DialogTitle>
          </DialogHeader>

          {previewData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">{t("allocation_id")}</label>
                  <div className="mt-1 p-2 bg-gray-50 rounded">
                    {previewData.sale_data?.allocation_id || "-"}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">{t("purchase_id")}</label>
                  <div className="mt-1 p-2 bg-gray-50 rounded">
                    {previewData.sale_data?.purchase_id || "-"}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">{t("weight")}</label>
                  <div className="mt-1 p-2 bg-gray-50 rounded">
                    {previewData.sale_data?.total_weight_purchased || 0} kg
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">{t("amount")}</label>
                  <div className="mt-1 p-2 bg-gray-50 rounded">
                    {previewData.sale_data?.payment_amount || 0}
                  </div>
                </div>
              </div>

              {previewData.needs_customer_creation && (
                <Card className="p-3 bg-yellow-50 border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    {t("customer_will_be_created")}: {previewData.customer_name}
                  </p>
                </Card>
              )}

              {previewData.needs_receiver_creation && (
                <Card className="p-3 bg-blue-50 border-blue-200">
                  <p className="text-sm text-blue-800">
                    {t("receiver_will_be_created")}: {previewData.receiver_name}
                  </p>
                </Card>
              )}

              {previewData.needs_product_creation && (
                <Card className="p-3 bg-red-50 border-red-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-red-800 font-medium">
                        {t("product_not_found")}
                      </p>
                      <p className="text-sm text-red-700 mt-1">
                        {previewData.product_name || previewData.sale_data?.product_name}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowProductModal(true)}
                      className="bg-white hover:bg-gray-50"
                    >
                      {t("create_product")}
                    </Button>
                  </div>
                </Card>
              )}

              {previewData.sale_data?.description && (
                <div>
                  <label className="text-sm font-medium">{t("description")}</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded">
                    {previewData.sale_data.description}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={handlePreviewSkip}>
                  {t("skip")}
                </Button>
                <Button
                  onClick={handlePreviewConfirm}
                  disabled={previewData?.needs_product_creation}
                  className="bg-[#f6d265] hover:bg-[#f5c842] text-black disabled:opacity-50"
                >
                  {t("confirm")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {showProductModal && previewData && (
        <ProductModal
          initialData={{ name: previewData?.product_name || previewData?.sale_data?.product_name }}
          onSubmit={handleCreateProduct}
          onClose={() => setShowProductModal(false)}
        />
      )}
    </>
  );

}