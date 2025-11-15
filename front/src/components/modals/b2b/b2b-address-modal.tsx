"use client";


import { useState, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Edit2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../../ui/form";
import { Input } from "../../ui/input";
import { SimpleCombobox } from "../../ui/simple-combobox";
import { NumberInput } from "../../ui/number-input";
import { PersianDatePicker } from "../../ui/persian-date-picker";
import { useTranslations } from "next-intl";
import { useCoreData } from "@/lib/core-data-context";
import { CustomerModal } from "../customer-modal";
import { ReceiverModal } from "../receiver-modal";
import { ProductModal } from "../product-modal";
import { createCustomer, createProduct, createReceiver } from "@/lib/api/core";
import { getPartyDisplayName } from "@/lib/utils/party-utils";
import { describeProduct, describeParty, describeOffer } from "@/lib/utils/label-utils";
import { fetchB2BOffers, fetchB2BSales, createB2BSale, fetchB2BAddresss } from "@/lib/api/b2b";
import { B2BOffer, B2BSale, B2BAddress } from "@/lib/interfaces/b2b";
import { B2BSaleModal, type B2BSaleFormData } from "./b2b-sale-modal";
import { toast } from "sonner";

export type B2BAddressFormData = {
  purchase_id: string;
  allocation_id?: string;
  cottage_code?: string;
  product_offer?: number;
  product: number;
  customer: number;
  receiver: number;
  total_weight_purchased: number;
  purchase_date: string;
  unit_price: number;
  payment_amount: number;
  payment_method: string;
  province?: string;
  city?: string;
  tracking_number?: string;
  credit_description?: string;
};

interface B2BAddressModalProps {
  trigger?: React.ReactNode;
  onSubmit?: (data: B2BAddressFormData) => Promise<void>;
  onClose?: () => void;
  initialData?: Partial<B2BAddressFormData>;
  readOnly?: boolean;
  isEditing?: boolean;
}

export function B2BAddressModal({ trigger, onSubmit, onClose, initialData, readOnly = false, isEditing }: B2BAddressModalProps) {
  const tval = useTranslations("modals.b2bAddress.validation");
  const t = useTranslations("modals.b2bAddress");
  const tCommon = useTranslations("common");
  const { products, customers, receivers, refreshData: refreshCoreData } = useCoreData();
  const [offers, setOffers] = useState<B2BOffer[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showReceiverModal, setShowReceiverModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(!readOnly);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [sales, setSales] = useState<B2BSale[]>([]);
  const [lockedSaleId, setLockedSaleId] = useState<number | null>(null);
  const [saleWeightInfo, setSaleWeightInfo] = useState<{
    totalWeight: number;
    allocatedWeight: number;
    remainingWeight: number;
    maxAllocatableWeight: number;
  } | null>(null);
  const [isFetchingSaleAddresses, setIsFetchingSaleAddresses] = useState(false);
  const saleLocked = lockedSaleId !== null;
  const initialAddressMeta = useMemo(() => {
    const dataWithId = initialData as (Partial<B2BAddress> & Partial<B2BAddressFormData>) | undefined;
    return {
      id: dataWithId?.id ?? null,
      purchaseId: dataWithId?.purchase_id ?? initialData?.purchase_id ?? null,
      weight: initialData?.total_weight_purchased ? Number(initialData.total_weight_purchased) : 0,
    };
  }, [initialData]);

  useEffect(() => {
    if (products.length === 0) refreshCoreData('products');
    if (customers.length === 0) refreshCoreData('customers');
    if (receivers.length === 0) refreshCoreData('receivers');
    loadOffers();
    loadSales();
  }, []);

  const loadOffers = async () => {
    try {
      const data = await fetchB2BOffers();
      setOffers(data ?? []);
    } catch (error) {
      console.error('Error loading offers:', error);
    }
  };
  const loadSales = async () => {
    try {
      const data = await fetchB2BSales();
      console.log("KIR",data)
      setSales(data ?? []);
    } catch (error) {
      console.error("Error loading sales:", error);
    }
  };

  const b2bSaleSchema = z.object({
    purchase_id: z.string().min(1, tval("purchase-id")),
    allocation_id: z.string().min(1, tval("allocation-id")),
    cottage_code: z.string().min(1, tval("cottage-code")),
    product_offer: z.number().optional(),
    product: z.number().min(1, tval("product")),
    customer: z.number().min(1, tval("customer")),
    receiver: z.number().min(1, tval("customer")),
    total_weight_purchased: z.union([z.string(), z.number()]).refine(
      (val) => {
        if (val === "" || val === null || val === undefined) return false;
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return !isNaN(num) && num > 0;
      },
      { message: tval("weight-required") }
    ),
    purchase_date: z.string().min(1, tval("date")),
    unit_price: z.number().positive(),
    payment_amount: z.number().min(0.01, tval("amount")),
    payment_method: z.string().min(1, tval("payment-method")),
    province: z.string().min(1, tval("province")),
    city: z.string().min(1, tval("city")),
    tracking_number: z.string().min(1, tval("tracking-number")),
    credit_description: z.string().optional(),
  });

  const [open, setOpen] = useState(trigger ? false : true);

  const form = useForm<B2BAddressFormData>({
    resolver: zodResolver(b2bSaleSchema) as any,
    defaultValues: {
      purchase_id: initialData?.purchase_id || "",
      allocation_id: initialData?.allocation_id || "",
      cottage_code: initialData?.cottage_code || "",
      product_offer: initialData?.product_offer || undefined,
      product: initialData?.product || 0,
      customer: initialData?.customer || 0,
      receiver: initialData?.receiver || undefined,
      total_weight_purchased: initialData?.total_weight_purchased || 0,
      purchase_date: initialData?.purchase_date || "",
      unit_price: initialData?.unit_price || 0,
      payment_amount: initialData?.payment_amount || 0,
      payment_method: initialData?.payment_method || "cash",
      province: initialData?.province || "",
      city: initialData?.city || "",
      tracking_number: initialData?.tracking_number || "",
      credit_description: initialData?.credit_description || "",
    },
  });

  const formatWeight = useCallback((value: number) => {
    const numericValue = Number(value ?? 0);
    if (!Number.isFinite(numericValue)) {
      return "0";
    }
    return new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 2 }).format(numericValue);
  }, []);

  const updateSaleWeightInfo = useCallback(async (sale: B2BSale) => {
    if (!sale?.purchase_id) {
      setSaleWeightInfo(null);
      return;
    }

    setIsFetchingSaleAddresses(true);
    try {
      const addresses = await fetchB2BAddresss({ purchase_id: sale.purchase_id });
      if (form.getValues("purchase_id") !== sale.purchase_id) {
        return;
      }

      const addressList: B2BAddress[] = addresses ?? [];
      const saleTotalWeight = Number(sale.weight || 0);
      const totalAllocated = addressList.reduce(
        (sum, address) => sum + Number(address.total_weight_purchased || 0),
        0
      );
      const editingSameSale = Boolean(isEditing && initialAddressMeta.purchaseId === sale.purchase_id);
      let currentAddressWeight = 0;

      if (editingSameSale) {
        if (initialAddressMeta.id) {
          const matchingAddress = addressList.find((address) => address.id === initialAddressMeta.id);
          currentAddressWeight = Number(
            matchingAddress?.total_weight_purchased ?? initialAddressMeta.weight ?? 0
          );
        } else {
          currentAddressWeight = initialAddressMeta.weight ?? 0;
        }
      }

      const otherAllocations = editingSameSale
        ? Math.max(totalAllocated - currentAddressWeight, 0)
        : totalAllocated;
      const remainingWeight = Math.max(saleTotalWeight - totalAllocated, 0);
      const maxAllocatableWeight = Math.max(saleTotalWeight - otherAllocations, 0);

      setSaleWeightInfo({
        totalWeight: saleTotalWeight,
        allocatedWeight: totalAllocated,
        remainingWeight,
        maxAllocatableWeight,
      });

      const currentWeightValue = Number(form.getValues("total_weight_purchased") || 0);
      const fieldState = form.getFieldState("total_weight_purchased");
      const saleDefaultWeight = saleTotalWeight > 0 ? saleTotalWeight : maxAllocatableWeight;
      if ((!fieldState.isDirty && maxAllocatableWeight >= 0) || currentWeightValue > maxAllocatableWeight) {
        const nextValue = maxAllocatableWeight > 0
          ? Math.min(saleDefaultWeight, maxAllocatableWeight)
          : maxAllocatableWeight;
        form.setValue("total_weight_purchased", nextValue, {
          shouldDirty: fieldState.isDirty,
        });
      }

      if (maxAllocatableWeight <= 0) {
        form.setError("total_weight_purchased", {
          type: "manual",
          message: tval("no-weight-remaining"),
        });
      } else if (form.formState.errors.total_weight_purchased?.type === "manual") {
        form.clearErrors("total_weight_purchased");
      }
    } catch (error) {
      console.error("Failed to fetch sale addresses:", error);
      if (form.getValues("purchase_id") === sale.purchase_id) {
        setSaleWeightInfo(null);
      }
    } finally {
      if (form.getValues("purchase_id") === sale.purchase_id) {
        setIsFetchingSaleAddresses(false);
      }
    }
  }, [form, initialAddressMeta.id, initialAddressMeta.purchaseId, initialAddressMeta.weight, isEditing, tval]);

  const handleSaleSelection = async (sale: B2BSale) => {
    if (!sale) return;
    setLockedSaleId(sale.id ?? -1);
    form.setValue("purchase_id", sale.purchase_id || "");
    const derivedCottageCode =
      sale.cottage_code ||
      sale.cottage_number ||
      (sale as any)?.cottage_code ||
      (sale as any)?.cottage_number;
    if (derivedCottageCode) {
      form.setValue("cottage_code", derivedCottageCode, { shouldDirty: true });
    } else {
      form.setValue("cottage_code", "", { shouldDirty: true });
    }
    form.setValue(
      "product_offer",
      sale.offer !== null && sale.offer !== undefined ? sale.offer : undefined
    );
    if (sale.product) {
      form.setValue("product", Number(sale.product));
    }
    if (sale.customer) {
      form.setValue("customer", Number(sale.customer));
    }
    form.setValue(
      "total_weight_purchased",
      Number(sale.weight || 0)
    );
    form.setValue("unit_price", Number(sale.unit_price || 0));
    form.setValue("payment_amount", Number(sale.total_price || 0));
    form.setValue("purchase_date", sale.sale_date || "");
    form.setValue("payment_method", sale.purchase_type || "cash");
    setSaleWeightInfo(null);
    await updateSaleWeightInfo(sale);
  };
  const clearSaleLock = useCallback(() => {
    setLockedSaleId(null);
    setSaleWeightInfo(null);
    setIsFetchingSaleAddresses(false);
    form.clearErrors("total_weight_purchased");
  }, [form]);

  const handleSaleModalSubmit = async (data: B2BSaleFormData) => {
    try {
      const created = await createB2BSale({
        ...data,
        weight: Number(data.weight),
        unit_price: Number(data.unit_price),
      });
      toast.success(t("sale_created"));
      await loadSales();
      setShowSaleModal(false);
      await handleSaleSelection(created);
    } catch (error) {
      console.error("Failed to create sale:", error);
      toast.error(t("sale_creation_failed"));
      throw error;
    }
  };

  useEffect(() => {
    if (!initialAddressMeta.purchaseId) return;
    if (sales.length === 0) return;
    const currentPurchaseId = form.getValues("purchase_id");
    if (currentPurchaseId !== initialAddressMeta.purchaseId) return;
    const existingSale = sales.find((sale) => sale.purchase_id === initialAddressMeta.purchaseId);
    if (existingSale) {
      void updateSaleWeightInfo(existingSale);
    }
  }, [sales, initialAddressMeta.purchaseId, form, updateSaleWeightInfo]);

  const handleWeightInputChange = (value: number) => {
    const numericValue = Number(value || 0);
    if (saleWeightInfo) {
      const maxAllowed = saleWeightInfo.maxAllocatableWeight;
      if (maxAllowed <= 0) {
        form.setError("total_weight_purchased", {
          type: "manual",
          message: tval("no-weight-remaining"),
        });
      } else if (numericValue > maxAllowed) {
        form.setError("total_weight_purchased", {
          type: "manual",
          message: tval("weight-exceeds-sale", {
            max: formatWeight(maxAllowed),
          }),
        });
      } else if (form.formState.errors.total_weight_purchased?.type === "manual") {
        form.clearErrors("total_weight_purchased");
      }
    }
    form.setValue("total_weight_purchased", numericValue, { shouldDirty: true });
  };

  const handleSubmit = async (data: any) => {
    if (saleWeightInfo) {
      const maxAllowed = saleWeightInfo.maxAllocatableWeight;
      const numericWeight = Number(data.total_weight_purchased || 0);
      if (maxAllowed <= 0) {
        form.setError("total_weight_purchased", {
          type: "manual",
          message: tval("no-weight-remaining"),
        });
        return;
      }
      if (numericWeight > maxAllowed) {
        form.setError("total_weight_purchased", {
          type: "manual",
          message: tval("weight-exceeds-sale", { max: formatWeight(maxAllowed) }),
        });
        return;
      }
    }
    try {
      await onSubmit?.(data);
      if (trigger) {
        setOpen(false);
      } else {
        onClose?.();
      }
      form.reset();
      clearSaleLock();
    } catch (error) {
      // Error is already handled and displayed by the API client
    }
  };

  const handleClose = () => {
    clearSaleLock();
    if (trigger) {
      setOpen(false);
    } else {
      onClose?.();
    }
  };

  const getSaleOptionLabel = (sale: B2BSale) => {
    const fullLabel = `${sale.purchase_id}${sale.customer_name ? ` - ${sale.customer_name}` : ""}`;
    if (fullLabel.length <= 60) {
      return fullLabel;
    }
    return `${fullLabel.slice(0, 57)}...`;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={trigger ? setOpen : handleClose}>
        {trigger && (
          <DialogTrigger asChild>
            {trigger}
          </DialogTrigger>
        )}
        <DialogContent dir="rtl" className="min-w-[75%] max-h-[90vh] overflow-y-auto scrollbar-hide p-0 my-0 mx-auto [&>button]:hidden">
          <DialogHeader className="px-3.5 py-4.5 justify-start relative" style={{ backgroundColor: "#f6d265" }}>
            <DialogTitle className="font-bold text-white text-right">{t("title")}</DialogTitle>
            {readOnly && !isEditMode && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                onClick={() => setIsEditMode(true)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4 px-12">
              <fieldset disabled={!isEditMode} className="space-y-6">
              {/* Row 1: IDs */}
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control as any}
                  name="allocation_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("allocation-id")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          readOnly={isEditing}
                          className={isEditing ? "bg-white cursor-not-allowed" : ""}
                          autoFocus={false}
                          tabIndex={isEditing ? -1 : undefined}
                        />
                      </FormControl>
                      <FormMessage className="min-h-[1.25rem]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="purchase_id"
                  render={({ field }) => (
                    <FormItem className="min-w-0">
                      <FormLabel>{t("purchase-id")}</FormLabel>
                      <FormControl className="min-w-0">
                        <SimpleCombobox
                          className="min-w-0"
                          value={field.value || ""}
                          onValueChange={(value) => {
                            if (!value) {
                              field.onChange("");
                              clearSaleLock();
                              form.setValue("cottage_code", "", { shouldDirty: true });
                              return;
                            }
                            field.onChange(value);
                            const selectedSale = sales.find(
                              (sale) => sale.purchase_id === value
                            );
                            if (selectedSale) {
                              void handleSaleSelection(selectedSale);
                            } else {
                              setSaleWeightInfo(null);
                              setIsFetchingSaleAddresses(false);
                              form.clearErrors("total_weight_purchased");
                            }
                          }}
                          options={sales.map((sale) => ({
                            value: sale.purchase_id,
                            label: getSaleOptionLabel(sale),
                            id: sale.id,
                            name: `${sale.purchase_id}${sale.customer_name ? ` - ${sale.customer_name}` : ""}`,
                          }))}
                          placeholder={t("select-sale")}
                          searchPlaceholder={tCommon(
                            "search_placeholders.search_sales"
                          )}
                          disabled={!isEditMode}
                          showCreateNew={isEditMode && !saleLocked}
                          createNewText={t("create-sale")}
                          onCreateNew={() => setShowSaleModal(true)}
                        />
                      </FormControl>
                      <FormMessage className="min-h-[1.25rem]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="cottage_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("cottage-code")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          readOnly
                          tabIndex={-1}
                          className="bg-gray-100 cursor-not-allowed"
                        />
                      </FormControl>
                      <FormMessage className="min-h-[1.25rem]" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 2: Product and Customer */}
              <div className="grid grid-cols-2 gap-4 items-start">
                <FormField
                  control={form.control as any}
                  name="product"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("product")}</FormLabel>
                      <FormControl>
                        <SimpleCombobox
                          value={field.value > 0 ? field.value.toString() : ""}
                          onValueChange={(value) => {
                            if (value) {
                              field.onChange(Number(value));
                            }
                          }}
                          options={products.map(product => ({
                            value: product.id.toString(),
                            label: describeProduct(product),
                            id: product.id,
                            name: product.name
                          }))}
                          placeholder={t("select-product")}
                          searchPlaceholder={tCommon("search_placeholders.search_products")}
                          disabled={!isEditMode || saleLocked}
                          showCreateNew={isEditMode && !saleLocked}
                          createNewText={t("create-new-product")}
                          onCreateNew={() => setShowProductModal(true)}
                        />
                      </FormControl>
                      <FormMessage className="min-h-[1.25rem]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="customer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("customer")}</FormLabel>
                      <FormControl>
                        <SimpleCombobox
                          value={field.value > 0 ? field.value.toString() : ""}
                          onValueChange={(value) => {
                            if (value) {
                              field.onChange(Number(value));
                            }
                          }}
                          options={customers.map(customer => ({
                            value: customer.id.toString(),
                            label: describeParty(customer),
                            id: customer.id,
                            name: getPartyDisplayName(customer)
                          }))}
                          placeholder={t("select-customer")}
                          searchPlaceholder={tCommon("search_placeholders.search_customers")}
                          disabled={!isEditMode || saleLocked}
                          showCreateNew={isEditMode && !saleLocked}
                          createNewText={t("create-new-customer")}
                          onCreateNew={() => setShowCustomerModal(true)}
                        />
                      </FormControl>
                      <FormMessage className="min-h-[1.25rem]" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 3: Receiver and Offer */}
              <div className="grid grid-cols-2 gap-4 items-start">
                <FormField
                  control={form.control as any}
                  name="receiver"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("receiver")} <span className="text-gray-400 text-sm"></span></FormLabel>
                      <FormControl>
                        <SimpleCombobox
                          value={field.value ? field.value.toString() : ""}
                          onValueChange={(value) => {
                            if (value && value !== "no-receiver") {
                              field.onChange(Number(value));
                            } else {
                              field.onChange(undefined);
                            }
                          }}
                          options={[
                            { value: "no-receiver", label: t("no-receiver") },
                            ...receivers.map(receiver => ({
                              value: receiver.id.toString(),
                              label: describeParty(receiver),
                              id: receiver.id,
                              name: getPartyDisplayName(receiver)
                            }))
                          ]}
                          placeholder={t("select-receiver")}
                          searchPlaceholder={tCommon("search_placeholders.search_receivers")}
                          showCreateNew={true}
                          createNewText={t("create-new-receiver")}
                          onCreateNew={() => setShowReceiverModal(true)}
                        />
                      </FormControl>
                      <FormMessage className="min-h-[1.25rem]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="product_offer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("product-offer")} <span className="text-gray-400 text-sm">{t("optional")}</span></FormLabel>
                      <FormControl>
                        <SimpleCombobox
                          value={field.value ? field.value.toString() : ""}
                          onValueChange={(value) => {
                            field.onChange(value && value !== "no-offer" ? Number(value) : undefined);
                          }}
                          options={[
                            { value: "no-offer", label: t("no-offer") },
                            ...offers.map(offer => ({
                              value: offer.id.toString(),
                              label: describeOffer(offer),
                              id: offer.id,
                              name: offer.offer_id
                            }))
                          ]}
                          placeholder={t("select-offer")}
                          searchPlaceholder={tCommon("search_placeholders.search_offers")}
                          disabled={!isEditMode || saleLocked}
                        />
                      </FormControl>
                      <FormMessage className="min-h-[1.25rem]" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 4: Weight, Amount, Date */}
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control as any}
                  name="total_weight_purchased"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("weight")}
                        {saleWeightInfo ? (
                          <span className="mr-2 text-xs text-gray-500">
                            {t("weight-remaining-label", {
                              remaining: formatWeight(saleWeightInfo.remainingWeight),
                            })}
                          </span>
                        ) :
                          isFetchingSaleAddresses && (
                            <span className="mr-2 text-xs text-gray-400">
                              {t("weight-remaining-loading")}
                            </span>
                          )}
                      </FormLabel>
                      <FormControl>
                        <NumberInput
                          value={field.value || 0}
                          onChange={handleWeightInputChange}
                        />
                      </FormControl>
                      <FormMessage className="min-h-[1.25rem]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="unit_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("unit-price")}</FormLabel>
                      <FormControl>
                        <NumberInput
                          value={field.value || 0}
                          onChange={(value) => field.onChange(value)}
                        />
                      </FormControl>
                      <FormMessage className="min-h-[1.25rem]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="payment_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("payment-amount")}</FormLabel>
                      <FormControl>
                        <NumberInput
                          value={field.value || 0}
                          onChange={(value) => field.onChange(value)}
                        />
                      </FormControl>
                      <FormMessage className="min-h-[1.25rem]" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 5: Payment Method and Date */}
              <div className="grid grid-cols-2 gap-4 items-start">
                <FormField
                  control={form.control as any}
                  name="payment_method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("payment-method")}</FormLabel>
                      <SimpleCombobox
                        value={field.value}
                        onValueChange={field.onChange}
                        options={[
                          { value: "cash", label: t("cash") },
                          { value: "credit", label: t("credit") },
                          { value: "installment", label: t("installment") }
                        ]}
                        placeholder={t("select-payment-method")}
                        searchPlaceholder={tCommon("search_placeholders.search_payment_methods")}
                      />
                      <FormMessage className="min-h-[1.25rem]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="purchase_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("purchase-date")}</FormLabel>
                      <FormControl>
                        <PersianDatePicker
                          value={field.value}
                          onChange={(value) => field.onChange(value)}
                          placeholder={t("select-date")}
                        />
                      </FormControl>
                      <FormMessage className="min-h-[1.25rem]" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 6: Province, City, Tracking */}
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control as any}
                  name="province"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("province")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage className="min-h-[1.25rem]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("city")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage className="min-h-[1.25rem]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="tracking_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("tracking-number")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage className="min-h-[1.25rem]" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Description */}
              <FormField
                control={form.control as any}
                name="credit_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("description")} <span className="text-gray-400 text-sm">{t("optional")}</span></FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage className="min-h-[1.25rem]" />
                  </FormItem>
                )}
              />
              </fieldset>

              {isEditMode && (
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={handleClose}>
                    {t("cancel")}
                  </Button>
                  <Button type="submit" className="hover:bg-[#f6d265]">{t("save")}</Button>
                </div>
              )}
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {showProductModal && (
        <ProductModal
          onSubmit={async (data) => {
            const created = await createProduct(data);
            if (created) {
              await refreshCoreData('products');
              form.setValue('product', created.id);
              setShowProductModal(false);
            }
          }}
          onClose={() => setShowProductModal(false)}
        />
      )}

      {showCustomerModal && (
        <CustomerModal
          onSubmit={async (data) => {
            const created = await createCustomer(data);
            if (created) {
              await refreshCoreData('customers');
              form.setValue('customer', created.id);
              setShowCustomerModal(false);
            }
          }}
          onClose={() => setShowCustomerModal(false)}
        />
      )}

      {showReceiverModal && (
        <ReceiverModal
          onSubmit={async (data) => {
            const created = await createReceiver(data);
            if (created) {
              await refreshCoreData('receivers');
              form.setValue('receiver', created.id);
              setShowReceiverModal(false);
            }
          }}
          onClose={() => setShowReceiverModal(false)}
        />
      )}

      {showSaleModal && (
        <B2BSaleModal
          onSubmit={handleSaleModalSubmit}
          onClose={() => setShowSaleModal(false)}
        />
      )}
    </>
  );
}
