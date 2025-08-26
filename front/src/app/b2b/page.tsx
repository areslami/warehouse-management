"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Edit2, Trash2, ShoppingCart, TrendingUp, Package, Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { B2BOfferModal } from "@/components/modals/b2b/b2b-offer-modal";
import { B2BDistributionModal } from "@/components/modals/b2b/b2b-distribution-modal";
import { B2BSaleModal } from "@/components/modals/b2b/b2b-sale-modal";
import { UploadDistributionModal } from "@/components/modals/b2b/upload-distribution-modal";
import { B2BOffer, B2BSale, B2BDistribution } from "@/lib/interfaces/b2b";
import {
  fetchB2BOffers, fetchB2BOfferById, createB2BOffer, updateB2BOffer, deleteB2BOffer,
  fetchB2BSales, fetchB2BSaleById, createB2BSale, updateB2BSale, deleteB2BSale,
  fetchB2BDistributions, fetchB2BDistributionById, createB2BDistribution, updateB2BDistribution, deleteB2BDistribution
} from "@/lib/api/b2b";
import { handleApiError } from "@/lib/api/error-handler";
import UploadSaleModal from "@/components/modals/b2b/upload-sale-modal";

export default function B2BPage() {
  const t = useTranslations("pages.b2b");
  const tErrors = useTranslations("errors");
  const tCommon = useTranslations("common");
  const [offers, setOffers] = useState<B2BOffer[]>([]);
  const [sales, setSales] = useState<B2BSale[]>([]);
  const [distributions, setDistributions] = useState<B2BDistribution[]>([]);

  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showDistributionModal, setShowDistributionModal] = useState(false);
  const [showDistributionUploadModal, setShowDistributionUploadModal] = useState(false);
  const [showSaleUploadModal, setShowSaleUploadModal] = useState(false);

  const [editingOffer, setEditingOffer] = useState<B2BOffer | null>(null);
  const [editingSale, setEditingSale] = useState<B2BSale | null>(null);
  const [editingDistribution, setEditingDistribution] = useState<B2BDistribution | null>(null);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<B2BOffer | B2BSale | B2BDistribution | null>(null);
  const [selectedType, setSelectedType] = useState<'offer' | 'distribution' | 'sale'>('offer');

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [offersData, salesData, distributionsData] = await Promise.all([
        fetchB2BOffers(),
        fetchB2BSales(),
        fetchB2BDistributions()
      ]);
      setOffers(offersData);
      setSales(salesData);
      setDistributions(distributionsData);
    } catch (error) {
      console.error("Failed to load B2B data:", error);
      const errorMessage = handleApiError(error, "Load B2B data");
      toast.error(errorMessage);
    }
  };

  const handleRowClick = (item: B2BOffer | B2BSale | B2BDistribution, type: 'offer' | 'distribution' | 'sale') => {
    setSelectedItem(item);
    setSelectedType(type);
    setSheetOpen(true);
  };

  const handleDeleteOffer = async (id: number) => {
    if (confirm(t("confirm_delete_offer"))) {
      try {
        await deleteB2BOffer(id);
        toast.success(tErrors("success_delete"));
        loadData();
      } catch (error) {
        console.error("Failed to delete offer:", error);
        const errorMessage = handleApiError(error, "Delete offer");
        toast.error(errorMessage);
      }
    }
  };

  const handleDeleteSale = async (id: number) => {
    if (confirm(t("confirm_delete_sale"))) {
      try {
        await deleteB2BSale(id);
        toast.success(tErrors("success_delete"));
        loadData();
      } catch (error) {
        console.error("Failed to delete sale:", error);
        const errorMessage = handleApiError(error, "Delete sale");
        toast.error(errorMessage);
      }
    }
  };

  const handleDeleteDistribution = async (id: number) => {
    if (confirm(t("confirm_delete_distribution"))) {
      try {
        await deleteB2BDistribution(id);
        toast.success(tErrors("success_delete"));
        loadData();
      } catch (error) {
        console.error("Failed to delete distribution:", error);
        const errorMessage = handleApiError(error, "Delete distribution");
        toast.error(errorMessage);
      }
    }
  };

  const filteredOffers = useMemo(() => {
    return offers.filter(offer =>
      offer.offer_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (offer.product_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (offer.cottage_number || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [offers, searchTerm]);

  const filteredDistributions = useMemo(() => {
    return distributions.filter(dist =>
      (dist.cottage_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (dist.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (dist.product_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (dist.purchase_id || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [distributions, searchTerm]);

  const filteredSales = useMemo(() => {
    return sales.filter(sale =>
      (sale.purchase_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.allocation_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.product_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.tracking_number || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sales, searchTerm]);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'sold':
        return 'bg-blue-100 text-blue-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex-1 p-6 min-h-screen bg-gray-50" dir="rtl">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">{t("title")}</h1>

      <div className="relative mb-6">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder={t("search")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-10"
        />
      </div>

      <Tabs defaultValue="offers" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="offers" className="data-[state=active]:bg-[#f6d265] data-[state=active]:text-black">
            <ShoppingCart className="w-4 h-4 mr-2" />
            {t("offers_tab")}
          </TabsTrigger>
          <TabsTrigger value="distributions" className="data-[state=active]:bg-[#f6d265] data-[state=active]:text-black">
            <Package className="w-4 h-4 mr-2" />
            {t("distributions_tab")}
          </TabsTrigger>
          <TabsTrigger value="sales" className="data-[state=active]:bg-[#f6d265] data-[state=active]:text-black">
            <TrendingUp className="w-4 h-4 mr-2" />
            {t("sales_tab")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="offers">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-700">{t("offers_title")}</h2>
              <Button
                size="sm"
                className="bg-[#f6d265] hover:bg-[#f5c842] text-black"
                onClick={() => {
                  setEditingOffer(null);
                  setShowOfferModal(true);
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                {t("add_offer")}
              </Button>
            </div>
            <div className="p-4">
              {offers.length === 0 ? (
                <p className="text-gray-500 text-center py-8">{t("no_offers")}</p>
              ) : (
                <Table dir="rtl">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right w-16">{t("id")}</TableHead>
                      <TableHead className="text-right">{t("offer_id")}</TableHead>
                      <TableHead className="text-right">{t("product")}</TableHead>
                      <TableHead className="text-right">{t("weight")}</TableHead>
                      <TableHead className="text-right">{t("unit_price")}</TableHead>
                      <TableHead className="text-right">{t("total_price")}</TableHead>
                      <TableHead className="text-right">{t("status")}</TableHead>
                      <TableHead className="text-right">{t("offer_date")}</TableHead>
                      <TableHead className="text-right">{t("expiry_date")}</TableHead>
                      <TableHead className="text-center w-24">{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOffers.map((offer) => (
                      <TableRow key={offer.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleRowClick(offer, 'offer')}>
                        <TableCell className="font-medium text-right">{offer.id}</TableCell>
                        <TableCell className="truncate max-w-[120px]" title={offer.offer_id}>{offer.offer_id}</TableCell>
                        <TableCell className="truncate max-w-[150px]" title={offer.product_name || `${tCommon('product_labels.product_prefix')} ${offer.product}`}>
                          {offer.product_name || `${tCommon('product_labels.product_prefix')} ${offer.product}`}
                        </TableCell>
                        <TableCell>{offer.offer_weight} {tCommon('units.kg')}</TableCell>
                        <TableCell className="truncate max-w-[100px]">{offer.unit_price.toLocaleString()}</TableCell>
                        <TableCell className="truncate max-w-[120px]">{offer.total_price ? offer.total_price.toLocaleString() : '0'}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(offer.status)}`}>
                            {offer.status === 'active' && tCommon('status.active')}
                            {offer.status === 'pending' && tCommon('status.pending')}
                            {offer.status === 'sold' && tCommon('status.sold')}
                            {offer.status === 'expired' && tCommon('status.expired')}
                          </span>
                        </TableCell>
                        <TableCell>{new Date(offer.offer_date).toLocaleDateString('fa-IR')}</TableCell>
                        <TableCell>{new Date(offer.offer_exp_date).toLocaleDateString('fa-IR')}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex gap-2 justify-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  const fullOffer = await fetchB2BOfferById(offer.id);
                                  setEditingOffer(fullOffer);
                                  setShowOfferModal(true);
                                } catch (error) {
                                  console.error("Failed to fetch offer details:", error);
                                  const errorMessage = handleApiError(error, "Fetch offer details");
                                  toast.error(errorMessage);
                                }
                              }}
                            >
                              <Edit2 className="w-4 h-4 text-gray-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteOffer(offer.id);
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="distributions">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-700">{t("distributions_title")}</h2>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowDistributionUploadModal(true)}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  {t("import_excel")}
                </Button>
                <Button
                  size="sm"
                  className="bg-[#f6d265] hover:bg-[#f5c842] text-black"
                  onClick={() => {
                    setEditingDistribution(null);
                    setShowDistributionModal(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {t("add_distribution")}
                </Button>
              </div>
            </div>
            <div className="p-4">
              {distributions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">{t("no_distributions")}</p>
              ) : (
                <Table dir="rtl">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right w-16">{t("id")}</TableHead>
                      <TableHead className="text-right">{t("purchase_id")}</TableHead>
                      <TableHead className="text-right">{t("cottage_number")}</TableHead>
                      <TableHead className="text-right">{t("offer_id")}</TableHead>
                      <TableHead className="text-right">{t("warehouse")}</TableHead>
                      <TableHead className="text-right">{t("product")}</TableHead>
                      <TableHead className="text-right">{t("customer")}</TableHead>
                      <TableHead className="text-right">{t("agency_weight")}</TableHead>
                      <TableHead className="text-right">{t("agency_date")}</TableHead>
                      <TableHead className="text-center w-24">{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDistributions.map((distribution) => (
                      <TableRow key={distribution.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleRowClick(distribution, 'distribution')}>
                        <TableCell className="font-medium text-right">{distribution.id}</TableCell>
                        <TableCell className="truncate max-w-[100px]" title={distribution.purchase_id || '-'}>{distribution.purchase_id || '-'}</TableCell>
                        <TableCell className="truncate max-w-[80px]" title={distribution.cottage_number || '-'}>{distribution.cottage_number || '-'}</TableCell>
                        <TableCell className="truncate max-w-[100px]" title={distribution.b2b_offer_id || '-'}>{distribution.b2b_offer_id || '-'}</TableCell>
                        <TableCell className="truncate max-w-[120px]" title={distribution.warehouse_name || `${tCommon('product_labels.warehouse_prefix')} ${distribution.warehouse}`}>
                          {distribution.warehouse_name || `${tCommon('product_labels.warehouse_prefix')} ${distribution.warehouse}`}
                        </TableCell>
                        <TableCell className="truncate max-w-[150px]" title={distribution.product_name || `${tCommon('product_labels.product_prefix')} ${distribution.product}`}>
                          {distribution.product_name || `${tCommon('product_labels.product_prefix')} ${distribution.product}`}
                        </TableCell>
                        <TableCell className="truncate max-w-[150px]" title={distribution.customer_name || `${tCommon('product_labels.customer_prefix')} ${distribution.customer}`}>
                          {distribution.customer_name || `${tCommon('product_labels.customer_prefix')} ${distribution.customer}`}
                        </TableCell>
                        <TableCell>{distribution.agency_weight} {tCommon('units.kg')}</TableCell>
                        <TableCell>{new Date(distribution.agency_date).toLocaleDateString('fa-IR')}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex gap-2 justify-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  const fullDistribution = await fetchB2BDistributionById(distribution.id);
                                  setEditingDistribution(fullDistribution);
                                  setShowDistributionModal(true);
                                } catch (error) {
                                  console.error("Failed to fetch distribution details:", error);
                                  const errorMessage = handleApiError(error, "Fetch distribution details");
                                  toast.error(errorMessage);
                                }
                              }}
                            >
                              <Edit2 className="w-4 h-4 text-gray-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDistribution(distribution.id);
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sales">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-700">{t("sales_title")}</h2>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowSaleUploadModal(true)}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  {t("import_excel")}
                </Button>
                <Button
                  size="sm"
                  className="bg-[#f6d265] hover:bg-[#f5c842] text-black"
                  onClick={() => {
                    setEditingSale(null);
                    setShowSaleModal(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {t("add_sale")}
                </Button>
              </div>
            </div>
            <div className="p-4">
              {sales.length === 0 ? (
                <p className="text-gray-500 text-center py-8">{t("no_sales")}</p>
              ) : (
                <Table dir="rtl">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right w-16">{t("id")}</TableHead>
                      <TableHead className="text-right">{t("purchase_id")}</TableHead>
                      <TableHead className="text-right">{t("allocation_id")}</TableHead>
                      <TableHead className="text-right">{t("customer")}</TableHead>
                      <TableHead className="text-right">{t("receiver")}</TableHead>
                      <TableHead className="text-right">{t("product")}</TableHead>
                      <TableHead className="text-right">{t("weight")}</TableHead>
                      <TableHead className="text-right">{t("amount")}</TableHead>
                      <TableHead className="text-right">{t("date")}</TableHead>
                      <TableHead className="text-right">{t("tracking")}</TableHead>
                      <TableHead className="text-center w-24">{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.map((sale) => (
                      <TableRow key={sale.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleRowClick(sale, 'sale')}>
                        <TableCell className="text-right">{sale.id}</TableCell>
                        <TableCell className="text-right truncate max-w-[100px]" title={sale.purchase_id}>
                          {sale.purchase_id}
                        </TableCell>
                        <TableCell className="text-right truncate max-w-[100px]" title={sale.allocation_id || ''}>
                          {sale.allocation_id || '-'}
                        </TableCell>
                        <TableCell className="text-right truncate max-w-[120px]" title={sale.customer_name || ''}>
                          {sale.customer_name || '-'}
                        </TableCell>
                        <TableCell className="text-right truncate max-w-[120px]" title={sale.receiver_name || ''}>
                          {sale.receiver_name || '-'}
                        </TableCell>
                        <TableCell className="text-right truncate max-w-[150px]" title={sale.product_name || ''}>
                          {sale.product_name || '-'}
                        </TableCell>
                        <TableCell className="text-right">{sale.total_weight_purchased}</TableCell>
                        <TableCell className="text-right">{Number(sale.payment_amount).toLocaleString()}</TableCell>
                        <TableCell className="text-right">{new Date(sale.purchase_date).toLocaleDateString('fa-IR')}</TableCell>
                        <TableCell className="text-right truncate max-w-[100px]" title={sale.tracking_number || ''}>
                          {sale.tracking_number || '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex gap-2 justify-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  const fullSale = await fetchB2BSaleById(sale.id);
                                  setEditingSale(fullSale);
                                  setShowSaleModal(true);
                                } catch (error) {
                                  console.error("Failed to fetch sale details:", error);
                                  const errorMessage = handleApiError(error, "Fetch sale details");
                                  toast.error(errorMessage);
                                }
                              }}
                            >
                              <Edit2 className="w-4 h-4 text-gray-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSale(sale.id);
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {showOfferModal && (
        <B2BOfferModal
          initialData={editingOffer || undefined}
          onSubmit={async (data) => {
            try {
              if (editingOffer) {
                await updateB2BOffer(editingOffer.id, data);
                toast.success(tErrors("success_update"));
              } else {
                await createB2BOffer(data);
                toast.success(tErrors("success_create"));
              }
              await loadData();
              setShowOfferModal(false);
              setEditingOffer(null);
            } catch (error) {
              console.error(`Failed to ${editingOffer ? 'update' : 'create'} offer:`, error);
              const errorMessage = handleApiError(error, `${editingOffer ? 'Update' : 'Create'} offer`);
              toast.error(errorMessage);
            }
          }}
          onClose={() => {
            setShowOfferModal(false);
            setEditingOffer(null);
          }}
        />
      )}

      {showDistributionModal && (
        <B2BDistributionModal
          initialData={editingDistribution || undefined}
          onSubmit={async (data) => {
            try {
              if (editingDistribution) {
                await updateB2BDistribution(editingDistribution.id, data);
                toast.success(tErrors("success_update"));
              } else {
                await createB2BDistribution(data);
                toast.success(tErrors("success_create"));
              }
              await loadData();
              setShowDistributionModal(false);
              setEditingDistribution(null);
            } catch (error) {
              console.error(`Failed to ${editingDistribution ? 'update' : 'create'} distribution:`, error);
              const errorMessage = handleApiError(error, `${editingDistribution ? 'Update' : 'Create'} distribution`);
              toast.error(errorMessage);
            }
          }}
          onOfferCreated={loadData}
          onClose={() => {
            setShowDistributionModal(false);
            setEditingDistribution(null);
          }}
        />
      )}

      {showSaleModal && (
        <B2BSaleModal
          initialData={editingSale || undefined}
          offers={offers.map(o => ({ id: o.id, offer_id: o.offer_id, product_name: o.product_name || `${tCommon('product_labels.product_prefix')} ${o.product}` }))}
          onOfferCreated={async () => {
            await loadData(); // Refresh offers list when a new offer is created
          }}
          onSubmit={async (data) => {
            try {
              if (editingSale) {
                await updateB2BSale(editingSale.id, data);
                toast.success(tErrors("success_update"));
              } else {
                await createB2BSale(data);
                toast.success(tErrors("success_create"));
              }
              await loadData();
              setShowSaleModal(false);
              setEditingSale(null);
            } catch (error) {
              console.error(`Failed to ${editingSale ? 'update' : 'create'} sale:`, error);
              const errorMessage = handleApiError(error, `${editingSale ? 'Update' : 'Create'} sale`);
              toast.error(errorMessage);
            }
          }}
          onClose={() => {
            setShowSaleModal(false);
            setEditingSale(null);
          }}
        />
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" className="w-[400px] sm:w-[540px] overflow-y-auto p-6" dir="rtl">
          <SheetHeader>
            <SheetTitle className="text-2xl font-bold text-[#f6d265]">
              {selectedType === 'offer' && t("offer_details")}
              {selectedType === 'distribution' && t("distribution_details")}
              {selectedType === 'sale' && t("sale_details")}
            </SheetTitle>
          </SheetHeader>
          {selectedItem && (
            <>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      if (selectedType === 'offer') {
                        const fullOffer = await fetchB2BOfferById(selectedItem.id);
                        setEditingOffer(fullOffer);
                        setShowOfferModal(true);
                      } else if (selectedType === 'distribution') {
                        const fullDistribution = await fetchB2BDistributionById(selectedItem.id);
                        setEditingDistribution(fullDistribution);
                        setShowDistributionModal(true);
                      } else if (selectedType === 'sale') {
                        const fullSale = await fetchB2BSaleById(selectedItem.id);
                        setEditingSale(fullSale);
                        setShowSaleModal(true);
                      }
                      setSheetOpen(false);
                    } catch (error) {
                      console.error("Failed to fetch details:", error);
                      const errorMessage = handleApiError(error, "Fetch details");
                      toast.error(errorMessage);
                    }
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
                    const confirmMessage = selectedType === 'offer' ? t("confirm_delete_offer") :
                      selectedType === 'distribution' ? t("confirm_delete_distribution") :
                        t("confirm_delete_sale");
                    if (confirm(confirmMessage)) {
                      try {
                        if (selectedType === 'offer' && 'offer_id' in selectedItem) {
                          await deleteB2BOffer(selectedItem.id);
                        } else if (selectedType === 'distribution' && 'agency_weight' in selectedItem) {
                          await deleteB2BDistribution(selectedItem.id);
                        } else if (selectedType === 'sale' && 'purchase_id' in selectedItem) {
                          await deleteB2BSale(selectedItem.id);
                        }
                        toast.success(tErrors("success_delete"));
                        await loadData();
                        setSheetOpen(false);
                      } catch (error) {
                        console.error("Failed to delete:", error);
                        const errorMessage = handleApiError(error, "Delete item");
                        toast.error(errorMessage);
                      }
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 ml-1" />
                  {t("delete")}
                </Button>
              </div>
              <div className="mt-6 space-y-4 p-4 bg-gray-50 rounded-lg">
                {selectedType === 'offer' && (() => {
                  const item = selectedItem as B2BOffer;
                  return (<>
                    <div><strong>{tCommon('detail_labels.offer_id')}</strong> {item.offer_id}</div>
                    <div><strong>{tCommon('detail_labels.product')}</strong> {item.product_name || `${tCommon('product_labels.product_prefix')} ${item.product}`}</div>
                    <div><strong>{tCommon('detail_labels.warehouse_receipt')}</strong> {item.warehouse_receipt_id || item.warehouse_receipt}</div>
                    <div><strong>{tCommon('detail_labels.offer_weight')}</strong> {item.offer_weight} {tCommon('units.kg')}</div>
                    <div><strong>{tCommon('detail_labels.unit_price')}</strong> {item.unit_price.toLocaleString()} {tCommon('units.rial')}</div>
                    <div><strong>{tCommon('detail_labels.total_price')}</strong> {(item.total_price || item.offer_weight * item.unit_price).toLocaleString()} {tCommon('units.rial')}</div>
                    <div><strong>{tCommon('detail_labels.status')}</strong> {
                      item.status === 'active' ? tCommon('status.active') :
                        item.status === 'pending' ? tCommon('status.pending') :
                          item.status === 'sold' ? tCommon('status.sold') : tCommon('status.expired')
                    }</div>
                    <div><strong>{tCommon('detail_labels.offer_date')}</strong> {new Date(item.offer_date).toLocaleDateString('fa-IR')}</div>
                    <div><strong>{tCommon('detail_labels.expiry_date')}</strong> {new Date(item.offer_exp_date).toLocaleDateString('fa-IR')}</div>
                    {item.description && <div><strong>{tCommon('detail_labels.description')}</strong> {item.description}</div>}
                  </>);
                })()}
                {selectedType === 'distribution' && (() => {
                  const item = selectedItem as B2BDistribution;
                  return (
                    <>
                      <div><strong>{tCommon('detail_labels.purchase_id')}</strong> {item.purchase_id || '-'}</div>
                      <div><strong>{tCommon('detail_labels.offer_id')}</strong> {item.b2b_offer_id || '-'}</div>
                      <div><strong>{tCommon('detail_labels.cottage_number')}</strong> {item.cottage_number || '-'}</div>
                      <div><strong>{tCommon('detail_labels.warehouse')}</strong> {item.warehouse_name || `${tCommon('product_labels.warehouse_prefix')} ${item.warehouse}`}</div>
                      <div><strong>{tCommon('detail_labels.product')}</strong> {item.product_name || `${tCommon('product_labels.product_prefix')} ${item.product}`}</div>
                      <div><strong>{tCommon('detail_labels.customer')}</strong> {item.customer_name || `${tCommon('product_labels.customer_prefix')} ${item.customer}`}</div>
                      <div><strong>{tCommon('detail_labels.agency_weight')}</strong> {item.agency_weight} {tCommon('units.kg')}</div>
                      <div><strong>{tCommon('detail_labels.agency_date')}</strong> {new Date(item.agency_date).toLocaleDateString('fa-IR')}</div>
                      {item.description && <div><strong>{tCommon('detail_labels.description')}</strong> {item.description}</div>}
                    </>);
                })()}
                {selectedType === 'sale' && (() => {
                  const item = selectedItem as B2BSale;
                  return (
                    <>
                      <div><strong>{tCommon('detail_labels.purchase_id')}</strong> {item.purchase_id}</div>
                      <div><strong>{tCommon('detail_labels.allocation_id')}</strong> {item.allocation_id || '-'}</div>
                      <div><strong>{tCommon('detail_labels.customer')}</strong> {item.customer_name || '-'}</div>
                      <div><strong>{tCommon('detail_labels.receiver')}</strong> {item.receiver_name || '-'}</div>
                      <div><strong>{tCommon('detail_labels.product')}</strong> {item.product_name || '-'}</div>
                      <div><strong>{tCommon('detail_labels.weight')}</strong> {item.total_weight_purchased} {tCommon('units.kg')}</div>
                      <div><strong>{tCommon('detail_labels.unit_price')}</strong> {item.unit_price ? Number(item.unit_price).toLocaleString() : '0'} {tCommon('units.rial')}</div>
                      <div><strong>{tCommon('detail_labels.payment_amount')}</strong> {item.payment_amount ? Number(item.payment_amount).toLocaleString() : '0'} {tCommon('units.rial')}</div>
                      <div><strong>{tCommon('detail_labels.payment_method')}</strong> {item.payment_method || '-'}</div>
                      <div><strong>{tCommon('detail_labels.purchase_date')}</strong> {new Date(item.purchase_date).toLocaleDateString('fa-IR')}</div>
                      <div><strong>{tCommon('detail_labels.province')}</strong> {item.province || '-'}</div>
                      <div><strong>{tCommon('detail_labels.city')}</strong> {item.city || '-'}</div>
                      <div><strong>{tCommon('detail_labels.tracking_number')}</strong> {item.tracking_number || '-'}</div>
                      {item.credit_description && <div><strong>{tCommon('detail_labels.description')}</strong> {item.credit_description}</div>}
                    </>);
                })()}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {showDistributionUploadModal && (
        <UploadDistributionModal
          open={showDistributionUploadModal}
          onClose={() => setShowDistributionUploadModal(false)}
          onSuccess={() => {
            loadData();
            setShowDistributionUploadModal(false);
          }}
        />
      )}
      {showSaleUploadModal && (
        <UploadSaleModal
          isOpen={showSaleUploadModal}
          onClose={() => setShowSaleUploadModal(false)}
          onSuccess={() => {
            loadData();
            setShowSaleUploadModal(false);
          }}
        />
      )}
    </div>
  );
}