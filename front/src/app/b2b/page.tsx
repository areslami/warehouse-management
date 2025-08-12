"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, ShoppingCart, TrendingUp, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { B2BOfferModal } from "@/components/modals/b2b-offer-modal";
import { B2BDistributionModal } from "@/components/modals/b2b-distribution-modal";
import { B2BSaleModal } from "@/components/modals/b2b-sale-modal";
import { B2BOffer, B2BSale, B2BDistribution } from "@/lib/interfaces/b2b";
import {
  fetchB2BOffers, createB2BOffer, updateB2BOffer, deleteB2BOffer,
  fetchB2BSales, createB2BSale, updateB2BSale, deleteB2BSale,
  fetchB2BDistributions, createB2BDistribution, updateB2BDistribution, deleteB2BDistribution
} from "@/lib/api/b2b";

export default function B2BPage() {
  const t = useTranslations("b2b_page");
  const [offers, setOffers] = useState<B2BOffer[]>([]);
  const [sales, setSales] = useState<B2BSale[]>([]);
  const [distributions, setDistributions] = useState<B2BDistribution[]>([]);
  
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showDistributionModal, setShowDistributionModal] = useState(false);
  
  const [editingOffer, setEditingOffer] = useState<B2BOffer | null>(null);
  const [editingSale, setEditingSale] = useState<B2BSale | null>(null);
  const [editingDistribution, setEditingDistribution] = useState<B2BDistribution | null>(null);

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
      console.error("Error loading B2B data:", error);
    }
  };

  const handleDeleteOffer = async (id: number) => {
    if (confirm(t("confirm_delete_offer"))) {
      await deleteB2BOffer(id);
      loadData();
    }
  };

  const handleDeleteSale = async (id: number) => {
    if (confirm(t("confirm_delete_sale"))) {
      await deleteB2BSale(id);
      loadData();
    }
  };

  const handleDeleteDistribution = async (id: number) => {
    if (confirm(t("confirm_delete_distribution"))) {
      await deleteB2BDistribution(id);
      loadData();
    }
  };

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
                      <TableHead className="text-right">{t("offer_id")}</TableHead>
                      <TableHead className="text-right">{t("product")}</TableHead>
                      <TableHead className="text-right">{t("weight")}</TableHead>
                      <TableHead className="text-right">{t("unit_price")}</TableHead>
                      <TableHead className="text-right">{t("total_price")}</TableHead>
                      <TableHead className="text-right">{t("status")}</TableHead>
                      <TableHead className="text-right">{t("offer_date")}</TableHead>
                      <TableHead className="text-right">{t("expiry_date")}</TableHead>
                      <TableHead className="text-center">{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {offers.map((offer) => (
                      <TableRow key={offer.id}>
                        <TableCell className="font-medium">{offer.offer_id}</TableCell>
                        <TableCell>{offer.product_name || `محصول ${offer.product}`}</TableCell>
                        <TableCell>{offer.offer_weight} کیلوگرم</TableCell>
                        <TableCell>{offer.unit_price.toLocaleString()} ریال</TableCell>
                        <TableCell>{offer.total_price ? offer.total_price.toLocaleString() : '0'} ریال</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(offer.status)}`}>
                            {offer.status === 'Active' && 'فعال'}
                            {offer.status === 'Pending' && 'در انتظار'}
                            {offer.status === 'Sold' && 'فروخته شده'}
                            {offer.status === 'Expired' && 'منقضی'}
                          </span>
                        </TableCell>
                        <TableCell>{new Date(offer.offer_date).toLocaleDateString('fa-IR')}</TableCell>
                        <TableCell>{new Date(offer.offer_exp_date).toLocaleDateString('fa-IR')}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex gap-2 justify-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingOffer(offer);
                                setShowOfferModal(true);
                              }}
                            >
                              <Edit2 className="w-4 h-4 text-gray-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteOffer(offer.id)}
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
                      <TableHead className="text-right">{t("cottage_number")}</TableHead>
                      <TableHead className="text-right">{t("warehouse")}</TableHead>
                      <TableHead className="text-right">{t("product")}</TableHead>
                      <TableHead className="text-right">{t("customer")}</TableHead>
                      <TableHead className="text-right">{t("agency_weight")}</TableHead>
                      <TableHead className="text-right">{t("agency_date")}</TableHead>
                      <TableHead className="text-center">{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {distributions.map((distribution) => (
                      <TableRow key={distribution.id}>
                        <TableCell className="font-medium">{distribution.cottage_number || '-'}</TableCell>
                        <TableCell>{distribution.warehouse_name || `انبار ${distribution.warehouse}`}</TableCell>
                        <TableCell>{distribution.product_name || `محصول ${distribution.product}`}</TableCell>
                        <TableCell>{distribution.customer_name || `مشتری ${distribution.customer}`}</TableCell>
                        <TableCell>{distribution.agency_weight} کیلوگرم</TableCell>
                        <TableCell>{new Date(distribution.agency_date).toLocaleDateString('fa-IR')}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex gap-2 justify-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingDistribution(distribution);
                                setShowDistributionModal(true);
                              }}
                            >
                              <Edit2 className="w-4 h-4 text-gray-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteDistribution(distribution.id)}
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
                      <TableHead className="text-right">{t("cottage_number")}</TableHead>
                      <TableHead className="text-right">{t("product_title")}</TableHead>
                      <TableHead className="text-right">{t("total_weight")}</TableHead>
                      <TableHead className="text-right">{t("sold_weight")}</TableHead>
                      <TableHead className="text-right">{t("remaining_weight")}</TableHead>
                      <TableHead className="text-right">{t("sale_status")}</TableHead>
                      <TableHead className="text-center">{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-medium">{sale.cottage_number || '-'}</TableCell>
                        <TableCell>{sale.product_title || `عرضه ${sale.product_offer}`}</TableCell>
                        <TableCell>{sale.total_offer_weight || 0} کیلوگرم</TableCell>
                        <TableCell>{sale.sold_weight_before_transport || 0} کیلوگرم</TableCell>
                        <TableCell>{sale.remaining_weight_before_transport || 0} کیلوگرم</TableCell>
                        <TableCell>{sale.offer_status || 'نامشخص'}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex gap-2 justify-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingSale(sale);
                                setShowSaleModal(true);
                              }}
                            >
                              <Edit2 className="w-4 h-4 text-gray-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteSale(sale.id)}
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
            if (editingOffer) {
              await updateB2BOffer(editingOffer.id, data);
            } else {
              await createB2BOffer(data);
            }
            await loadData();
            setShowOfferModal(false);
            setEditingOffer(null);
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
            if (editingDistribution) {
              await updateB2BDistribution(editingDistribution.id, data);
            } else {
              await createB2BDistribution(data);
            }
            await loadData();
            setShowDistributionModal(false);
            setEditingDistribution(null);
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
          offers={offers.map(o => ({ id: o.id, offer_id: o.offer_id, product_name: o.product_name || `محصول ${o.product}` }))}
          onSubmit={async (data) => {
            if (editingSale) {
              await updateB2BSale(editingSale.id, data);
            } else {
              await createB2BSale(data);
            }
            await loadData();
            setShowSaleModal(false);
            setEditingSale(null);
          }}
          onClose={() => {
            setShowSaleModal(false);
            setEditingSale(null);
          }}
        />
      )}
    </div>
  );
}