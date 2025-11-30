"use client";


import { useState, useEffect, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../../ui/form";
import { Input } from "../../ui/input";
import { SimpleCombobox } from "../../ui/simple-combobox";
import { Plus, Trash2, Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCoreData } from "@/lib/core-data-context";
import { useModal } from "@/lib/modal-context";
import { PersianDatePicker } from "../../ui/persian-date-picker";
import { getTodayGregorian } from "@/lib/utils/persian-date";
import { getPartyDisplayName } from "@/lib/utils/party-utils";
import { describeWarehouseReceipt, describeB2BAddress, describeShippingCompany, describeProduct, describeParty } from "@/lib/utils/label-utils";
import { ProductFormData, ProductModal } from "../product-modal";
import { ShippingCompanyFormData, ShippingCompanyModal } from "../shipping-company-modal";
import { B2BAddressFormData, B2BAddressModal } from "../b2b/b2b-address-modal";
import { createProduct, createShippingCompany, incrementIndicatorCounter } from "@/lib/api/core";
import { fetchB2BAddresss, createB2BAddress, fetchB2BSales, fetchB2BDistributions, fetchB2BOffers, fetchB2BAddressById, fetchB2BDistributionById, fetchB2BOfferById } from "@/lib/api/b2b";
import { fetchWarehouseReceipts, fetchWarehouseReceiptById } from "@/lib/api/warehouse";
import { B2BDistribution, B2BOffer, B2BSale, B2BAddress } from "@/lib/interfaces/b2b";
import { WarehouseReceipt } from "@/lib/interfaces/warehouse";
import { describeDistribution, describeOffer } from "@/lib/utils/label-utils";
import { B2BDistributionModal } from "../b2b/b2b-distribution-modal";
import { B2BOfferModal } from "../b2b/b2b-offer-modal";
import { WarehouseReceiptModal } from "./warehouse-receipt-modal";
import { useDefaultIndicator } from "@/lib/hooks/use-default-indicator";
import { IndicatorCapacityGuard } from "@/components/indicator-capacity-guard";
import { toPersianDigits } from "@/lib/utils/numbers";
import {
  DEFAULT_INDICATOR_TEMPLATE,
  buildIndicatorPreview,
  renderIndicatorFormat,
  compactIndicatorValue,
} from "@/lib/indicator-format";
import {
  renderLocalizedValue,
  VALUE_PLACEHOLDER,
} from "@/lib/utils/localized-value";

type DeliveryFulfillmentFormData = {
  delivery_id: string;
  waybill_serial: string;
  issue_date: string;
  b2b_address: number;
  warehouse_receipt: number;
  warehouse: number;
  description?: string;
  shipping_company: number;
  driver_name: string;
  driver_phone: string;
  driver_license_plate: string;
  items: {
    product: number;
    weight: string | number;
    destination?: string;
    receiver: string;
    customer: number;
    fare?: string | number;
  }[];
};

interface DeliveryFulfillmentModalProps {
  trigger?: React.ReactNode;
  onSubmit?: (data: any) => void;
  onClose?: () => void;
  initialData?: any;
  isEditing?: boolean;
}

export function DeliveryFulfillmentModal({ trigger, onSubmit, onClose, initialData, isEditing }: DeliveryFulfillmentModalProps) {
  const tval = useTranslations("modals.deliveryFulfillment.validation");
  const t = useTranslations("modals.deliveryFulfillment");
  const tCommon = useTranslations("common");
  const { data, refreshData } = useCoreData();
  const { openModal } = useModal();
  const [b2bAddresses, setB2bAddresses] = useState<any[]>([]);
  const [warehouseReceipts, setWarehouseReceipts] = useState<any[]>([]);
  const [cottageCodeError, setCottageCodeError] = useState<string>("");
  const [b2bSales, setB2bSales] = useState<B2BSale[]>([]);
  const [b2bDistributions, setB2bDistributions] = useState<B2BDistribution[]>([]);
  const [b2bOffers, setB2bOffers] = useState<B2BOffer[]>([]);
  const [linkedDistribution, setLinkedDistribution] = useState<B2BDistribution | null>(null);
  const [linkedOffer, setLinkedOffer] = useState<B2BOffer | null>(null);

  // State for viewing modals
  const [viewingAddress, setViewingAddress] = useState<B2BAddress | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<WarehouseReceipt | null>(null);
  const [viewingDistribution, setViewingDistribution] = useState<B2BDistribution | null>(null);
  const [viewingOffer, setViewingOffer] = useState<B2BOffer | null>(null);

  useEffect(() => {
    if (data.products.length === 0) {
      refreshData('products');
    }
    if (data.shippingCompanies.length === 0) {
      refreshData('shippingCompanies');
    }
    if (data.customers.length === 0) {
      refreshData('customers');
    }
    if (data.warehouses.length === 0) {
      refreshData('warehouses');
    }
  }, []);

  const getTodayDate = () => {
    if (typeof window === 'undefined') return '';
    return getTodayGregorian();
  };

  const deliveryItemSchema = z.object({
    product: z.number().min(1, tval("product-required")),
    weight: z.union([z.string(), z.number()]).refine((val) => {
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return !isNaN(num) && num > 0;
    }, { message: tval("weight") }),
    destination: z.string().optional(),
    receiver: z.string().min(1, tval("receiver")),
    customer: z.number().min(1, tval("customer")),
    fare: z.union([z.string(), z.number()]).refine((val) => {
      if (val === undefined || val === null || val === '') return false;
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return !isNaN(num) && num > 0;
    }, { message: tval("fare") }),
  });

  const deliveryFulfillmentSchema = z.object({
    delivery_id: z.string().min(1, tval("delivery-id")),
    waybill_serial: z.string().min(1, tval("waybill-serial")),
    issue_date: z.string().min(1, tval("issue-date")),
    b2b_address: z.number().min(1, tval("b2b-address")),
    warehouse_receipt: z.number().min(1, tval("warehouse-receipt")),
    warehouse: z.number().min(1, tval("warehouse")),
    description: z.string().optional(),
    shipping_company: z.number().min(1, tval("shipping-company")),
    driver_name: z.string().min(1, tval("driver-name")),
    driver_phone: z.string().min(1, tval("driver-phone")),
    driver_license_plate: z.string().min(1, tval("driver-license-plate")),
    items: z.array(deliveryItemSchema).min(1, tval("items")),
  });

  const [open, setOpen] = useState(trigger ? false : true);

  // Initialize linked offer/distribution when editing
  useEffect(() => {
    if (open && isEditing && initialData) {
      // If editing and delivery has offer, load it
      if (initialData.offer && b2bOffers.length > 0) {
        const offer = b2bOffers.find(o => o.id === initialData.offer);
        if (offer) {
          setLinkedOffer(offer);
          setLinkedDistribution(null);
        }
      }
      // If editing and delivery has distribution, load it
      else if (initialData.distribution && b2bDistributions.length > 0) {
        const distribution = b2bDistributions.find(d => d.id === initialData.distribution);
        if (distribution) {
          setLinkedDistribution(distribution);
          setLinkedOffer(null);
        }
      }
    }
  }, [open, isEditing, initialData, b2bOffers, b2bDistributions]);

  // Re-fetch B2B addresses, warehouse receipts, and B2B data whenever modal opens
  useEffect(() => {
    if (open) {
      // Load B2B addresses
      fetchB2BAddresss().then((addresses) => {
        if (addresses) setB2bAddresses(addresses);
      });
      // Load warehouse receipts
      fetchWarehouseReceipts().then((receipts) => {
        if (receipts) setWarehouseReceipts(receipts);
      });
      // Load B2B sales
      fetchB2BSales().then((sales) => {
        if (sales) setB2bSales(sales);
      });
      // Load B2B distributions
      fetchB2BDistributions().then((distributions) => {
        if (distributions) setB2bDistributions(distributions);
      });
      // Load B2B offers
      fetchB2BOffers().then((offers) => {
        if (offers) setB2bOffers(offers);
      });
    }
  }, [open]);

  const form = useForm<DeliveryFulfillmentFormData>({
    resolver: zodResolver(deliveryFulfillmentSchema) as any,
    defaultValues: {
      delivery_id: initialData?.delivery_id
        ? compactIndicatorValue(initialData.delivery_id)
        : "",
      waybill_serial: initialData?.waybill_serial || "",
      issue_date: initialData?.issue_date || getTodayDate(),
      b2b_address: initialData?.b2b_address || 0,
      warehouse_receipt: initialData?.warehouse_receipt || 0,
      warehouse: initialData?.warehouse || 0,
      description: initialData?.description || "",
      shipping_company: initialData?.shipping_company || 0,
      driver_name: initialData?.driver_name || "",
      driver_phone: initialData?.driver_phone || "",
      driver_license_plate: initialData?.driver_license_plate || "",
      items: initialData?.items || [{ product: 0, weight: 0, destination: "", receiver: "", customer: 0, fare: 0 }],
    },
  });

  const defaultIndicator = useDefaultIndicator({
    section: "delivery_fulfillment",
    form,
    fieldName: "delivery_id",
    enabled: !isEditing && !initialData?.delivery_id,
    formatWithSpacing: true,
  });

  const isCounterExhausted = useMemo(
    () =>
      !!defaultIndicator &&
      typeof defaultIndicator.counter === "number" &&
      typeof defaultIndicator.end_number === "number" &&
      defaultIndicator.counter >= defaultIndicator.end_number,
    [defaultIndicator]
  );

  const indicatorPreview = useMemo(() => {
    if (!defaultIndicator) return null;
    return buildIndicatorPreview(
      defaultIndicator.format_template || DEFAULT_INDICATOR_TEMPLATE,
      {
        counter: (defaultIndicator.counter ?? 0) + 2,
      }
    );
  }, [defaultIndicator]);

    const currentIndicatorPreview = useMemo(() => {
    if (!defaultIndicator) return null;
    return buildIndicatorPreview(
      defaultIndicator.format_template || DEFAULT_INDICATOR_TEMPLATE,
      {
        counter: (defaultIndicator.counter ?? 0) + 1,
      }
    );
  }, [defaultIndicator]);

  const indicatorDescriptionTemplate = useMemo(
    () => tCommon("indicator_next_value", { value: VALUE_PLACEHOLDER }),
    [tCommon]
  );
  const hasExistingDeliveryId = Boolean(initialData?.delivery_id);
  const showDeliveryInput = hasExistingDeliveryId || !indicatorPreview;
  const showGeneratedDeliveryPreview =
    !hasExistingDeliveryId && !!indicatorPreview && !!currentIndicatorPreview;
  const deliveryInputClassNames = [
    "font-mono",
    "text-right",
    hasExistingDeliveryId ? "bg-gray-100" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Watch b2b_address changes to auto-fill warehouse_receipt based on cottage_code
  // and auto-fill customer field
  const selectedB2BAddressId = form.watch("b2b_address");
  const selectedWarehouseReceiptId = form.watch("warehouse_receipt");

  useEffect(() => {
    if (selectedB2BAddressId > 0 && b2bAddresses.length > 0 && warehouseReceipts.length > 0) {
      const selectedAddress = b2bAddresses.find(addr => addr.id === selectedB2BAddressId);

      if (selectedAddress && selectedAddress.cottage_code) {
        // Find warehouse receipt with matching cottage_serial_number
        const matchingReceipt = warehouseReceipts.find(
          receipt => receipt.cottage_serial_number === selectedAddress.cottage_code
        );

        if (matchingReceipt) {
          // Found matching receipt - auto-fill and clear error
          form.setValue('warehouse_receipt', matchingReceipt.id);
          // Also auto-fill warehouse from the receipt
          if (matchingReceipt.warehouse) {
            form.setValue('warehouse', matchingReceipt.warehouse);
          }
          setCottageCodeError("");
        } else {
          // No matching receipt found - set error and clear fields
          form.setValue('warehouse_receipt', 0);
          form.setValue('warehouse', 0);
          setCottageCodeError("رسید انباری با این کد کوتاژ مطابقت ندارد");
        }
      } else {
        // No cottage_code in selected address - clear fields and error
        form.setValue('warehouse_receipt', 0);
        form.setValue('warehouse', 0);
        setCottageCodeError("");
      }

      // Auto-fill customer from B2B address
      if (selectedAddress && selectedAddress.customer) {
        const items = form.getValues('items');
        if (items && items.length > 0) {
          items.forEach((_item, index) => {
            form.setValue(`items.${index}.customer`, selectedAddress.customer, { shouldValidate: true });
          });
        }
      }

      // Find the corresponding B2B Sale and determine if we need to show distribution or offer
      // BUT: Skip this if we're editing and already have offer/distribution initialized from initialData
      const isEditingWithExistingData = isEditing && initialData &&
        (initialData.offer || initialData.distribution) &&
        selectedB2BAddressId === initialData.b2b_address;

      if (selectedAddress && !isEditingWithExistingData) {
        let foundOffer = false;
        let foundDistribution = false;

        // Method 1: Try to find via B2BSale (most complete information)
        if (selectedAddress.purchase_id && b2bSales.length > 0) {
          const matchingSale = b2bSales.find(sale => sale.purchase_id === selectedAddress.purchase_id);

          if (matchingSale) {
            if (matchingSale.is_distributor && matchingSale.b2b_distribution) {
              // Case 1: عاملیت توزیع - find and set the distribution
              const distribution = b2bDistributions.find(d => d.id === matchingSale.b2b_distribution);
              if (distribution) {
                setLinkedDistribution(distribution);
                setLinkedOffer(null);
                foundDistribution = true;
              }
            } else if (!matchingSale.is_distributor && matchingSale.offer) {
              // Case 2: فروش شما with offer - find and set the offer
              const offer = b2bOffers.find(o => o.id === matchingSale.offer);
              if (offer) {
                setLinkedOffer(offer);
                setLinkedDistribution(null);
                foundOffer = true;
              }
            }
          }
        }

        // Method 2: If no B2BSale found, try using product_offer directly from B2BAddress
        if (!foundOffer && !foundDistribution && selectedAddress.product_offer && b2bOffers.length > 0) {
          const offer = b2bOffers.find(o => o.id === selectedAddress.product_offer);
          if (offer) {
            setLinkedOffer(offer);
            setLinkedDistribution(null);
            foundOffer = true;
          }
        }

        // If nothing found, clear both
        if (!foundOffer && !foundDistribution) {
          setLinkedDistribution(null);
          setLinkedOffer(null);
        }
      } else if (!selectedAddress) {
        // No address selected - clear both
        setLinkedDistribution(null);
        setLinkedOffer(null);
      }
    }
  }, [selectedB2BAddressId, b2bAddresses, warehouseReceipts, b2bSales, b2bDistributions, b2bOffers, form, isEditing, initialData]);

  // Auto-fill product from warehouse receipt items
  useEffect(() => {
    if (selectedWarehouseReceiptId > 0 && warehouseReceipts.length > 0) {
      const selectedReceipt = warehouseReceipts.find(receipt => receipt.id === selectedWarehouseReceiptId);

      if (selectedReceipt && selectedReceipt.items && selectedReceipt.items.length > 0) {
        const items = form.getValues('items');

        // Auto-fill product from the first warehouse receipt item
        const firstProduct = selectedReceipt.items[0].product;
        if (firstProduct) {
          items.forEach((item, index) => {
            if (item.product === 0) {
              form.setValue(`items.${index}.product`, firstProduct);
            }
          });
        }
      }
    }
  }, [selectedWarehouseReceiptId, warehouseReceipts, form]);

  const handleSubmit = async (data: any) => {
    if (isCounterExhausted) return;
    // Prevent submission if there's a cottage code error
    if (cottageCodeError) {
      return;
    }

    try {
      if (onSubmit) {
        await onSubmit(data);
      }
      if (!isEditing && defaultIndicator) {
        try {
          await incrementIndicatorCounter(defaultIndicator.id);
        } catch (error) {
          console.error("Failed to increment indicator counter:", error);
        }
      }
      // Only close and reset if successful
      if (trigger) {
        setOpen(false);
      } else {
        onClose?.();
      }
      form.reset();
    } catch (error) {
      console.error("Error in form submission:", error);
      // Don't close the modal if there's an error
    }
  };

  const handleClose = () => {
    if (trigger) {
      setOpen(false);
    } else {
      onClose?.();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={trigger ? setOpen : handleClose}>
        {trigger && (
          <DialogTrigger asChild>
            {trigger}
          </DialogTrigger>
        )}
        <DialogContent dir="rtl" className="min-w-[85%] max-h-[90vh] overflow-y-auto scrollbar-hide  p-0 my-0 mx-auto [&>button]:hidden">
          <IndicatorCapacityGuard indicator={defaultIndicator} />
          <DialogHeader className="px-3.5 py-4.5  justify-start" style={{ backgroundColor: "#f6d265" }}>
            <DialogTitle className="font-bold text-white text-right">{t("title")}</DialogTitle>
            <DialogDescription className="sr-only">Create or edit delivery fulfillment</DialogDescription>
          </DialogHeader>

          <Form {...form} >
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4 px-6">
              <fieldset disabled={isCounterExhausted} className="space-y-6">
              <div className="grid grid-cols-4 gap-4 items-start">
                <FormField
                  control={form.control as any}
                  name="delivery_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("delivery-id")}</FormLabel>
                      <FormControl>
                        {showDeliveryInput ? (
                          <Input
                            {...field}
                            value={toPersianDigits(field.value ?? "")}
                            dir="rtl"
                            className={deliveryInputClassNames}
                            placeholder={t("delivery-id")}
                            readOnly
                          />
                        ) : (
                          <input type="hidden" {...field} value={field.value ?? ""} />
                        )}
                      </FormControl>
                      {showGeneratedDeliveryPreview && currentIndicatorPreview && (
                        <div
                          className="flex h-9 w-full items-center justify-start rounded-md border border-input bg-gray-100 px-3 py-1 text-sm text-right shadow-sm"
                          dir="rtl"
                        >
                          {renderLocalizedValue(
                            "",
                            currentIndicatorPreview.parts.map((part, index) => (
                              <bdi
                                key={`delivery-fulfillment-preview-${index}`}
                                dir="auto"
                                className="leading-none"
                              >
                                {part}
                              </bdi>
                            )),
                            "font-mono"
                          )}
                        </div>
                      )}
                      {showGeneratedDeliveryPreview && indicatorPreview && (
                        <FormDescription className="text-xs text-muted-foreground" dir="rtl">
                          {renderLocalizedValue(
                            indicatorDescriptionTemplate,
                            indicatorPreview.parts.map((part, index) => (
                              <bdi
                                key={`delivery-fulfillment-preview-desc-${index}`}
                                dir="auto"
                                className="leading-none"
                              >
                                {part}
                              </bdi>
                            )),
                            "font-mono"
                          )}
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="waybill_serial"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("waybill-serial")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="b2b_address"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="flex items-center gap-2">
                        {t("b2b-address")}
                        {field.value > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 p-0 hover:bg-transparent"
                            onClick={async () => {
                              try {
                                const address = await fetchB2BAddressById(field.value);
                                if (address) setViewingAddress(address);
                              } catch (error) {
                                console.error("Failed to fetch address:", error);
                              }
                            }}
                          >
                            <Info className="h-4 w-4 text-[#f6d265]" />
                          </Button>
                        )}
                      </FormLabel>
                      <FormControl>
                        <SimpleCombobox
                          value={field.value > 0 ? field.value.toString() : ""}
                          onValueChange={(value) => {
                            if (value) {
                              field.onChange(Number(value));
                            }
                          }}
                          options={b2bAddresses.map((address) => ({
                            value: address.id.toString(),
                            label: describeB2BAddress(address),
                            id: address.id
                          }))}
                          placeholder={t("select-b2b-address")}
                          searchPlaceholder={tCommon("search_placeholders.search")}
                          showCreateNew={true}
                          createNewText={t("create-new-b2b-address")}
                          onCreateNew={() => {
                            openModal(B2BAddressModal, {
                              onSubmit: async (newAddress: B2BAddressFormData) => {
                                const created = await createB2BAddress(newAddress);
                                if (created) {
                                  const addresses = await fetchB2BAddresss();
                                  if (addresses) setB2bAddresses(addresses);
                                  form.setValue('b2b_address', created.id);
                                }
                              }
                            });
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                      {cottageCodeError && (
                        <p className="text-sm font-medium text-destructive mt-2">
                          {cottageCodeError}
                        </p>
                      )}
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-4 gap-4 items-start">
                <FormField
                  control={form.control as any}
                  name="warehouse_receipt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 min-h-[24px]">
                        {t("warehouse-receipt")}
                        {field.value > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 p-0 hover:bg-transparent"
                            onClick={async () => {
                              try {
                                const receipt = await fetchWarehouseReceiptById(field.value);
                                if (receipt) setViewingReceipt(receipt);
                              } catch (error) {
                                console.error("Failed to fetch receipt:", error);
                              }
                            }}
                          >
                            <Info className="h-4 w-4 text-[#f6d265]" />
                          </Button>
                        )}
                      </FormLabel>
                      <FormControl>
                        <SimpleCombobox
                          value={field.value > 0 ? field.value.toString() : ""}
                          onValueChange={(value) => {
                            if (value) {
                              field.onChange(Number(value));
                            }
                          }}
                          options={warehouseReceipts.map((receipt) => ({
                            value: receipt.id.toString(),
                            label: describeWarehouseReceipt(receipt),
                            id: receipt.id
                          }))}
                          placeholder={t("select-warehouse-receipt")}
                          searchPlaceholder={tCommon("search_placeholders.search")}
                          disabled={true}
                          showCreateNew={false}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="warehouse"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block min-h-[24px]">
                        {t("warehouse")}
                      </FormLabel>
                      <FormControl>
                        <SimpleCombobox
                          value={field.value > 0 ? field.value.toString() : ""}
                          onValueChange={(value) => {
                            if (value) {
                              field.onChange(Number(value));
                            }
                          }}
                          options={data.warehouses.map((warehouse) => ({
                            value: warehouse.id.toString(),
                            label: warehouse.name,
                            id: warehouse.id
                          }))}
                          placeholder={t("select-warehouse")}
                          searchPlaceholder={tCommon("search_placeholders.search")}
                          disabled={true}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="shipping_company"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="block min-h-[24px]">{t("shipping-company")}</FormLabel>
                      <FormControl>
                        <SimpleCombobox
                          value={field.value > 0 ? field.value.toString() : ""}
                          onValueChange={(value) => {
                            if (value) {
                              field.onChange(Number(value));
                            }
                          }}
                          options={data.shippingCompanies.map((company) => ({
                            value: company.id.toString(),
                            label: describeShippingCompany(company),
                            id: company.id,
                            name: company.name
                          }))}
                          placeholder={t("select-shipping-company")}
                          searchPlaceholder={tCommon("search_placeholders.search")}
                          showCreateNew={true}
                          createNewText={t("create-new-shipping-company")}
                          onCreateNew={() => {
                            openModal(ShippingCompanyModal, {
                              onSubmit: async (newCompany: ShippingCompanyFormData) => {
                                const created = await createShippingCompany(newCompany);
                                if (created) {
                                  await refreshData('shippingCompanies');
                                  form.setValue('shipping_company', created.id);
                                }
                              }
                            });
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 items-start">
                <FormField
                  control={form.control as any}
                  name="issue_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("issue-date")}</FormLabel>
                      <FormControl>
                        <PersianDatePicker
                          value={field.value}
                          onChange={(value) => field.onChange(value)}
                          placeholder={t("select-date")}
                          className="focus-visible:ring-offset-0 aria-[invalid=true]:border-input"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Conditionally show distribution or offer field */}
                {linkedDistribution && (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      عاملیت توزیع
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 p-0 hover:bg-transparent"
                        onClick={async () => {
                          try {
                            const distribution = await fetchB2BDistributionById(linkedDistribution.id);
                            if (distribution) setViewingDistribution(distribution);
                          } catch (error) {
                            console.error("Failed to fetch distribution:", error);
                          }
                        }}
                      >
                        <Info className="h-4 w-4 text-[#f6d265]" />
                      </Button>
                    </FormLabel>
                    <FormControl>
                      <Input
                        value={describeDistribution(linkedDistribution)}
                        disabled
                        className="bg-gray-50"
                      />
                    </FormControl>
                  </FormItem>
                )}

                {linkedOffer && (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      عرضه
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 p-0 hover:bg-transparent"
                        onClick={async () => {
                          try {
                            const offer = await fetchB2BOfferById(linkedOffer.id);
                            if (offer) setViewingOffer(offer);
                          } catch (error) {
                            console.error("Failed to fetch offer:", error);
                          }
                        }}
                      >
                        <Info className="h-4 w-4 text-[#f6d265]" />
                      </Button>
                    </FormLabel>
                    <FormControl>
                      <Input
                        value={describeOffer(linkedOffer)}
                        disabled
                        className="bg-gray-50"
                      />
                    </FormControl>
                  </FormItem>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">{t("driver-info")}</h3>
                <div className="grid grid-cols-3 gap-4 p-4 border rounded-lg">
                  <FormField
                    control={form.control as any}
                    name="driver_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("driver-name")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control as any}
                    name="driver_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("driver-phone")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control as any}
                    name="driver_license_plate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("driver-license-plate")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control as any}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("description")} <span className="text-gray-400 text-sm">{t("optional")}</span></FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">{t("items")}</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ product: 0, weight: 0, destination: "", receiver: "", customer: 0, fare: 0 })}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t("add-item")}
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <div key={field.id} className="p-4 border rounded-lg">
                    {/* Single grid with proper column spans */}
                    <div className="grid grid-cols-7 gap-4 items-start">
                      {/* Row 1: محصول, وزن, مشتری */}
                      <FormField
                        control={form.control as any}
                        name={`items.${index}.product`}
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>{t("product")}</FormLabel>
                            <FormControl>
                              <SimpleCombobox
                                value={field.value > 0 ? field.value.toString() : ""}
                                onValueChange={(value) => {
                                  if (value) {
                                    field.onChange(Number(value));
                                  }
                                }}
                                options={data.products.map((product) => ({
                                  value: product.id.toString(),
                                  label: describeProduct(product),
                                  id: product.id,
                                  name: product.name
                                }))}
                                placeholder={t("select-product")}
                                searchPlaceholder={tCommon("search_placeholders.search_products")}
                                disabled={selectedWarehouseReceiptId > 0}
                                showCreateNew={true}
                                createNewText={t("create-new-product")}
                                onCreateNew={() => {
                                  const currentIndex = index;
                                  openModal(ProductModal, {
                                    onSubmit: async (newProduct: ProductFormData) => {
                                      const created = await createProduct(newProduct);
                                      if (created) {
                                        await refreshData('products');
                                        const items = form.getValues('items');
                                        items[currentIndex].product = created.id;
                                        form.setValue('items', items);
                                      }
                                    }
                                  });
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control as any}
                        name={`items.${index}.weight`}
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>{t("weight")}</FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                step="0.00000001"
                                {...field}
                                onChange={(value) => field.onChange(value)}
                                className="focus-visible:ring-offset-0 aria-[invalid=true]:border-input"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control as any}
                        name={`items.${index}.customer`}
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>{t("customer")}</FormLabel>
                            <FormControl>
                              <SimpleCombobox
                                value={field.value > 0 ? field.value.toString() : ""}
                                onValueChange={(value) => {
                                  if (value) {
                                    field.onChange(Number(value));
                                  }
                                }}
                                options={data.customers.map((customer) => ({
                                  value: customer.id.toString(),
                                  label: describeParty(customer),
                                  id: customer.id,
                                  name: getPartyDisplayName(customer)
                                }))}
                                placeholder={t("select-customer")}
                                searchPlaceholder={tCommon("search_placeholders.search_customers")}
                                disabled={selectedB2BAddressId > 0}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="col-span-1 flex items-end justify-center row-span-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => remove(index)}
                          disabled={fields.length === 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Row 2: مقصد, گیرنده, کرایه */}
                      <FormField
                        control={form.control as any}
                        name={`items.${index}.destination`}
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>{t("destination")} <span className="text-gray-400 text-sm">{t("optional")}</span></FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control as any}
                        name={`items.${index}.receiver`}
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>{t("receiver")}</FormLabel>
                            <FormControl>
                              <Input {...field} className="focus-visible:ring-offset-0 aria-[invalid=true]:border-input" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control as any}
                        name={`items.${index}.fare`}
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>{t("fare")}</FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                {...field}
                                onChange={(value) => field.onChange(value)}
                                className="focus-visible:ring-offset-0 aria-[invalid=true]:border-input"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
              </fieldset>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleClose}>
                  {t("cancel")}
                </Button>
                <Button
                  type="submit"
                  className="hover:bg-[#f6d265]"
                  disabled={isCounterExhausted}
                >
                  {t("save")}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Viewing B2B Address Modal */}
      {viewingAddress && (
        <B2BAddressModal
          initialData={{
            ...viewingAddress,
            product: viewingAddress.product ?? 0,
            customer: viewingAddress.customer ?? 0,
            receiver: viewingAddress.receiver ?? undefined,
            product_offer: viewingAddress.product_offer ?? undefined,
          }}
          readOnly={true}
          onClose={() => setViewingAddress(null)}
        />
      )}

      {/* Viewing Warehouse Receipt Modal */}
      {viewingReceipt && (
        <WarehouseReceiptModal
          initialData={{
            ...viewingReceipt,
            receipt_id: viewingReceipt.receipt_id ?? undefined,
            cottage_serial_number: viewingReceipt.cottage_serial_number ?? undefined,
            proforma: viewingReceipt.proforma ?? undefined,
          }}
          readOnly={true}
          onClose={() => setViewingReceipt(null)}
        />
      )}

      {/* Viewing Distribution Modal */}
      {viewingDistribution && (
        <B2BDistributionModal
          initialData={viewingDistribution}
          readOnly={true}
          onClose={() => setViewingDistribution(null)}
        />
      )}

      {/* Viewing Offer Modal */}
      {viewingOffer && (
        <B2BOfferModal
          initialData={viewingOffer}
          readOnly={true}
          onClose={() => setViewingOffer(null)}
        />
      )}
    </>
  );
}
