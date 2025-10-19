"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, Edit2, Trash2, ShoppingCart, TrendingUp, Package, Search, Upload, Eye, ChevronDown, ChevronUp, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { SALE_DISTRIBUTOR_HEADERS, SALE_YOUR_HEADERS, ADDRESS_HEADERS } from "@/lib/excel-mappings";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { B2BOfferModal } from "@/components/modals/b2b/b2b-offer-modal";
import { B2BDistributionModal } from "@/components/modals/b2b/b2b-distribution-modal";
import { B2BAddressModal } from "@/components/modals/b2b/b2b-address-modal";
import { B2BSaleModal } from "@/components/modals/b2b/b2b-sale-modal";
import { UploadSaleModal } from "@/components/modals/b2b/upload-sale-modal";
import { SalesProformaModal } from "@/components/modals/finance/salesproforma-modal";
import { B2BOffer, B2BAddress, B2BDistribution, B2BSale } from "@/lib/interfaces/b2b";
import type { Product } from "@/lib/interfaces/core";
import type { Customer } from "@/lib/interfaces/core";
import {
  fetchB2BOffers, fetchB2BOfferById, createB2BOffer, updateB2BOffer, deleteB2BOffer,
  fetchB2BAddresss, fetchB2BAddressById, createB2BAddress, updateB2BAddress, deleteB2BAddress,
  fetchB2BDistributions, fetchB2BDistributionById, createB2BDistribution, updateB2BDistribution, deleteB2BDistribution,
  fetchB2BSales, fetchB2BSaleById, createB2BSale, updateB2BSale, deleteB2BSale
} from "@/lib/api/b2b";
import { fetchCustomers, fetchReceivers, fetchProducts } from "@/lib/api/core";
import { fetchSalesProformaById } from "@/lib/api/finance";
import { handleApiErrorWithToast } from "@/lib/api/error-toast-handler";
import { formatNumber } from "@/lib/utils/number-format";
import UploadAddressModal from "@/components/modals/b2b/upload-address-modal";
import { da } from "zod/v4/locales";
import { SimpleCombobox } from "@/components/ui/simple-combobox";

export default function B2BPage() {
  const t = useTranslations("pages.b2b");
  const tErrors = useTranslations("errors");
  const tCommon = useTranslations("common");
  const [offers, setOffers] = useState<B2BOffer[]>([]);
  const [addresses, setAddresses] = useState<B2BAddress[]>([]);
  const [distributions, setDistributions] = useState<B2BDistribution[]>([]);
  const [sales, setSales] = useState<B2BSale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [receivers, setReceivers] = useState<import("@/lib/interfaces/core").Receiver[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedOffers, setSelectedOffers] = useState<number[]>([]);
  const [selectedAddresses, setSelectedAddresses] = useState<number[]>([]);
  const [selectedDistributions, setSelectedDistributions] = useState<number[]>([]);
  const [selectedSales, setSelectedSales] = useState<number[]>([]);
  const [offersFiltersOpen, setOffersFiltersOpen] = useState(false)
  const [distributionsFiltersOpen, setDistributionsFiltersOpen] = useState(false)
  const [salesFiltersOpen, setSalesFiltersOpen] = useState(false)
  const [addressesFiltersOpen, setAddressesFiltersOpen] = useState(false)
  const [salesFilters, setSalesFilters] = useState({
    purchase_id: "",
    offer_id: "",
    product_id: "",
    customer_name: "",
    purchase_type: "",
    date_from: "",
    date_to: "",
    weight_min: "",
    weight_max: "",
    unit_price_min: "",
    unit_price_max: "",
    total_price_min: "",
    total_price_max: "",
    distribution_id: "",
    export_type: "your_sale" as "your_sale" | "distributor_sale",
  });
  const [addressFilters, setAddressFilters] = useState({
    purchase_id: "",
    allocation_id: "",
    tracking_number: "",
    product_name: "",
    customer_name: "",
    receiver_name: "",
    province: "",
    city: "",
    payment_method: "",
    date_from: "",
    date_to: "",
    weight_min: "",
    weight_max: "",
    unit_price_min: "",
    unit_price_max: "",
    payment_amount_min: "",
    payment_amount_max: "",
  });
  const [offerFilters, setOfferFilters] = useState({
    offer_id: "",
    status: "",
    offer_type: "",
    offer_date_from: "",
    offer_date_to: "",
    offer_exp_date_from: "",
    offer_exp_date_to: "",
    warehouse_receipt_id: "",
    offer_weight_min: "",
    offer_weight_max: "",
    unit_price_min: "",
    unit_price_max: "",
    total_price_min: "",
    total_price_max: "",
  });
  const [distributionFilters, setDistributionFilters] = useState({
    transfer_id: "",
    warehouse_receipt_id: "",
    customer_name: "",
    product_name: "",
    date_from: "",
    date_to: "",
    weight_min: "",
    weight_max: "",
  });

  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showDistributionModal, setShowDistributionModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showDistributionUploadModal, setShowDistributionUploadModal] = useState(false);
  const [showAddressUploadModal, setShowAddressUploadModal] = useState(false);
  const [showProformaModal, setShowProformaModal] = useState(false);
  const [viewingProformaId, setViewingProformaId] = useState<number | null>(null);
  const [viewingProformaData, setViewingProformaData] = useState<any>(null);

  const [editingOffer, setEditingOffer] = useState<B2BOffer | null>(null);
  const [editingAddress, setEditingAddress] = useState<B2BAddress | null>(null);
  const [editingDistribution, setEditingDistribution] = useState<B2BDistribution | null>(null);
  const [editingSale, setEditingSale] = useState<B2BSale | null>(null);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<B2BOffer | B2BAddress | B2BDistribution | B2BSale | null>(null);
  const [selectedType, setSelectedType] = useState<'offer' | 'distribution' | 'address' | 'sale'>('offer');

  const [searchTerm, setSearchTerm] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabFromUrl = searchParams.get('tab') || 'offers';
  const [activeTab, setActiveTab] = useState(tabFromUrl);

  useEffect(() => {
    const newTab = searchParams.get('tab') || 'offers';
    setActiveTab(newTab);
  }, [searchParams]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [offersData, addressesData, distributionsData, salesData, customersData, receiversData, productsData] = await Promise.all([
        fetchB2BOffers(),
        fetchB2BAddresss(),
        fetchB2BDistributions(),
        fetchB2BSales(),
        fetchCustomers(),
        fetchReceivers(),
        fetchProducts(),
      ]);
      setOffers(offersData);
      setAddresses(addressesData);
      setDistributions(distributionsData);
      setSales(salesData);
      setCustomers(customersData);
      setReceivers(receiversData);
      setProducts(productsData);
    } catch (error) {
      console.error("Failed to load B2B data:", error);
      handleApiErrorWithToast(error, "Load B2B data");

    }
  };

  const handleRowClick = async (item: B2BOffer | B2BAddress | B2BDistribution | B2BSale, type: 'offer' | 'distribution' | 'address' | 'sale') => {
    try {
      let fullItem;
      // Fetch complete data from API to ensure all fields are present
      if (type === 'offer') {
        fullItem = await fetchB2BOfferById(item.id);
      } else if (type === 'address') {
        fullItem = await fetchB2BAddressById(item.id);
      } else if (type === 'distribution') {
        fullItem = await fetchB2BDistributionById(item.id);
      } else if (type === 'sale') {
        fullItem = await fetchB2BSaleById(item.id);
      }

      setSelectedItem(fullItem || item);
      setSelectedType(type);
      setSheetOpen(true);
    } catch (error) {
      console.error("Failed to fetch full item details:", error);
      // Fallback to the basic item data
      setSelectedItem(item);
      setSelectedType(type);
      setSheetOpen(true);
    }
  };

  const handleDeleteOffer = async (id: number) => {
    if (confirm(t("confirm_delete_offer"))) {
      try {
        await deleteB2BOffer(id);
        setOffers(offers.filter(o => o.id !== id));
        toast.success(tErrors("success_delete"));
        // Clear selection if this item was selected
        if (selectedOffers.includes(id)) {
          setSelectedOffers(selectedOffers.filter(selectedId => selectedId !== id));
        }
      } catch (error) {
        console.error("Failed to delete offer:", error);
        handleApiErrorWithToast(error, "Delete offer");

      }
    }
  };

  const handleBulkDeleteOffers = async () => {
    if (selectedOffers.length === 0) return;
    const confirmMessage = t("confirm_delete_multiple", { count: selectedOffers.length });
    if (confirm(confirmMessage)) {
      try {
        const deletePromises = selectedOffers.map(id => deleteB2BOffer(id));
        const results = await Promise.allSettled(deletePromises);

        const successCount = results.filter(r => r.status === 'fulfilled').length;
        const failedCount = results.filter(r => r.status === 'rejected').length;

        if (successCount > 0) {
          // Remove successfully deleted items from state
          const successfulIds = selectedOffers.filter((id, index) => results[index].status === 'fulfilled');
          setOffers(offers.filter(o => !successfulIds.includes(o.id)));

          // Show success message
          toast.success(t("bulk_delete_success", { count: successCount }));
        }

        if (failedCount > 0) {
          toast.error(t("bulk_delete_failed"));
        }

        setSelectedOffers([]);
      } catch (error) {
        console.error("Bulk delete error:", error);
        toast.error(t("bulk_delete_failed"));
      }
    }
  };

  const handleDeleteAddress = async (id: number) => {
    if (confirm(t("confirm_delete_address"))) {
      try {
        await deleteB2BAddress(id);
        setAddresses(addresses.filter(a => a.id !== id));
        toast.success(tErrors("success_delete"));
        if (selectedAddresses.includes(id)) {
          setSelectedAddresses(selectedAddresses.filter(selectedId => selectedId !== id));
        }
      } catch (error) {
        console.error("Failed to delete address:", error);
        handleApiErrorWithToast(error, "Delete address");

      }
    }
  };

  const handleBulkDeleteAddresses = async () => {
    if (selectedAddresses.length === 0) return;
    const confirmMessage = t("confirm_delete_multiple", { count: selectedAddresses.length });
    if (confirm(confirmMessage)) {
      try {
        const deletePromises = selectedAddresses.map(id => deleteB2BAddress(id));
        const results = await Promise.allSettled(deletePromises);

        const successCount = results.filter(r => r.status === 'fulfilled').length;
        const failedCount = results.filter(r => r.status === 'rejected').length;

        if (successCount > 0) {
          const successfulIds = selectedAddresses.filter((id, index) => results[index].status === 'fulfilled');
          setAddresses(addresses.filter(a => !successfulIds.includes(a.id)));

          toast.success(t("bulk_delete_success", { count: successCount }));
        }

        if (failedCount > 0) {
          toast.error(t("bulk_delete_failed"));
        }

        setSelectedAddresses([]);
      } catch (error) {
        console.error("Bulk delete error:", error);
        toast.error(t("bulk_delete_failed"));
      }
    }
  };

  const handleDeleteDistribution = async (id: number) => {
    if (confirm(t("confirm_delete_distribution"))) {
      try {
        await deleteB2BDistribution(id);
        setDistributions(distributions.filter(d => d.id !== id));
        toast.success(tErrors("success_delete"));
        if (selectedDistributions.includes(id)) {
          setSelectedDistributions(selectedDistributions.filter(selectedId => selectedId !== id));
        }
      } catch (error) {
        console.error("Failed to delete distribution:", error);
        handleApiErrorWithToast(error, "Delete distribution");

      }
    }
  };

  const handleBulkDeleteDistributions = async () => {
    if (selectedDistributions.length === 0) return;
    const confirmMessage = t("confirm_delete_multiple", { count: selectedDistributions.length });
    if (confirm(confirmMessage)) {
      try {
        const deletePromises = selectedDistributions.map(id => deleteB2BDistribution(id));
        const results = await Promise.allSettled(deletePromises);

        const successCount = results.filter(r => r.status === 'fulfilled').length;
        const failedCount = results.filter(r => r.status === 'rejected').length;

        if (successCount > 0) {
          const successfulIds = selectedDistributions.filter((id, index) => results[index].status === 'fulfilled');
          setDistributions(distributions.filter(d => !successfulIds.includes(d.id)));

          toast.success(t("bulk_delete_success", { count: successCount }));
        }

        if (failedCount > 0) {
          toast.error(t("bulk_delete_failed"));
        }

        setSelectedDistributions([]);
      } catch (error) {
        console.error("Bulk delete error:", error);
        toast.error(t("bulk_delete_failed"));
      }
    }
  };

  const handleDeleteSale = async (id: number) => {
    if (confirm(t("confirm_delete_sale"))) {
      try {
        await deleteB2BSale(id);
        setSales(sales.filter(s => s.id !== id));
        toast.success(tErrors("success_delete"));
        if (selectedSales.includes(id)) {
          setSelectedSales(selectedSales.filter(selectedId => selectedId !== id));
        }
      } catch (error) {
        console.error("Failed to delete sale:", error);
        handleApiErrorWithToast(error, "Delete sale");

      }
    }
  };

  const handleBulkDeleteSales = async () => {
    if (selectedSales.length === 0) return;
    const confirmMessage = t("confirm_delete_multiple", { count: selectedSales.length });
    if (confirm(confirmMessage)) {
      try {
        const deletePromises = selectedSales.map(id => deleteB2BSale(id));
        const results = await Promise.allSettled(deletePromises);

        const successCount = results.filter(r => r.status === 'fulfilled').length;
        const failedCount = results.filter(r => r.status === 'rejected').length;

        if (successCount > 0) {
          const successfulIds = selectedSales.filter((id, index) => results[index].status === 'fulfilled');
          setSales(sales.filter(s => !successfulIds.includes(s.id)));

          toast.success(t("bulk_delete_success", { count: successCount }));
        }

        if (failedCount > 0) {
          toast.error(t("bulk_delete_failed"));
        }

        setSelectedSales([]);
      } catch (error) {
        console.error("Bulk delete error:", error);
        toast.error(t("bulk_delete_failed"));
      }
    }
  };

  const filteredOffers = useMemo(() => {
    return offers.filter(o => {
      if (offerFilters.offer_id && !o.offer_id?.toLowerCase().includes(offerFilters.offer_id.toLowerCase())) return false;
      if (offerFilters.status && o.status !== (offerFilters.status as any)) return false;
      if (offerFilters.offer_type && o.offer_type !== (offerFilters.offer_type as any)) return false;
      if (offerFilters.warehouse_receipt_id && !(o.warehouse_receipt_id || "").toLowerCase().includes(offerFilters.warehouse_receipt_id.toLowerCase())) return false;
      const od = o.offer_date ? new Date(o.offer_date).getTime() : 0;
      const of = offerFilters.offer_date_from ? new Date(offerFilters.offer_date_from).getTime() : 0;
      const ot = offerFilters.offer_date_to ? new Date(offerFilters.offer_date_to).getTime() : 0;
      if (of && od < of) return false;
      if (ot && od > ot) return false;
      const ed = o.offer_exp_date ? new Date(o.offer_exp_date).getTime() : 0;
      const ef = offerFilters.offer_exp_date_from ? new Date(offerFilters.offer_exp_date_from).getTime() : 0;
      const et = offerFilters.offer_exp_date_to ? new Date(offerFilters.offer_exp_date_to).getTime() : 0;
      if (ef && ed < ef) return false;
      if (et && ed > et) return false;
      const ow = o.offer_weight || 0;
      const uw = offerFilters.offer_weight_min ? Number(offerFilters.offer_weight_min) : -Infinity;
      const vw = offerFilters.offer_weight_max ? Number(offerFilters.offer_weight_max) : Infinity;
      if (ow < uw || ow > vw) return false;
      const up = o.unit_price || 0;
      const umin = offerFilters.unit_price_min ? Number(offerFilters.unit_price_min) : -Infinity;
      const umax = offerFilters.unit_price_max ? Number(offerFilters.unit_price_max) : Infinity;
      if (up < umin || up > umax) return false;
      const tp = o.total_price || 0;
      const tmin = offerFilters.total_price_min ? Number(offerFilters.total_price_min) : -Infinity;
      const tmax = offerFilters.total_price_max ? Number(offerFilters.total_price_max) : Infinity;
      if (tp < tmin || tp > tmax) return false;
      return true;
    });
  }, [offers, offerFilters]);

  const filteredDistributions = useMemo(() => {
    return distributions.filter(d => {
      if (distributionFilters.transfer_id && !(d.transfer_id || "").toLowerCase().includes(distributionFilters.transfer_id.toLowerCase())) return false;
      if (distributionFilters.warehouse_receipt_id && !(d.warehouse_receipt_id || "").toLowerCase().includes(distributionFilters.warehouse_receipt_id.toLowerCase())) return false;
      if (distributionFilters.customer_name && !(d.customer_name || "").toLowerCase().includes(distributionFilters.customer_name.toLowerCase())) return false;
      if (distributionFilters.product_name && !(d.product_name || "").toLowerCase().includes(distributionFilters.product_name.toLowerCase())) return false;
      const dd = d.agency_date ? new Date(d.agency_date).getTime() : 0;
      const df = distributionFilters.date_from ? new Date(distributionFilters.date_from).getTime() : 0;
      const dt = distributionFilters.date_to ? new Date(distributionFilters.date_to).getTime() : 0;
      if (df && dd < df) return false;
      if (dt && dd > dt) return false;
      const w = d.agency_weight || 0;
      const wmin = distributionFilters.weight_min ? Number(distributionFilters.weight_min) : -Infinity;
      const wmax = distributionFilters.weight_max ? Number(distributionFilters.weight_max) : Infinity;
      if (w < wmin || w > wmax) return false;
      return true;
    });
  }, [distributions, distributionFilters]);

  const filteredAddresses = useMemo(() => {
    return addresses.filter(a => {
      if (addressFilters.purchase_id && !(a.purchase_id || "").toLowerCase().includes(addressFilters.purchase_id.toLowerCase())) return false;
      if (addressFilters.allocation_id && !(a.allocation_id || "").toLowerCase().includes(addressFilters.allocation_id.toLowerCase())) return false;
      if (addressFilters.tracking_number && !(a.tracking_number || "").toLowerCase().includes(addressFilters.tracking_number.toLowerCase())) return false;
      if (addressFilters.product_name && !(a.product_name || "").toLowerCase().includes(addressFilters.product_name.toLowerCase())) return false;
      if (addressFilters.customer_name && !(a.customer_name || "").toLowerCase().includes(addressFilters.customer_name.toLowerCase())) return false;
      if (addressFilters.receiver_name && !(a.receiver_name || "").toLowerCase().includes(addressFilters.receiver_name.toLowerCase())) return false;
      if (addressFilters.province && !(a.province || "").toLowerCase().includes(addressFilters.province.toLowerCase())) return false;
      if (addressFilters.city && !(a.city || "").toLowerCase().includes(addressFilters.city.toLowerCase())) return false;
      if (addressFilters.payment_method && (a.payment_method || "") !== addressFilters.payment_method) return false;
      const pd = a.purchase_date ? new Date(a.purchase_date as any).getTime() : 0;
      const pf = addressFilters.date_from ? new Date(addressFilters.date_from).getTime() : 0;
      const pt = addressFilters.date_to ? new Date(addressFilters.date_to).getTime() : 0;
      if (pf && pd < pf) return false;
      if (pt && pd > pt) return false;
      const tw = a.total_weight_purchased || 0;
      const twmin = addressFilters.weight_min ? Number(addressFilters.weight_min) : -Infinity;
      const twmax = addressFilters.weight_max ? Number(addressFilters.weight_max) : Infinity;
      if (tw < twmin || tw > twmax) return false;
      const up = a.unit_price || 0;
      const umin = addressFilters.unit_price_min ? Number(addressFilters.unit_price_min) : -Infinity;
      const umax = addressFilters.unit_price_max ? Number(addressFilters.unit_price_max) : Infinity;
      if (up < umin || up > umax) return false;
      const pa = a.payment_amount || 0;
      const pmin = addressFilters.payment_amount_min ? Number(addressFilters.payment_amount_min) : -Infinity;
      const pmax = addressFilters.payment_amount_max ? Number(addressFilters.payment_amount_max) : Infinity;
      if (pa < pmin || pa > pmax) return false;
      return true;
    });
  }, [addresses, addressFilters]);

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      if (salesFilters.purchase_id && !(s.purchase_id || "").toLowerCase().includes(salesFilters.purchase_id.toLowerCase())) return false;
      if (salesFilters.offer_id && !(s.offer_id || "").toLowerCase().includes(salesFilters.offer_id.toLowerCase())) return false;
      if (salesFilters.product_id && String(s.product_id || '').toLowerCase() !== salesFilters.product_id.toLowerCase()) return false;
      if (salesFilters.customer_name && !(s.customer_name || "").toLowerCase().includes(salesFilters.customer_name.toLowerCase())) return false;
      if (salesFilters.distribution_id && !(s.distribution_id || "").toLowerCase().includes(salesFilters.distribution_id.toLowerCase())) return false;
      if (salesFilters.purchase_type && s.purchase_type !== (salesFilters.purchase_type as any)) return false;
      const sd = s.sale_date ? new Date(s.sale_date).getTime() : 0;
      const sf = salesFilters.date_from ? new Date(salesFilters.date_from).getTime() : 0;
      const st = salesFilters.date_to ? new Date(salesFilters.date_to).getTime() : 0;
      if (sf && sd < sf) return false;
      if (st && sd > st) return false;
      const w = s.weight || 0;
      const wmin = salesFilters.weight_min ? Number(salesFilters.weight_min) : -Infinity;
      const wmax = salesFilters.weight_max ? Number(salesFilters.weight_max) : Infinity;
      if (w < wmin || w > wmax) return false;
      const up = s.unit_price || 0;
      const umin = salesFilters.unit_price_min ? Number(salesFilters.unit_price_min) : -Infinity;
      const umax = salesFilters.unit_price_max ? Number(salesFilters.unit_price_max) : Infinity;
      if (up < umin || up > umax) return false;
      const tp = s.total_price || 0;
      const tmin = salesFilters.total_price_min ? Number(salesFilters.total_price_min) : -Infinity;
      const tmax = salesFilters.total_price_max ? Number(salesFilters.total_price_max) : Infinity;
      if (tp < tmin || tp > tmax) return false;
      return true;
    });
  }, [sales, salesFilters]);

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

  const getPaymentTypeLabel = (pt?: string) => {
    const v = (pt || '').toString().trim();
    if (!v) return tCommon('payment_types.other');
    if (v === 'cash' || v === 'نقدی') return tCommon('payment_types.cash');
    if (v === 'credit' || v === 'اعتباری') return tCommon('payment_types.credit');
    if (v === 'agreement' || v === 'توافقی' || v === 'قراردادی') return tCommon('payment_types.agreement');
    if (v === 'other' || v === 'سایر') return tCommon('payment_types.other');
    return tCommon('payment_types.other');
  };

  const exportHtmlTable = (headers: string[], rows: (string | number)[][], suggested: string) => {
    const html = `\uFEFF<table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c ?? ""}</td>`).join("")}</tr>`).join("")}</tbody></table>`
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const name = window.prompt('نام فایل', suggested) || suggested
    a.href = url
    a.download = `${name}.xls`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportSelectedSales = () => {
    const sel = sales.filter(s=>selectedSales.includes(s.id))
    if (sel.length===0) return
    if (salesFilters.export_type==='distributor_sale') {
      const headers = SALE_DISTRIBUTOR_HEADERS
      const rows = sel.map(s=>[
        s.purchase_id||'',
        s.offer_id||'',
        s.weight||'',
        s.sale_date||'',
        s.total_price||'',
        s.unit_price||'',
        s.product_name||'',
        s.customer_name||'',
        s.purchase_type||'',
        '', '', '', '', '', ''
      ])
      exportHtmlTable(headers, rows, `b2b-sales-distributor-${new Date().toISOString().slice(0,16).replace(/[-:T]/g,'')}`)
    } else {
      const headers = SALE_YOUR_HEADERS
      const rows = sel.map(s=>[
        s.purchase_id||'',
        s.offer_id||'',
        s.description||'',
        s.weight||'',
        '',
        s.sale_date||'',
        s.total_price||'',
        s.unit_price||'',
        '',
        '',
        '',
        s.product_name||'',
        '',
        '',
        '',
        s.customer_name||'',
        s.purchase_type||'',
        s.offer_id||'',
        '', '', '', '', '', ''
      ])
      exportHtmlTable(headers, rows, `b2b-sales-your-${new Date().toISOString().slice(0,16).replace(/[-:T]/g,'')}`)
    }
  }

  const exportSelectedAddresses = async () => {
    const ids = addresses.filter(a=>selectedAddresses.includes(a.id)).map(a=>a.id)
    if (ids.length===0) return
    const { getApiBaseUrl } = await import("@/lib/api/config");
    const res = await fetch(`${getApiBaseUrl()}b2b/addresses/export/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids })
    })
    if (!res.ok) { toast.error('Export failed'); return }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `b2b-addresses-${new Date().toISOString().slice(0,16).replace(/[-:T]/g,'')}.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

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

      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value);
        router.push(`/b2b?tab=${value}`);
      }} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="offers" className="data-[state=active]:bg-[#f6d265] data-[state=active]:text-black">
            <ShoppingCart className="w-4 h-4 mr-2" />
            {t("offers_tab")}
          </TabsTrigger>
          <TabsTrigger value="distributions" className="data-[state=active]:bg-[#f6d265] data-[state=active]:text-black">
            <Package className="w-4 h-4 mr-2" />
            {t("distributions_tab")}
          </TabsTrigger>

          <TabsTrigger value="sales" className="data-[state=active]:bg-[#f6d265] data-[state=active]:text-black">
            <ShoppingCart className="w-4 h-4 mr-2" />
            {t("sales_tab")}
          </TabsTrigger>
          <TabsTrigger value="addresses" className="data-[state=active]:bg-[#f6d265] data-[state=active]:text-black">
            <TrendingUp className="w-4 h-4 mr-2" />
            {t("addresses_tab")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="offers">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-700">{t("offers_title")}</h2>
              <div className="flex gap-2">
                {selectedOffers.length > 0 && (
                  <Button variant="destructive" size="sm" onClick={handleBulkDeleteOffers}>
                    <Trash2 className="w-4 h-4 mr-1" />
                    {t("delete")} ({selectedOffers.length})
                  </Button>
                )}
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
            </div>
            <div className="p-4">
              <Collapsible open={offersFiltersOpen} onOpenChange={setOffersFiltersOpen}>
                <div className="flex justify-end mb-3">
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      {t('filters')}
                      {offersFiltersOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent dir="rtl">
                  <div className="bg-gray-50 border rounded-md p-4 space-y-4 mb-4">
                    <div className="grid grid-cols-6 gap-4">
                    <div>
                      <div className="text-sm font-medium mb-1">{tCommon('search_placeholders.search_offers')}</div>
                      <Input value={offerFilters.offer_id} onChange={e=>setOfferFilters({...offerFilters, offer_id:e.target.value})} />
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">{t('status')}</div>
                      <SearchableSelect
                        options={[{value:'',label:t('status')},{value:'active',label:tCommon('status.active')},{value:'pending',label:tCommon('status.pending')},{value:'sold',label:tCommon('status.sold')},{value:'expired',label:tCommon('status.expired')} ]}
                        value={offerFilters.status}
                        onValueChange={(v)=>setOfferFilters({...offerFilters, status:v})}
                      />
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">{t('offer_type')}</div>
                    <SearchableSelect
                      options={[{value:'',label:t('offer_type')},{value:'cash',label:tCommon('payment_types.cash')},{value:'credit',label:tCommon('payment_types.credit')},{value:'agreement',label:tCommon('payment_types.agreement')},{value:'other',label:tCommon('payment_types.other')}]} 
                      value={offerFilters.offer_type}
                      onValueChange={(v)=>setOfferFilters({...offerFilters, offer_type:v})}
                    />
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">{t('warehouse_receipt_id')}</div>
                      <Input value={offerFilters.warehouse_receipt_id} onChange={e=>setOfferFilters({...offerFilters, warehouse_receipt_id:e.target.value})} />
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">تاریخ عرضه از</div>
                      <PersianDatePicker value={offerFilters.offer_date_from} onChange={(v)=>setOfferFilters({...offerFilters, offer_date_from:v})} />
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">تاریخ عرضه تا</div>
                      <PersianDatePicker value={offerFilters.offer_date_to} onChange={(v)=>setOfferFilters({...offerFilters, offer_date_to:v})} />
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">تاریخ انقضا از</div>
                      <PersianDatePicker value={offerFilters.offer_exp_date_from} onChange={(v)=>setOfferFilters({...offerFilters, offer_exp_date_from:v})} />
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">تاریخ انقضا تا</div>
                      <PersianDatePicker value={offerFilters.offer_exp_date_to} onChange={(v)=>setOfferFilters({...offerFilters, offer_exp_date_to:v})} />
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">{t('offer_weight')}</div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="حداقل" value={offerFilters.offer_weight_min} onChange={e=>setOfferFilters({...offerFilters, offer_weight_min:e.target.value})} />
                        <Input placeholder="حداکثر" value={offerFilters.offer_weight_max} onChange={e=>setOfferFilters({...offerFilters, offer_weight_max:e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">{tCommon('detail_labels.unit_price')}</div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="حداقل" value={offerFilters.unit_price_min} onChange={e=>setOfferFilters({...offerFilters, unit_price_min:e.target.value})} />
                        <Input placeholder="حداکثر" value={offerFilters.unit_price_max} onChange={e=>setOfferFilters({...offerFilters, unit_price_max:e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">{tCommon('detail_labels.total_price')}</div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="حداقل" value={offerFilters.total_price_min} onChange={e=>setOfferFilters({...offerFilters, total_price_min:e.target.value})} />
                        <Input placeholder="حداکثر" value={offerFilters.total_price_max} onChange={e=>setOfferFilters({...offerFilters, total_price_max:e.target.value})} />
                      </div>
                    </div>
                    </div>
                  </div>
                  <div className="flex justify-end"><Button className="bg-red-100 text-red-700 hover:bg-red-200" onClick={()=>setOfferFilters({
                    offer_id: "",
                    status: "",
                    offer_type: "",
                    offer_date_from: "",
                    offer_date_to: "",
                    offer_exp_date_from: "",
                    offer_exp_date_to: "",
                    warehouse_receipt_id: "",
                    offer_weight_min: "",
                    offer_weight_max: "",
                    unit_price_min: "",
                    unit_price_max: "",
                    total_price_min: "",
                    total_price_max: "",
                  })}>ریست</Button></div>
                </CollapsibleContent>
              </Collapsible>
              {offers.length === 0 ? (
                <p className="text-gray-500 text-center py-8">{t("no_offers")}</p>
              ) : (
                <Table dir="rtl">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right w-16">ردیف</TableHead>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={filteredOffers.length > 0 && selectedOffers.length === filteredOffers.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedOffers(filteredOffers.map(o => o.id));
                            } else {
                              setSelectedOffers([]);
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead className="text-right">{t("offer_date")}</TableHead>
                      <TableHead className="text-right">{t("expiry_date")}</TableHead>
                      <TableHead className="text-right">{t("status")}</TableHead>
                      <TableHead className="text-right">{t("product")}</TableHead>
                      <TableHead className="text-right">{t("weight")}</TableHead>
                      <TableHead className="text-right">{t("unit_price")}</TableHead>
                      <TableHead className="text-right">{t("total_price")}</TableHead>
                      <TableHead className="text-right">{t("offer_id")}</TableHead>
                      
                      <TableHead className="text-center w-24">{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOffers.map((offer, index) => (
                      <TableRow key={offer.id} className="hover:bg-gray-50">
                        <TableCell className="text-right font-medium">{index + 1}</TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedOffers.includes(offer.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedOffers([...selectedOffers, offer.id]);
                              } else {
                                setSelectedOffers(selectedOffers.filter(id => id !== offer.id));
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>{new Date(offer.offer_date).toLocaleDateString('fa-IR')}</TableCell>
                        <TableCell>{new Date(offer.offer_exp_date).toLocaleDateString('fa-IR')}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(offer.status)}`}>
                            {offer.status === 'active' && tCommon('status.active')}
                            {offer.status === 'pending' && tCommon('status.pending')}
                            {offer.status === 'sold' && tCommon('status.sold')}
                            {offer.status === 'expired' && tCommon('status.expired')}
                          </span>
                        </TableCell>
                        <TableCell className="truncate max-w-[150px]" title={offer.product_name || `${tCommon('product_labels.product_prefix')} ${offer.product}`}>
                          {offer.product_name || `${tCommon('product_labels.product_prefix')} ${offer.product}`}
                        </TableCell>
                        <TableCell>{formatNumber(offer.offer_weight)}</TableCell>
                        <TableCell className="truncate max-w-[100px]">{formatNumber(offer.unit_price)}</TableCell>
                        <TableCell className="truncate max-w-[120px]">{formatNumber(offer.total_price || 0)}</TableCell>
                        <TableCell className="truncate max-w-[120px]" title={offer.offer_id}>{offer.offer_id}</TableCell>
                        
                        <TableCell className="text-center">
                          <div className="flex gap-2 justify-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRowClick(offer, 'offer')}
                            >
                              <Eye className="w-4 h-4 text-blue-600" />
                            </Button>
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
                                  handleApiErrorWithToast(error, "Fetch offer details");

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
                {selectedDistributions.length > 0 && (
                  <Button variant="destructive" size="sm" onClick={handleBulkDeleteDistributions}>
                    <Trash2 className="w-4 h-4 mr-1" />
                    {t("delete")} ({selectedDistributions.length})
                  </Button>
                )}
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
              <Collapsible open={distributionsFiltersOpen} onOpenChange={setDistributionsFiltersOpen}>
                <div className="flex justify-end mb-3">
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      {t('filters')}
                      {distributionsFiltersOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent dir="rtl">
                  <div className="grid grid-cols-6 gap-4 mb-4">
                    <Input placeholder={t('transfer_id')} value={distributionFilters.transfer_id} onChange={e=>setDistributionFilters({...distributionFilters, transfer_id:e.target.value})} />
                    <Input placeholder={t('warehouse_receipt')} value={distributionFilters.warehouse_receipt_id} onChange={e=>setDistributionFilters({...distributionFilters, warehouse_receipt_id:e.target.value})} />
                    <SimpleCombobox
                      options={[
                        { value: '', label: t('customer') },
                        ...customers.map(c => ({
                          value: c.id.toString(),
                          label: (c.company_name || c.full_name || `#${c.id}`) + (c.economic_code ? ` - ${c.economic_code}` : ''),
                          id: c.id,
                          name: c.company_name || c.full_name || ''
                        }))
                      ]}
                      value={''}
                      onValueChange={(v) => {
                        const selected = customers.find(c => c.id.toString() === v);
                        setDistributionFilters({
                          ...distributionFilters,
                          customer_name: selected ? (selected.company_name || selected.full_name || '') : ''
                        });
                      }}
                      placeholder={t('customer')}
                      searchPlaceholder={t('customer')}
                      showCreateNew={false}
                    />
                    <div>
                      <div className="text-sm font-medium mb-1">{t('product')}</div>
                      <Input value={distributionFilters.product_name} onChange={e=>setDistributionFilters({...distributionFilters, product_name:e.target.value})} />
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">تاریخ از</div>
                      <PersianDatePicker value={distributionFilters.date_from} onChange={(v)=>setDistributionFilters({...distributionFilters, date_from:v})} />
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">تاریخ تا</div>
                      <PersianDatePicker value={distributionFilters.date_to} onChange={(v)=>setDistributionFilters({...distributionFilters, date_to:v})} />
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">{t('agency_weight')} (حداقل)</div>
                      <Input value={distributionFilters.weight_min} onChange={e=>setDistributionFilters({...distributionFilters, weight_min:e.target.value})} />
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">{t('agency_weight')} (حداکثر)</div>
                      <Input value={distributionFilters.weight_max} onChange={e=>setDistributionFilters({...distributionFilters, weight_max:e.target.value})} />
                    </div>
                  </div>
                  <div className="flex justify-end"><Button variant="outline" className="border-destructive text-destructive hover:text-destructive" onClick={()=>setDistributionFilters({
                    transfer_id: "",
                    warehouse_receipt_id: "",
                    customer_name: "",
                    product_name: "",
                    date_from: "",
                    date_to: "",
                    weight_min: "",
                    weight_max: "",
                  })}>{t('reset')}</Button></div>
                </CollapsibleContent>
              </Collapsible>
              {distributions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">{t("no_distributions")}</p>
              ) : (
                <Table dir="rtl">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={filteredDistributions.length > 0 && selectedDistributions.length === filteredDistributions.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDistributions(filteredDistributions.map(d => d.id));
                            } else {
                              setSelectedDistributions([]);
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead className="text-right w-16">ردیف</TableHead>
                      <TableHead className="text-right">{t("agency_date")}</TableHead>
                      <TableHead className="text-right">{t("warehouse")}</TableHead>
                      <TableHead className="text-right">{t("product")}</TableHead>
                      <TableHead className="text-right">{tCommon("detail_labels.sales_proforma_header")}</TableHead>
                      <TableHead className="text-right">{t("customer")}</TableHead>
                      <TableHead className="text-right">{t("distributor")}</TableHead>
                      <TableHead className="text-right">{t("agency_weight")}</TableHead>
                      <TableHead className="text-right">{t("transfer_id")}</TableHead>

                      <TableHead className="text-center w-24">{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDistributions.map((distribution, index) => (
                      <TableRow key={distribution.id} className="hover:bg-gray-50">
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedDistributions.includes(distribution.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedDistributions([...selectedDistributions, distribution.id]);
                              } else {
                                setSelectedDistributions(selectedDistributions.filter(id => id !== distribution.id));
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">{index + 1}</TableCell>
                        <TableCell>{new Date(distribution.agency_date).toLocaleDateString('fa-IR')}</TableCell>
                        <TableCell className="truncate max-w-[120px]" title={distribution.warehouse_name || `${tCommon('product_labels.warehouse_prefix')} ${distribution.warehouse}`}>
                          {distribution.warehouse_name || `${tCommon('product_labels.warehouse_prefix')} ${distribution.warehouse}`}
                        </TableCell>
                        <TableCell className="truncate max-w-[150px]" title={distribution.product_name || `${tCommon('product_labels.product_prefix')} ${distribution.product}`}>
                          {distribution.product_name || `${tCommon('product_labels.product_prefix')} ${distribution.product}`}
                        </TableCell>
                        <TableCell className="truncate max-w-[120px]" title={distribution.sales_proforma_serial || '-'}>
                          {distribution.sales_proforma_serial || '-'}
                        </TableCell>
                        <TableCell className="truncate max-w-[150px]" title={distribution.sales_proforma_customer_name || '-'}>
                          {distribution.sales_proforma_customer_name || '-'}
                        </TableCell>
                        <TableCell className="truncate max-w-[150px]" title={distribution.customer_name || `${tCommon('product_labels.customer_prefix')} ${distribution.customer}`}>
                          {distribution.customer_name || `${tCommon('product_labels.customer_prefix')} ${distribution.customer}`}
                        </TableCell>
                        <TableCell>{formatNumber(distribution.agency_weight)}</TableCell>
                        <TableCell className="truncate max-w-[140px]" title={distribution.transfer_id || '-'}>{distribution.transfer_id || '-'}</TableCell>
                        
                        <TableCell className="text-center">
                          <div className="flex gap-2 justify-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRowClick(distribution, 'distribution')}
                            >
                              <Eye className="w-4 h-4 text-blue-600" />
                            </Button>
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
                                  handleApiErrorWithToast(error, "Fetch distribution details");

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
                {selectedSales.length > 0 && (
                  <Button variant="destructive" size="sm" onClick={handleBulkDeleteSales}>
                    <Trash2 className="w-4 h-4 mr-1" />
                    {t("delete")} ({selectedSales.length})
                  </Button>
                )}
                {selectedSales.length > 0 && (
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={()=>exportSelectedSales()}>
                    {tCommon('buttons.excel_export')}
                  </Button>
                )}
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
              <Collapsible open={salesFiltersOpen} onOpenChange={setSalesFiltersOpen}>
                <div className="flex justify-end mb-3">
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      {t('filters')}
                      {salesFiltersOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent dir="rtl">
                  <div className="grid grid-cols-6 gap-4 mb-4">
                    <div>
                      <div className="text-sm font-medium mb-1">{t('purchase_id')}</div>
                      <Input value={salesFilters.purchase_id} onChange={e=>setSalesFilters({...salesFilters, purchase_id:e.target.value})} />
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">{tCommon('detail_labels.offer_id')}</div>
                      <SimpleCombobox
                        options={[
                          { value: '', label: tCommon('detail_labels.offer_id') },
                          ...offers.map(o => ({ value: o.offer_id || o.id.toString(), label: o.offer_id || `#${o.id}`, id: o.id, name: o.offer_id || '' }))
                        ]}
                        value={''}
                        onValueChange={(v) => setSalesFilters({ ...salesFilters, offer_id: v })}
                        placeholder={tCommon('detail_labels.offer_id')}
                        searchPlaceholder={tCommon('detail_labels.offer_id')}
                        showCreateNew={false}
                      />
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">{t('transfer_id')}</div>
                      <SimpleCombobox
                        options={[
                          { value: '', label: t('transfer_id') },
                          ...distributions.map(d => ({ value: d.transfer_id || d.id.toString(), label: d.transfer_id || `#${d.id}`, id: d.id, name: d.transfer_id || '' }))
                        ]}
                        value={''}
                        onValueChange={(v) => setSalesFilters({ ...salesFilters, distribution_id: v })}
                        placeholder={t('transfer_id')}
                        searchPlaceholder={t('transfer_id')}
                        showCreateNew={false}
                      />
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">{t('product')}</div>
                      <SimpleCombobox
                        options={[
                          { value: '', label: t('product') },
                          ...products.map(p => ({ value: p.id.toString(), label: `${p.name} - ${p.code}`, id: p.id, name: p.name }))
                        ]}
                        value={''}
                        onValueChange={(v) => setSalesFilters({ ...salesFilters, product_id: v })}
                        placeholder={t('product')}
                        searchPlaceholder={t('product')}
                        showCreateNew={false}
                      />
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">{t('customer')}</div>
                      <SimpleCombobox
                      options={[
                        { value: '', label: t('customer') },
                        ...customers.map(c => ({
                          value: c.id.toString(),
                          label: (c.company_name || c.full_name || `#${c.id}`) + (c.economic_code ? ` - ${c.economic_code}` : ''),
                          id: c.id,
                          name: c.company_name || c.full_name || ''
                        }))
                      ]}
                      value={''}
                      onValueChange={(v) => {
                        const selected = customers.find(c => c.id.toString() === v);
                        setSalesFilters({
                          ...salesFilters,
                          customer_name: selected ? (selected.company_name || selected.full_name || '') : ''
                        });
                      }}
                      placeholder={t('customer')}
                      searchPlaceholder={t('customer')}
                      showCreateNew={false}
                      />
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">تاریخ از</div>
                      <PersianDatePicker value={salesFilters.date_from} onChange={(v)=>setSalesFilters({...salesFilters, date_from:v})} />
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">تاریخ تا</div>
                      <PersianDatePicker value={salesFilters.date_to} onChange={(v)=>setSalesFilters({...salesFilters, date_to:v})} />
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">{t('weight')}</div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="حداقل" value={salesFilters.weight_min} onChange={e=>setSalesFilters({...salesFilters, weight_min:e.target.value})} />
                        <Input placeholder="حداکثر" value={salesFilters.weight_max} onChange={e=>setSalesFilters({...salesFilters, weight_max:e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">{tCommon('detail_labels.unit_price')}</div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="حداقل" value={salesFilters.unit_price_min} onChange={e=>setSalesFilters({...salesFilters, unit_price_min:e.target.value})} />
                        <Input placeholder="حداکثر" value={salesFilters.unit_price_max} onChange={e=>setSalesFilters({...salesFilters, unit_price_max:e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">{tCommon('detail_labels.total_price')}</div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="حداقل" value={salesFilters.total_price_min} onChange={e=>setSalesFilters({...salesFilters, total_price_min:e.target.value})} />
                        <Input placeholder="حداکثر" value={salesFilters.total_price_max} onChange={e=>setSalesFilters({...salesFilters, total_price_max:e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">{t('purchase_type')}</div>
                    <SearchableSelect
                      options={[{value:'',label:t('purchase_type')},{value:'cash',label:tCommon('payment_types.cash')},{value:'credit',label:tCommon('payment_types.credit')},{value:'agreement',label:tCommon('payment_types.agreement')},{value:'other',label:tCommon('payment_types.other')} ]}
                      value={salesFilters.purchase_type}
                      onValueChange={(v)=>setSalesFilters({...salesFilters, purchase_type:v})}
                    />
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">{t('export_type')}</div>
                      <SearchableSelect
                        options={[{value:'your_sale',label:t('your_sale')},{value:'distributor_sale',label:t('distributor_sale')}]} 
                        value={salesFilters.export_type}
                        onValueChange={(v)=>setSalesFilters({...salesFilters, export_type:v as any})}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end"><Button variant="outline" className="border-destructive text-destructive hover:text-destructive" onClick={()=>setSalesFilters({
                    purchase_id: "",
                    offer_id: "",
                    product_id: "",
                    customer_name: "",
                    distribution_id: "",
                    purchase_type: "",
                    date_from: "",
                    date_to: "",
                    weight_min: "",
                    weight_max: "",
                    unit_price_min: "",
                    unit_price_max: "",
                    total_price_min: "",
                    total_price_max: "",
                    export_type: "your_sale",
                  })}>{t('reset')}</Button></div>
                </CollapsibleContent>
              </Collapsible>
              {sales.length === 0 ? (
                <p className="text-gray-500 text-center py-8">{t("no_sales")}</p>
              ) : (
                <Table dir="rtl">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={filteredSales.length > 0 && selectedSales.length === filteredSales.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSales(filteredSales.map(s => s.id));
                            } else {
                              setSelectedSales([]);
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead className="text-right w-16">ردیف</TableHead>
                      <TableHead className="text-right">{t("sale_date")}</TableHead>
                      <TableHead className="text-right">{t("purchase_type")}</TableHead>
                      <TableHead className="text-right">{t("customer")}</TableHead>
                      <TableHead className="text-right">{t("product")}</TableHead>
                      <TableHead className="text-right">{t("weight")}</TableHead>
                      <TableHead className="text-right">{t("unit_price")}</TableHead>
                      <TableHead className="text-right">{t("total_price")}</TableHead>
                      <TableHead className="text-right">{t("purchase_id")}</TableHead>
                      
                      <TableHead className="text-center w-24">{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.map((sale, index) => (
                      <TableRow key={sale.id} className="hover:bg-gray-50">
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedSales.includes(sale.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSales([...selectedSales, sale.id]);
                              } else {
                                setSelectedSales(selectedSales.filter(id => id !== sale.id));
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">{index + 1}</TableCell>
                        <TableCell className="text-right">{new Date(sale.sale_date).toLocaleDateString('fa-IR')}</TableCell>
                        <TableCell className="text-right">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {getPaymentTypeLabel(sale.purchase_type)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right truncate max-w-[150px]" title={sale.customer_name || `${tCommon('customer_labels.customer_prefix')} ${sale.customer}`}>
                          {sale.customer_name || `${tCommon('customer_labels.customer_prefix')} ${sale.customer}`}
                        </TableCell>
                        <TableCell className="text-right truncate max-w-[150px]" title={sale.product_name || `${tCommon('product_labels.product_prefix')} ${sale.product}`}>
                          {sale.product_name || `${tCommon('product_labels.product_prefix')} ${sale.product}`}
                        </TableCell>
                        <TableCell className="text-right">{formatNumber(sale.weight)}</TableCell>
                        <TableCell className="text-right">{formatNumber(sale.unit_price)}</TableCell>
                        <TableCell className="text-right">{formatNumber(sale.total_price || (sale.weight && sale.unit_price ? Number(sale.weight) * Number(sale.unit_price) : 0))}</TableCell>
                        <TableCell className="text-right truncate max-w-[100px]" title={sale.purchase_id}>
                          {sale.purchase_id}
                        </TableCell>
                        
                        <TableCell className="text-center">
                          <div className="flex gap-2 justify-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRowClick(sale, 'sale')}
                            >
                              <Eye className="w-4 h-4 text-blue-600" />
                            </Button>
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
                                  handleApiErrorWithToast(error, "Fetch sale details");

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

        <TabsContent value="addresses">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-700">{t("addresses_title")}</h2>
              <div className="flex gap-2">
                {selectedAddresses.length > 0 && (
                  <Button variant="destructive" size="sm" onClick={handleBulkDeleteAddresses}>
                    <Trash2 className="w-4 h-4 mr-1" />
                    {t("delete")} ({selectedAddresses.length})
                  </Button>
                )}
                {selectedAddresses.length > 0 && (
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={()=>exportSelectedAddresses()}>
                    {tCommon('buttons.excel_export')}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddressUploadModal(true)}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  {t("import_excel")}
                </Button>
                <Button
                  size="sm"
                  className="bg-[#f6d265] hover:bg-[#f5c842] text-black"
                  onClick={() => {
                    setEditingAddress(null);
                    setShowAddressModal(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {t("add_address")}
                </Button>
              </div>
            </div>
            <div className="p-4">
              <Collapsible open={addressesFiltersOpen} onOpenChange={setAddressesFiltersOpen}>
                <div className="flex justify-end mb-3">
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      {t('filters')}
                      {addressesFiltersOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent dir="rtl">
                  <div className="grid grid-cols-6 gap-4 mb-4">
                    <div>
                      <div className="text-sm font-medium mb-1">{t('purchase_id')}</div>
                      <SimpleCombobox
                        options={[{ value: '', label: t('purchase_id') }, ...Array.from(new Set((sales || []).map(s => s.purchase_id).filter(Boolean))).map((id: string) => ({ value: id, label: id }))]}
                        value={addressFilters.purchase_id}
                        onValueChange={(v) => setAddressFilters({ ...addressFilters, purchase_id: v })}
                        placeholder={t('purchase_id')}
                        searchPlaceholder={t('purchase_id')}
                        showCreateNew={false}
                      />
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">{t('allocation_id')}</div>
                      <Input value={addressFilters.allocation_id} onChange={e=>setAddressFilters({...addressFilters, allocation_id:e.target.value})} />
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium mb-1">{t('product')}</div>
                      <SimpleCombobox
                        options={[{ value: '', label: t('product') }, ...Array.from(new Set((addresses || []).map(a => a.product_name).filter(Boolean))).map((name: string) => ({ value: name, label: name }))]}
                        value={addressFilters.product_name}
                        onValueChange={(v) => setAddressFilters({ ...addressFilters, product_name: v })}
                        placeholder={t('product')}
                        searchPlaceholder={t('product')}
                        showCreateNew={false}
                      />
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">{t('customer')}</div>
                      <SimpleCombobox
                      options={[
                        { value: '', label: t('customer') },
                        ...customers.map(c => ({
                          value: c.id.toString(),
                          label: (c.company_name || c.full_name || `#${c.id}`) + (c.economic_code ? ` - ${c.economic_code}` : ''),
                          id: c.id,
                          name: c.company_name || c.full_name || ''
                        }))
                      ]}
                      value={''}
                      onValueChange={(v) => {
                        const selected = customers.find(c => c.id.toString() === v);
                        setAddressFilters({
                          ...addressFilters,
                          customer_name: selected ? (selected.company_name || selected.full_name || '') : ''
                        });
                      }}
                      placeholder={t('customer')}
                      searchPlaceholder={t('customer')}
                      showCreateNew={false}
                      />
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">{t('receiver')}</div>
                      <SimpleCombobox
                        options={[
                          { value: '', label: t('receiver') },
                          ...receivers.map(r => ({
                            value: r.id.toString(),
                            label: (r.company_name || r.full_name || `#${r.id}`) + (r.economic_code ? ` - ${r.economic_code}` : ''),
                            id: r.id,
                            name: r.company_name || r.full_name || ''
                          }))
                        ]}
                        value={''}
                        onValueChange={(v) => {
                          const selected = receivers.find(r => r.id.toString() === v);
                          setAddressFilters({
                            ...addressFilters,
                            receiver_name: selected ? (selected.company_name || selected.full_name || '') : ''
                          });
                        }}
                        placeholder={t('receiver')}
                        searchPlaceholder={t('receiver')}
                        showCreateNew={false}
                      />
                    </div>
                    <div className="col-span-6 border rounded p-3 space-y-2">
                      <div className="text-sm font-medium">{t('date')}</div>
                      <div className="grid grid-cols-6 gap-3">
                        <div>
                          <div className="text-xs mb-1">از تاریخ</div>
                          <PersianDatePicker value={addressFilters.date_from} onChange={(v)=>setAddressFilters({...addressFilters, date_from:v})} />
                        </div>
                        <div>
                          <div className="text-xs mb-1">تا تاریخ</div>
                          <PersianDatePicker value={addressFilters.date_to} onChange={(v)=>setAddressFilters({...addressFilters, date_to:v})} />
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">{t('weight')}</div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="حداقل" value={addressFilters.weight_min} onChange={e=>setAddressFilters({...addressFilters, weight_min:e.target.value})} />
                        <Input placeholder="حداکثر" value={addressFilters.weight_max} onChange={e=>setAddressFilters({...addressFilters, weight_max:e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">{tCommon('detail_labels.unit_price')}</div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="حداقل" value={addressFilters.unit_price_min} onChange={e=>setAddressFilters({...addressFilters, unit_price_min:e.target.value})} />
                        <Input placeholder="حداکثر" value={addressFilters.unit_price_max} onChange={e=>setAddressFilters({...addressFilters, unit_price_max:e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">{t('amount')}</div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="حداقل" value={addressFilters.payment_amount_min} onChange={e=>setAddressFilters({...addressFilters, payment_amount_min:e.target.value})} />
                        <Input placeholder="حداکثر" value={addressFilters.payment_amount_max} onChange={e=>setAddressFilters({...addressFilters, payment_amount_max:e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">{t('payment_method')}</div>
                    <SearchableSelect
                      options={[{value:'',label:t('payment_method')},{value:'cash',label:tCommon('payment_types.cash')},{value:'credit',label:tCommon('payment_types.credit')},{value:'agreement',label:tCommon('payment_types.agreement')},{value:'other',label:tCommon('payment_types.other')} ]}
                      value={addressFilters.payment_method}
                      onValueChange={(v)=>setAddressFilters({...addressFilters, payment_method:v})}
                    />
                    </div>
                  </div>
                  <div className="flex justify-end"><Button className="bg-red-100 text-red-700 hover:bg-red-200" onClick={()=>setAddressFilters({
                    purchase_id: "",
                    allocation_id: "",
                    tracking_number: "",
                    product_name: "",
                    customer_name: "",
                    receiver_name: "",
                    province: "",
                    city: "",
                    payment_method: "",
                    date_from: "",
                    date_to: "",
                    weight_min: "",
                    weight_max: "",
                    unit_price_min: "",
                    unit_price_max: "",
                    payment_amount_min: "",
                    payment_amount_max: "",
                  })}>ریست</Button></div>
                </CollapsibleContent>
              </Collapsible>
              {addresses.length === 0 ? (
                <p className="text-gray-500 text-center py-8">{t("no_addresses")}</p>
              ) : (
                <Table dir="rtl">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={filteredAddresses.length > 0 && selectedAddresses.length === filteredAddresses.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAddresses(filteredAddresses.map(a => a.id));
                            } else {
                              setSelectedAddresses([]);
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead className="text-right w-16">ردیف</TableHead>
                      <TableHead className="text-right">{t("date")}</TableHead>
                      <TableHead className="text-right">{t("cottage_code")}</TableHead>
                      <TableHead className="text-right">{t("product")}</TableHead>
                      <TableHead className="text-right">{t("distributor")}</TableHead>
                      <TableHead className="text-right">{t("customer")}</TableHead>
                      <TableHead className="text-right">{t("receiver")}</TableHead>
                      <TableHead className="text-right">{t("weight")}</TableHead>
                      <TableHead className="text-right">{t("allocation_id")}</TableHead>
                      <TableHead className="text-right">{t("warehouse")}</TableHead>
                      <TableHead className="text-center w-24">{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAddresses.map((address, index) => (
                      <TableRow key={address.id} className="hover:bg-gray-50">
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedAddresses.includes(address.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAddresses([...selectedAddresses, address.id]);
                              } else {
                                setSelectedAddresses(selectedAddresses.filter(id => id !== address.id));
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">{index + 1}</TableCell>
                        <TableCell className="text-right">{address.purchase_date ? new Date(address.purchase_date).toLocaleDateString('fa-IR') : '-'}</TableCell>
                        <TableCell className="text-right truncate max-w-[120px]" title={address.cottage_code || ''}>
                          {address.cottage_code || '-'}
                        </TableCell>
                        <TableCell className="text-right truncate max-w-[150px]" title={address.product_name || ''}>
                          {address.product_name || '-'}
                        </TableCell>
                        <TableCell className="text-right truncate max-w-[150px]" title={address.distributor_name || ''}>
                          {address.distributor_name || '-'}
                        </TableCell>
                        <TableCell className="text-right truncate max-w-[150px]" title={address.customer_name || ''}>
                          {address.customer_name || '-'}
                        </TableCell>
                        <TableCell className="text-right truncate max-w-[150px]" title={address.receiver_name || ''}>
                          {address.receiver_name || '-'}
                        </TableCell>
                        <TableCell className="text-right">{formatNumber(address.total_weight_purchased)}</TableCell>
                        <TableCell className="text-right truncate max-w-[100px]" title={address.allocation_id || ''}>
                          {address.allocation_id || '-'}
                        </TableCell>
                        <TableCell className="text-right truncate max-w-[150px]" title={address.warehouse_name || ''}>
                          {address.warehouse_name || '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex gap-2 justify-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRowClick(address, 'address')}
                            >
                              <Eye className="w-4 h-4 text-blue-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  const fullAddress = await fetchB2BAddressById(address.id);
                                  setEditingAddress(fullAddress);
                                  setShowAddressModal(true);
                                } catch (error) {
                                  console.error("Failed to fetch address details:", error);
                                  handleApiErrorWithToast(error, "Fetch address details");

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
                                handleDeleteAddress(address.id);
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
              handleApiErrorWithToast(error, `${editingOffer ? 'Update' : 'Create'} offer`);

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
          initialData={editingDistribution ? {
            ...editingDistribution,
            b2b_offer: editingDistribution.b2b_offer ?? undefined
          } : undefined}
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
              handleApiErrorWithToast(error, `${editingDistribution ? 'Update' : 'Create'} distribution`);

            }
          }}
          onOfferCreated={loadData}
          onClose={() => {
            setShowDistributionModal(false);
            setEditingDistribution(null);
          }}
        />
      )}

      {showAddressModal && (
        <B2BAddressModal
          initialData={editingAddress ? {
            ...editingAddress,
            product: editingAddress.product ?? undefined,
            customer: editingAddress.customer ?? undefined,
            purchase_date: editingAddress.purchase_date || ''
          } : undefined}
          onSubmit={async (data) => {
            try {
              if (editingAddress) {
                await updateB2BAddress(editingAddress.id, data);
                toast.success(tErrors("success_update"));
              } else {
                await createB2BAddress(data);
                toast.success(tErrors("success_create"));
              }
              await loadData();
              setShowAddressModal(false);
              setEditingAddress(null);
            } catch (error) {
              console.error(`Failed to ${editingAddress ? 'update' : 'create'} address:`, error);
              handleApiErrorWithToast(error, `${editingAddress ? 'Update' : 'Create'} address`);

            }
          }}
          onClose={() => {
            setShowAddressModal(false);
            setEditingAddress(null);
          }}
        />
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" className="w-[400px] sm:w-[540px] overflow-y-auto p-6" dir="rtl">
          <SheetHeader>
            <SheetTitle className="text-2xl font-bold text-[#f6d265]">
              {selectedType === 'offer' && t("offer_details")}
              {selectedType === 'distribution' && t("distribution_details")}
              {selectedType === 'address' && t("address_details")}
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
                      } else if (selectedType === 'address') {
                        const fullAddress = await fetchB2BAddressById(selectedItem.id);
                        setEditingAddress(fullAddress);
                        setShowAddressModal(true);
                      } else if (selectedType === 'sale') {
                        const fullSale = await fetchB2BSaleById(selectedItem.id);
                        setEditingSale(fullSale);
                        setShowSaleModal(true);
                      }
                      setSheetOpen(false);
                    } catch (error) {
                      console.error("Failed to fetch details:", error);
                      handleApiErrorWithToast(error, "Fetch details");

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
                        t("confirm_delete_address");
                    if (confirm(confirmMessage)) {
                      try {
                        if (selectedType === 'offer' && 'offer_id' in selectedItem) {
                          await deleteB2BOffer(selectedItem.id);
                        } else if (selectedType === 'distribution' && 'agency_weight' in selectedItem) {
                          await deleteB2BDistribution(selectedItem.id);
                        } else if (selectedType === 'address' && 'purchase_id' in selectedItem) {
                          await deleteB2BAddress(selectedItem.id);
                        } else if (selectedType === 'sale' && 'weight' in selectedItem) {
                          await deleteB2BSale(selectedItem.id);
                        }
                        toast.success(tErrors("success_delete"));
                        await loadData();
                        setSheetOpen(false);
                      } catch (error) {
                        console.error("Failed to delete:", error);
                        handleApiErrorWithToast(error, "Delete item");

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
                    <div><strong>{tCommon('detail_labels.offer_weight')}</strong> {formatNumber(item.offer_weight)} {tCommon('units.kg')}</div>
                    <div><strong>{tCommon('detail_labels.unit_price')}</strong> {formatNumber(item.unit_price)} {tCommon('units.rial')}</div>
                    <div><strong>{tCommon('detail_labels.total_price')}</strong> {formatNumber(item.total_price || item.offer_weight * item.unit_price)} {tCommon('units.rial')}</div>
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
                      <div><strong>{tCommon('detail_labels.purchase_id')}</strong> {item.transfer_id || '-'}</div>
                      {item.sales_proforma && (
                        <div className="flex items-center gap-2">
                          <strong>{tCommon('detail_labels.sales_proforma')}</strong>
                          <span>{item.sales_proforma_serial || item.sales_proforma}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-[#f6d265] hover:text-[#f6d265]/80"
                            onClick={async () => {
                              try {
                                const proforma = await fetchSalesProformaById(item.sales_proforma!);
                                setViewingProformaData(proforma);
                                setViewingProformaId(item.sales_proforma!);
                                setShowProformaModal(true);
                              } catch (error) {
                                console.error("Failed to fetch proforma:", error);
                                handleApiErrorWithToast(error, "Fetch proforma");
                              }
                            }}
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      <div><strong>{tCommon('detail_labels.warehouse')}</strong> {item.warehouse_name || `${tCommon('product_labels.warehouse_prefix')} ${item.warehouse}`}</div>
                      <div><strong>{tCommon('detail_labels.product')}</strong> {item.product_name || `${tCommon('product_labels.product_prefix')} ${item.product}`}</div>
                      <div><strong>{tCommon('detail_labels.customer')}</strong> {item.sales_proforma_customer_name || '-'}</div>
                      <div><strong>{tCommon('detail_labels.distributor')}</strong> {item.customer_name || `${tCommon('product_labels.customer_prefix')} ${item.customer}`}</div>
                      <div><strong>{tCommon('detail_labels.agency_weight')}</strong> {formatNumber(item.agency_weight)} {tCommon('units.kg')}</div>
                      <div><strong>{tCommon('detail_labels.agency_date')}</strong> {new Date(item.agency_date).toLocaleDateString('fa-IR')}</div>
                      {item.description && <div><strong>{tCommon('detail_labels.description')}</strong> {item.description}</div>}
                    </>);
                })()}
                {selectedType === 'address' && (() => {
                  const item = selectedItem as B2BAddress;
                  return (
                    <>
                      <div><strong>{tCommon('detail_labels.purchase_id')}</strong> {item.purchase_id}</div>
                      <div><strong>{tCommon('detail_labels.allocation_id')}</strong> {item.allocation_id || '-'}</div>
                      <div><strong>{tCommon('detail_labels.customer')}</strong> {item.customer_name || '-'}</div>
                      <div><strong>{tCommon('detail_labels.receiver')}</strong> {item.receiver_name || '-'}</div>
                      <div><strong>{tCommon('detail_labels.product')}</strong> {item.product_name || '-'}</div>
                      <div><strong>{tCommon('detail_labels.weight')}</strong> {formatNumber(item.total_weight_purchased)} {tCommon('units.kg')}</div>
                      <div><strong>{tCommon('detail_labels.unit_price')}</strong> {formatNumber(item.unit_price || (item.payment_amount && item.total_weight_purchased ? item.payment_amount / item.total_weight_purchased : 0))} {tCommon('units.rial')}</div>
                      <div><strong>{tCommon('detail_labels.payment_amount')}</strong> {formatNumber(item.payment_amount || 0)} {tCommon('units.rial')}</div>
                      <div><strong>{tCommon('detail_labels.payment_method')}</strong> {item.payment_method || '-'}</div>
                      <div><strong>{tCommon('detail_labels.purchase_date')}</strong> {item.purchase_date ? new Date(item.purchase_date).toLocaleDateString('fa-IR') : '-'}</div>
                      <div><strong>{tCommon('detail_labels.province')}</strong> {item.province || '-'}</div>
                      <div><strong>{tCommon('detail_labels.city')}</strong> {item.city || '-'}</div>
                      <div><strong>{tCommon('detail_labels.tracking_number')}</strong> {item.tracking_number || '-'}</div>
                      {item.credit_description && <div><strong>{tCommon('detail_labels.description')}</strong> {item.credit_description}</div>}
                    </>);
                })()}
                {selectedType === 'sale' && (() => {
                  const item = selectedItem as B2BSale;
                  return (
                    <>
                      <div><strong>{tCommon('detail_labels.purchase_id')}</strong> {item.purchase_id}</div>
                      <div><strong>{tCommon('detail_labels.offer_id')}</strong> {item.offer_id || t("distributor-sale")}</div>
                      <div><strong>{tCommon('detail_labels.customer')}</strong> {item.customer_name || `${tCommon('customer_labels.customer_prefix')} ${item.customer}`}</div>
                      <div><strong>{tCommon('detail_labels.product')}</strong> {item.product_name || `${tCommon('product_labels.product_prefix')} ${item.product}`}</div>
                      <div><strong>{tCommon('detail_labels.cottage_code')}</strong> {item.cottage_code || '-'}</div>
                      <div><strong>{tCommon('detail_labels.weight')}</strong> {formatNumber(item.weight)} {tCommon('units.kg')}</div>
                      <div><strong>{tCommon('detail_labels.unit_price')}</strong> {formatNumber(item.unit_price || 0)} {tCommon('units.rial')}</div>
                      <div><strong>{tCommon('detail_labels.total_price')}</strong> {formatNumber(item.total_price || (item.weight && item.unit_price ? Number(item.weight) * Number(item.unit_price) : 0))} {tCommon('units.rial')}</div>
                      <div><strong>{tCommon('detail_labels.sale_date')}</strong> {new Date(item.sale_date).toLocaleDateString('fa-IR')}</div>
                      <div><strong>{tCommon('detail_labels.purchase_type')}</strong> {
                        item.purchase_type === 'cash' ? tCommon('payment_types.cash') :
                          item.purchase_type === 'credit' ? tCommon('payment_types.credit') :
                            item.purchase_type === 'agreement' ? tCommon('payment_types.agreement') :
                              tCommon('payment_types.other')
                      }</div>
                      {item.description && <div><strong>{tCommon('detail_labels.description')}</strong> {item.description}</div>}
                    </>);
                })()}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {showDistributionUploadModal && (
        <UploadSaleModal
          open={showDistributionUploadModal}
          onClose={() => setShowDistributionUploadModal(false)}
          onSuccess={() => {
            loadData();
            setShowDistributionUploadModal(false);
          }}
        />
      )}
      {showAddressUploadModal && (
        <UploadAddressModal
          isOpen={showAddressUploadModal}
          onClose={() => setShowAddressUploadModal(false)}
          onSuccess={() => {
            loadData();
            setShowAddressUploadModal(false);
          }}
        />
      )}

      {showSaleModal && (
        <B2BSaleModal
          initialData={editingSale || undefined}
          onSubmit={async (data) => {
            try {
              if (editingSale) {
                await updateB2BSale(editingSale.id, data);
                toast.success(tErrors("success_update"));
              } else {
                await createB2BSale({ ...data, unit_price: Math.floor(data.unit_price), weight: Math.floor(data.weight) });
                toast.success(tErrors("success_create"));
              }
              await loadData();
              setShowSaleModal(false);
              setEditingSale(null);
            } catch (error) {
              console.error(`Failed to ${editingSale ? 'update' : 'create'} sale:`, error);
              handleApiErrorWithToast(error, `${editingSale ? 'Update' : 'Create'} sale`);

            }
          }}
          onClose={() => {
            setShowSaleModal(false);
            setEditingSale(null);
          }}
        />
      )}

      {showProformaModal && viewingProformaData && (
        <SalesProformaModal
          initialData={viewingProformaData}
          readOnly={true}
          onSubmit={async () => {
            // View only - do nothing
            setShowProformaModal(false);
            setViewingProformaData(null);
            setViewingProformaId(null);
          }}
          onClose={() => {
            setShowProformaModal(false);
            setViewingProformaData(null);
            setViewingProformaId(null);
          }}
        />
      )}
    </div>
  );
}
