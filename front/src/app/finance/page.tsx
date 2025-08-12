"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Edit2, Trash2, DollarSign, Receipt, Search, FileText, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SalesProformaModal } from "@/components/modals/salesproforma-modal";
import { PurchaseProformaModal } from "@/components/modals/purchaseproforma-modal";
import { useCoreData } from "@/lib/core-data-context";
import {
  fetchSalesProformas, createSalesProforma, updateSalesProforma, deleteSalesProforma,
  fetchPurchaseProformas, createPurchaseProforma, updatePurchaseProforma, deletePurchaseProforma
} from "@/lib/api/finance";
import { SalesProforma, PurchaseProforma } from "@/lib/interfaces/finance";
import { getPartyDisplayName } from "@/lib/utils/party-utils";

export default function FinancePage() {
  const t = useTranslations("finance_page");
  const { customers, suppliers, products } = useCoreData();

  const [salesProformas, setSalesProformas] = useState<SalesProforma[]>([]);
  const [purchaseProformas, setPurchaseProformas] = useState<PurchaseProforma[]>([]);

  const [showSalesModal, setShowSalesModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const [editingSales, setEditingSales] = useState<SalesProforma | null>(null);
  const [editingPurchase, setEditingPurchase] = useState<PurchaseProforma | null>(null);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SalesProforma | PurchaseProforma | null>(null);
  const [selectedType, setSelectedType] = useState<'sales' | 'purchase'>('sales');

  const [searchTerm, setSearchTerm] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [salesData, purchaseData] = await Promise.all([
        fetchSalesProformas(),
        fetchPurchaseProformas()
      ]);
      setSalesProformas(salesData || []);
      setPurchaseProformas(purchaseData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error(t("errors.fetch_failed"));
    }
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRowClick = (item: SalesProforma | PurchaseProforma, type: 'sales' | 'purchase') => {
    setSelectedItem(item);
    setSelectedType(type);
    setSheetOpen(true);
  };

  const handleDeleteSales = async (id: number) => {
    if (confirm(t("sales.confirm_delete"))) {
      try {
        await deleteSalesProforma(id);
        toast.success(t("errors.success_delete"));
        loadData();
      } catch (error) {
        console.error("Error deleting sales proforma:", error);
        toast.error(t("errors.delete_failed"));
      }
    }
  };

  const handleDeletePurchase = async (id: number) => {
    if (confirm(t("purchase.confirm_delete"))) {
      try {
        await deletePurchaseProforma(id);
        toast.success(t("errors.success_delete"));
        loadData();
      } catch (error) {
        console.error("Error deleting purchase proforma:", error);
        toast.error(t("errors.delete_failed"));
      }
    }
  };

  const filteredSalesProformas = useMemo(() => {
    return salesProformas.filter(proforma => {
      const customerName = getPartyDisplayName(customers.find(c => c.id === proforma.customer));
      return proforma.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customerName.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [salesProformas, searchTerm, customers]);

  const filteredPurchaseProformas = useMemo(() => {
    return purchaseProformas.filter(proforma => {
      const supplierName = getPartyDisplayName(suppliers.find(s => s.id === proforma.supplier));
      return proforma.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [purchaseProformas, searchTerm, suppliers]);

  const calculateTotal = (lines?: Array<{ weight: number; unit_price: number; tax?: number; discount?: number }>) => {
    if (!lines) return 0;
    return lines.reduce((sum, line) => sum + (line.weight * line.unit_price), 0);
  };

  return (
    <div className="flex-1 p-6 min-h-screen bg-gray-50" dir="rtl">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">{t("title")}</h1>

      <div className="mb-6 space-y-4">

        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder={t("search")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
      </div>

      <Tabs defaultValue="sales_proforma" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="purchase_invoice" className="data-[state=active]:bg-[#f6d265] data-[state=active]:text-black">
            <FileText className="w-4 h-4 mr-2" />
            {t("purchase_invoice_tab")}
          </TabsTrigger>
          <TabsTrigger value="sales_invoice" className="data-[state=active]:bg-[#f6d265] data-[state=active]:text-black">
            <FileText className="w-4 h-4 mr-2" />
            {t("sales_invoice_tab")}
          </TabsTrigger>
          <TabsTrigger value="purchase_proforma" className="data-[state=active]:bg-[#f6d265] data-[state=active]:text-black">
            <Receipt className="w-4 h-4 mr-2" />
            {t("purchase_proforma_tab")}
          </TabsTrigger>
          <TabsTrigger value="sales_proforma" className="data-[state=active]:bg-[#f6d265] data-[state=active]:text-black">
            <DollarSign className="w-4 h-4 mr-2" />
            {t("sales_proforma_tab")}
          </TabsTrigger>


        </TabsList>

        <TabsContent value="sales_invoice">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Clock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-semibold mb-2 text-gray-700">{t("sales_invoice_tab")}</h2>
            <p className="text-gray-500">{t("invoice_coming_soon")}</p>
          </div>
        </TabsContent>

        <TabsContent value="purchase_invoice">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Clock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-semibold mb-2 text-gray-700">{t("purchase_invoice_tab")}</h2>
            <p className="text-gray-500">{t("invoice_coming_soon")}</p>
          </div>
        </TabsContent>

        <TabsContent value="sales_proforma">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">{t("sales.title")}</h2>
              <Button className="bg-[#f6d265] hover:bg-[#f5c842] text-black" onClick={() => {
                setEditingSales(null);
                setShowSalesModal(true);
              }}>
                <Plus className="w-4 h-4 mr-1" />
                {t("sales.add_proforma")}
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">{t("sales.operations")}</TableHead>
                  <TableHead>{t("sales.serial_number")}</TableHead>
                  <TableHead>{t("sales.customer")}</TableHead>
                  <TableHead>{t("sales.date")}</TableHead>
                  <TableHead>{t("sales.total_amount")}</TableHead>
                  <TableHead>{t("sales.payment_type")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSalesProformas.map((proforma) => (
                  <TableRow key={proforma.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleRowClick(proforma, 'sales')}>
                    <TableCell>
                      <div className="flex gap-2 justify-center">
                        <Button size="sm" variant="ghost" onClick={(e) => {
                          e.stopPropagation();
                          setEditingSales(proforma);
                          setShowSalesModal(true);
                        }}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSales(proforma.id);
                        }}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{proforma.serial_number}</TableCell>
                    <TableCell>{getPartyDisplayName(customers.find(c => c.id === proforma.customer))}</TableCell>
                    <TableCell>{new Date(proforma.date).toLocaleDateString('fa-IR')}</TableCell>
                    <TableCell>{calculateTotal(proforma.lines).toLocaleString()} ریال</TableCell>
                    <TableCell>
                      {proforma.payment_type === 'cash' && 'نقدی'}
                      {proforma.payment_type === 'credit' && 'اعتباری'}
                      {proforma.payment_type === 'other' && 'سایر'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="purchase_proforma">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">{t("purchase.title")}</h2>
              <Button className="bg-[#f6d265] hover:bg-[#f5c842] text-black" onClick={() => {
                setEditingPurchase(null);
                setShowPurchaseModal(true);
              }}>
                <Plus className="w-4 h-4 mr-1" />
                {t("purchase.add_proforma")}
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">{t("purchase.operations")}</TableHead>
                  <TableHead>{t("purchase.serial_number")}</TableHead>
                  <TableHead>{t("purchase.supplier")}</TableHead>
                  <TableHead>{t("purchase.date")}</TableHead>
                  <TableHead>{t("purchase.total_amount")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchaseProformas.map((proforma) => (
                  <TableRow key={proforma.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleRowClick(proforma, 'purchase')}>
                    <TableCell>
                      <div className="flex gap-2 justify-center">
                        <Button size="sm" variant="ghost" onClick={(e) => {
                          e.stopPropagation();
                          setEditingPurchase(proforma);
                          setShowPurchaseModal(true);
                        }}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePurchase(proforma.id);
                        }}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{proforma.serial_number}</TableCell>
                    <TableCell>{getPartyDisplayName(suppliers.find(s => s.id === proforma.supplier))}</TableCell>
                    <TableCell>{new Date(proforma.date).toLocaleDateString('fa-IR')}</TableCell>
                    <TableCell>{calculateTotal(proforma.lines).toLocaleString()} ریال</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" className="w-[400px] sm:w-[540px] overflow-y-auto p-6" dir="rtl">
          <SheetHeader>
            <SheetTitle className="text-2xl font-bold text-[#f6d265]">
              {selectedType === 'sales' && t("sales.details")}
              {selectedType === 'purchase' && t("purchase.details")}
            </SheetTitle>
          </SheetHeader>
          {selectedItem && (
            <>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedType === 'sales') {
                      setEditingSales(selectedItem as SalesProforma);
                      setShowSalesModal(true);
                    } else {
                      setEditingPurchase(selectedItem as PurchaseProforma);
                      setShowPurchaseModal(true);
                    }
                    setSheetOpen(false);
                  }}
                >
                  <Edit2 className="h-4 w-4 ml-1" />
                  {t("edit")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:bg-red-50"
                  onClick={async () => {
                    const confirmMessage = selectedType === 'sales' ? t("sales.confirm_delete") : t("purchase.confirm_delete");
                    if (confirm(confirmMessage)) {
                      try {
                        if (selectedType === 'sales') {
                          await deleteSalesProforma(selectedItem.id);
                        } else {
                          await deletePurchaseProforma(selectedItem.id);
                        }
                        toast.success(t("errors.success_delete"));
                        await loadData();
                        setSheetOpen(false);
                      } catch (error) {
                        console.error("Error deleting:", error);
                        toast.error(t("errors.delete_failed"));
                      }
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 ml-1" />
                  {t("delete")}
                </Button>
              </div>
              <div className="mt-6 space-y-4 p-4 bg-gray-50 rounded-lg">
              <div><strong>شماره سریال:</strong> {selectedItem.serial_number}</div>
              <div><strong>تاریخ:</strong> {new Date(selectedItem.date).toLocaleDateString('fa-IR')}</div>
              {selectedType === 'sales' && 'customer' in selectedItem && (
                <>
                  <div><strong>مشتری:</strong> {getPartyDisplayName(customers.find(c => c.id === selectedItem.customer))}</div>
                  <div><strong>نوع پرداخت:</strong> {
                    selectedItem.payment_type === 'cash' ? 'نقدی' :
                      selectedItem.payment_type === 'credit' ? 'اعتباری' : 'سایر'
                  }</div>
                  {selectedItem.payment_description && <div><strong>توضیحات پرداخت:</strong> {selectedItem.payment_description}</div>}
                </>
              )}
              {selectedType === 'purchase' && 'supplier' in selectedItem && (
                <div><strong>تامین کننده:</strong> {getPartyDisplayName(suppliers.find(s => s.id === selectedItem.supplier))}</div>
              )}
              <div><strong>مبلغ کل:</strong> {calculateTotal(selectedItem.lines).toLocaleString()} ریال</div>
              {selectedItem.lines && selectedItem.lines.length > 0 && (
                <div>
                  <strong>ردیف‌ها:</strong>
                  <ul className="mt-2 space-y-2">
                    {selectedItem.lines.map((line, idx: number) => (
                      <li key={idx} className="bg-white p-3 rounded border">
                        <div>محصول: {products.find(p => p.id === line.product)?.name}</div>
                        <div>وزن: {line.weight} کیلوگرم</div>
                        <div>قیمت واحد: {line.unit_price.toLocaleString()} ریال</div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {showSalesModal && (
        <SalesProformaModal
          initialData={editingSales ? {
            ...editingSales,
            payment_description: editingSales.payment_description || undefined
          } : undefined}
          onSubmit={async (data) => {
            try {
              const apiData = {
                ...data,
                payment_description: data.payment_description || null
              };
              if (editingSales) {
                await updateSalesProforma(editingSales.id, apiData);
                toast.success(t("errors.success_update"));
              } else {
                await createSalesProforma(apiData);
                toast.success(t("errors.success_create"));
              }
              await loadData();
              setShowSalesModal(false);
              setEditingSales(null);
            } catch (error) {
              console.error("Error saving sales proforma:", error);
              toast.error(editingSales ? t("errors.update_failed") : t("errors.create_failed"));
            }
          }}
          onClose={() => {
            setShowSalesModal(false);
            setEditingSales(null);
          }}
        />
      )}

      {showPurchaseModal && (
        <PurchaseProformaModal
          initialData={editingPurchase || undefined}
          onSubmit={async (data) => {
            try {
              const apiData = {
                serial_number: data.serialnumber,
                date: data.date,
                tax: data.tax,
                discount: data.discount,
                supplier: data.supplier,
                lines: data.lines
              };
              if (editingPurchase) {
                await updatePurchaseProforma(editingPurchase.id, apiData);
                toast.success(t("errors.success_update"));
              } else {
                await createPurchaseProforma(apiData);
                toast.success(t("errors.success_create"));
              }
              await loadData();
              setShowPurchaseModal(false);
              setEditingPurchase(null);
            } catch (error) {
              console.error("Error saving purchase proforma:", error);
              toast.error(editingPurchase ? t("errors.update_failed") : t("errors.create_failed"));
            }
          }}
          onClose={() => {
            setShowPurchaseModal(false);
            setEditingPurchase(null);
          }}
        />
      )}
    </div>
  );
}