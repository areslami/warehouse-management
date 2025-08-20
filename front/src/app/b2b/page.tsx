"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Edit2, Trash2, ShoppingCart, TrendingUp, Package, Search } from "lucide-react";
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
import { B2BOffer, B2BSale, B2BDistribution } from "@/lib/interfaces/b2b";
import {
  fetchB2BOffers, fetchB2BOfferById, createB2BOffer, updateB2BOffer, deleteB2BOffer,
  fetchB2BSales, fetchB2BSaleById, createB2BSale, updateB2BSale, deleteB2BSale,
  fetchB2BDistributions, fetchB2BDistributionById, createB2BDistribution, updateB2BDistribution, deleteB2BDistribution
} from "@/lib/api/b2b";

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

  const [editingOffer, setEditingOffer] = useState<B2BOffer | null>(null);
  const [editingSale, setEditingSale] = useState<B2BSale | null>(null);
  const [editingDistribution, setEditingDistribution] = useState<B2BDistribution | null>(null);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<B2BOffer | B2BSale | B2BDistribution | null>(null);
  const [selectedType, setSelectedType] = useState<'offer' | 'distribution' | 'sale'>('offer');

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  });

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
      console.error("Error loading B2B data:", error);
      toast.error(tErrors("fetch_failed"));
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
        console.error("Error deleting offer:", error);
        toast.error(tErrors("delete_failed"));
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
        console.error("Error deleting sale:", error);
        toast.error(tErrors("delete_failed"));
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
        console.error("Error deleting distribution:", error);
        toast.error(tErrors("delete_failed"));
      }
    }
  };

  const filteredOffers = useMemo(() => {
    return offers.filter(offer =>
      offer.offer_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (offer.product_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [offers, searchTerm]);

  const filteredDistributions = useMemo(() => {
    return distributions.filter(dist =>
      (dist.cottage_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (dist.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (dist.product_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [distributions, searchTerm]);

  const filteredSales = useMemo(() => {
    return sales.filter(sale =>
      (sale.cottage_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.product_title || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sales, searchTerm]);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Sold':
        return 'bg-blue-100 text-blue-800';
      case 'Expired':
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center">{t("actions")}</TableHead>
                      <TableHead className="text-right">{t("offer_id")}</TableHead>
                      <TableHead className="text-right">{t("product")}</TableHead>
                      <TableHead className="text-right">{t("weight")}</TableHead>
                      <TableHead className="text-right">{t("unit_price")}</TableHead>
                      <TableHead className="text-right">{t("total_price")}</TableHead>
                      <TableHead className="text-right">{t("status")}</TableHead>
                      <TableHead className="text-right">{t("offer_date")}</TableHead>
                      <TableHead className="text-right">{t("expiry_date")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOffers.map((offer) => (
                      <TableRow key={offer.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleRowClick(offer, 'offer')}>
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
                                  console.error("Error fetching offer details:", error);
                                  toast.error(tErrors("fetch_failed"));
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
                        <TableCell className="font-medium">{offer.offer_id}</TableCell>
                        <TableCell>{offer.product_name || `${tCommon('product_labels.product_prefix')} ${offer.product}`}</TableCell>
                        <TableCell>{offer.offer_weight} {tCommon('units.kg')}</TableCell>
                        <TableCell>{offer.unit_price.toLocaleString()} {tCommon('units.rial')}</TableCell>
                        <TableCell>{offer.total_price ? offer.total_price.toLocaleString() : '0'} {tCommon('units.rial')}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(offer.status)}`}>
                            {offer.status === 'Active' && tCommon('status.active')}
                            {offer.status === 'Pending' && tCommon('status.pending')}
                            {offer.status === 'Sold' && tCommon('status.sold')}
                            {offer.status === 'Expired' && tCommon('status.expired')}
                          </span>
                        </TableCell>
                        <TableCell>{new Date(offer.offer_date).toLocaleDateString('fa-IR')}</TableCell>
                        <TableCell>{new Date(offer.offer_exp_date).toLocaleDateString('fa-IR')}</TableCell>
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
            <div className="p-4">
              {distributions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">{t("no_distributions")}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center">{t("actions")}</TableHead>
                      <TableHead className="text-right">{t("cottage_number")}</TableHead>
                      <TableHead className="text-right">{t("warehouse")}</TableHead>
                      <TableHead className="text-right">{t("product")}</TableHead>
                      <TableHead className="text-right">{t("customer")}</TableHead>
                      <TableHead className="text-right">{t("agency_weight")}</TableHead>
                      <TableHead className="text-right">{t("agency_date")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDistributions.map((distribution) => (
                      <TableRow key={distribution.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleRowClick(distribution, 'distribution')}>
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
                                  console.error("Error fetching distribution details:", error);
                                  toast.error(tErrors("fetch_failed"));
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
                        <TableCell className="font-medium">{distribution.cottage_number || '-'}</TableCell>
                        <TableCell>{distribution.warehouse_name || `${tCommon('product_labels.warehouse_prefix')} ${distribution.warehouse}`}</TableCell>
                        <TableCell>{distribution.product_name || `${tCommon('product_labels.product_prefix')} ${distribution.product}`}</TableCell>
                        <TableCell>{distribution.customer_name || `${tCommon('product_labels.customer_prefix')} ${distribution.customer}`}</TableCell>
                        <TableCell>{distribution.agency_weight} {tCommon('units.kg')}</TableCell>
                        <TableCell>{new Date(distribution.agency_date).toLocaleDateString('fa-IR')}</TableCell>
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
            <div className="p-4">
              {sales.length === 0 ? (
                <p className="text-gray-500 text-center py-8">{t("no_sales")}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center">{t("actions")}</TableHead>
                      <TableHead className="text-right">{t("cottage_number")}</TableHead>
                      <TableHead className="text-right">{t("product_title")}</TableHead>
                      <TableHead className="text-right">{t("total_weight")}</TableHead>
                      <TableHead className="text-right">{t("sold_weight")}</TableHead>
                      <TableHead className="text-right">{t("remaining_weight")}</TableHead>
                      <TableHead className="text-right">{t("sale_status")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.map((sale) => (
                      <TableRow key={sale.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleRowClick(sale, 'sale')}>
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
                                  console.error("Error fetching sale details:", error);
                                  toast.error(tErrors("fetch_failed"));
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
                        <TableCell className="font-medium">{sale.cottage_number || '-'}</TableCell>
                        <TableCell>{sale.product_title || `${tCommon('product_labels.offer_prefix')} ${sale.product_offer}`}</TableCell>
                        <TableCell>{sale.total_offer_weight || 0} {tCommon('units.kg')}</TableCell>
                        <TableCell>{sale.sold_weight_before_transport || 0} {tCommon('units.kg')}</TableCell>
                        <TableCell>{sale.remaining_weight_before_transport || 0} {tCommon('units.kg')}</TableCell>
                        <TableCell>{sale.offer_status || tCommon('status.unknown')}</TableCell>
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
              console.error("Error saving offer:", error);
              toast.error(editingOffer ? tErrors("update_failed") : tErrors("create_failed"));
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
              console.error("Error saving distribution:", error);
              toast.error(editingDistribution ? tErrors("update_failed") : tErrors("create_failed"));
            }
          }}
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
              console.error("Error saving sale:", error);
              toast.error(editingSale ? tErrors("update_failed") : tErrors("create_failed"));
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
                      console.error("Error fetching details:", error);
                      toast.error(tErrors("fetch_failed"));
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
                        } else if (selectedType === 'sale' && 'product_offer' in selectedItem) {
                          await deleteB2BSale(selectedItem.id);
                        }
                        toast.success(tErrors("success_delete"));
                        await loadData();
                        setSheetOpen(false);
                      } catch (error) {
                        console.error("Error deleting:", error);
                        toast.error(tErrors("delete_failed"));
                      }
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 ml-1" />
                  {t("delete")}
                </Button>
              </div>
              <div className="mt-6 space-y-4 p-4 bg-gray-50 rounded-lg">
                {selectedType === 'offer' && (
                  <>
                    <div><strong>{tCommon('detail_labels.offer_id')}</strong> {selectedItem.offer_id}</div>
                    <div><strong>{tCommon('detail_labels.product')}</strong> {selectedItem.product_name || `${tCommon('product_labels.product_prefix')} ${selectedItem.product}`}</div>
                    <div><strong>{tCommon('detail_labels.warehouse_receipt')}</strong> {selectedItem.warehouse_receipt_id || selectedItem.warehouse_receipt}</div>
                    <div><strong>{tCommon('detail_labels.offer_weight')}</strong> {selectedItem.offer_weight} {tCommon('units.kg')}</div>
                    <div><strong>{tCommon('detail_labels.unit_price')}</strong> {selectedItem.unit_price.toLocaleString()} {tCommon('units.rial')}</div>
                    <div><strong>{tCommon('detail_labels.total_price')}</strong> {(selectedItem.total_price || selectedItem.offer_weight * selectedItem.unit_price).toLocaleString()} {tCommon('units.rial')}</div>
                    <div><strong>{tCommon('detail_labels.status')}</strong> {
                      selectedItem.status === 'Active' ? tCommon('status.active') :
                        selectedItem.status === 'Pending' ? tCommon('status.pending') :
                          selectedItem.status === 'Sold' ? tCommon('status.sold') : tCommon('status.expired')
                    }</div>
                    <div><strong>{tCommon('detail_labels.offer_date')}</strong> {new Date(selectedItem.offer_date).toLocaleDateString('fa-IR')}</div>
                    <div><strong>{tCommon('detail_labels.expiry_date')}</strong> {new Date(selectedItem.offer_exp_date).toLocaleDateString('fa-IR')}</div>
                    {selectedItem.description && <div><strong>{tCommon('detail_labels.description')}</strong> {selectedItem.description}</div>}
                  </>
                )}
                {selectedType === 'distribution' && (
                  <>
                    <div><strong>{tCommon('detail_labels.cottage_number')}</strong> {selectedItem.cottage_number || '-'}</div>
                    <div><strong>{tCommon('detail_labels.warehouse')}</strong> {selectedItem.warehouse_name || `${tCommon('product_labels.warehouse_prefix')} ${selectedItem.warehouse}`}</div>
                    <div><strong>{tCommon('detail_labels.product')}</strong> {selectedItem.product_name || `${tCommon('product_labels.product_prefix')} ${selectedItem.product}`}</div>
                    <div><strong>{tCommon('detail_labels.customer')}</strong> {selectedItem.customer_name || `${tCommon('product_labels.customer_prefix')} ${selectedItem.customer}`}</div>
                    <div><strong>{tCommon('detail_labels.agency_weight')}</strong> {selectedItem.agency_weight} {tCommon('units.kg')}</div>
                    <div><strong>{tCommon('detail_labels.agency_date')}</strong> {new Date(selectedItem.agency_date).toLocaleDateString('fa-IR')}</div>
                    {selectedItem.description && <div><strong>{tCommon('detail_labels.description')}</strong> {selectedItem.description}</div>}
                  </>
                )}
                {selectedType === 'sale' && (
                  <>
                    <div><strong>{tCommon('detail_labels.cottage_number')}</strong> {selectedItem.cottage_number || '-'}</div>
                    <div><strong>{tCommon('detail_labels.product_title')}</strong> {selectedItem.product_title || `${tCommon('product_labels.offer_prefix')} ${selectedItem.product_offer}`}</div>
                    <div><strong>{tCommon('detail_labels.total_offer_weight')}</strong> {selectedItem.total_offer_weight || 0} {tCommon('units.kg')}</div>
                    <div><strong>{tCommon('detail_labels.sold_weight_before_transport')}</strong> {selectedItem.sold_weight_before_transport || 0} {tCommon('units.kg')}</div>
                    <div><strong>{tCommon('detail_labels.remaining_weight_before_transport')}</strong> {selectedItem.remaining_weight_before_transport || 0} {tCommon('units.kg')}</div>
                    {selectedItem.sold_weight_after_transport && (
                      <div><strong>{tCommon('detail_labels.sold_weight_after_transport')}</strong> {selectedItem.sold_weight_after_transport} {tCommon('units.kg')}</div>
                    )}
                    {selectedItem.remaining_weight_after_transport && (
                      <div><strong>{tCommon('detail_labels.remaining_weight_after_transport')}</strong> {selectedItem.remaining_weight_after_transport} {tCommon('units.kg')}</div>
                    )}
                    <div><strong>{tCommon('detail_labels.offer_status')}</strong> {selectedItem.offer_status || tCommon('status.unknown')}</div>
                    {selectedItem.entry_customs && <div><strong>{tCommon('detail_labels.entry_customs')}</strong> {selectedItem.entry_customs}</div>}
                    {selectedItem.description && <div><strong>{tCommon('detail_labels.description')}</strong> {selectedItem.description}</div>}
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}