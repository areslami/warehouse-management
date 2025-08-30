"use client";


import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../../ui/form";
import { Input } from "../../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { PersianDatePicker } from "../../ui/persian-date-picker";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCoreData } from "@/lib/core-data-context";
import { CustomerModal } from "../customer-modal";
import { ReceiverModal } from "../receiver-modal";
import { ProductModal } from "../product-modal";
import { createCustomer, createProduct, createReceiver } from "@/lib/api/core";
import { getPartyDisplayName } from "@/lib/utils/party-utils";
import { fetchB2BOffers } from "@/lib/api/b2b";
import { B2BOffer } from "@/lib/interfaces/b2b";
import { convertPersianToEnglishNumbers } from "@/lib/utils/number-format";

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
}

export function B2BAddressModal({ trigger, onSubmit, onClose, initialData }: B2BAddressModalProps) {
  const tval = useTranslations("modals.b2bAddress.validation");
  const t = useTranslations("modals.b2bAddress");
  const { products, customers, receivers, refreshData: refreshCoreData } = useCoreData();
  const [offers, setOffers] = useState<B2BOffer[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showReceiverModal, setShowReceiverModal] = useState(false);

  useEffect(() => {
    if (products.length === 0) refreshCoreData('products');
    if (customers.length === 0) refreshCoreData('customers');
    if (receivers.length === 0) refreshCoreData('receivers');
    loadOffers();
  }, []);

  const loadOffers = async () => {
    try {
      const data = await fetchB2BOffers();
      setOffers(data ?? []);
    } catch (error) {
      console.error('Error loading offers:', error);
    }
  };

  const b2bSaleSchema = z.object({
    purchase_id: z.string().min(1, tval("purchase-id")),
    allocation_id: z.string().optional(),
    cottage_code: z.string().optional(),
    product_offer: z.number().optional(),
    product: z.number().min(1, tval("product")),
    customer: z.number().min(1, tval("customer")),
    receiver: z.number().min(1, tval("customer")),
    total_weight_purchased: z.union([z.string(), z.number()]).optional(),
    purchase_date: z.string().min(1, tval("date")),
    unit_price: z.number().positive(),
    payment_amount: z.number().min(0, tval("amount")),
    payment_method: z.string().min(1, tval("payment-method")),
    province: z.string().optional(),
    city: z.string().optional(),
    tracking_number: z.string().optional(),
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

  const handleSubmit = async (data: any) => {
    try {
      await onSubmit?.(data);
      if (trigger) {
        setOpen(false);
      } else {
        onClose?.();
      }
      form.reset();
    } catch (error) {
      console.error("Error submitting sale:", error);
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
        <DialogContent dir="rtl" className="min-w-[75%] max-h-[90vh] overflow-y-auto scrollbar-hide p-0 my-0 mx-auto [&>button]:hidden">
          <DialogHeader className="px-3.5 py-4.5 justify-start" style={{ backgroundColor: "#f6d265" }}>
            <DialogTitle className="font-bold text-white text-right">{t("title")}</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4 px-12">
              {/* Row 1: IDs */}
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control as any}
                  name="purchase_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("purchase-id")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="allocation_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("allocation-id")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
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
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 2: Product and Customer */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control as any}
                  name="product"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("product")}</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value > 0 ? field.value.toString() : ""}
                          onValueChange={(value) => {
                            if (value === "new") {
                              setShowProductModal(true);
                            } else if (value) {
                              field.onChange(Number(value));
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t("select-product")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem
                              value="new"
                              className="font-semibold text-[#f6d265]"
                              onPointerDown={(e) => e.preventDefault()}
                            >
                              <Plus className="inline-block w-4 h-4 mr-2" />
                              {t("create-new-product")}
                            </SelectItem>
                            {products.length > 0 && (
                              <div className="border-t my-1" />
                            )}
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id.toString()}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
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
                        <Select
                          value={field.value > 0 ? field.value.toString() : ""}
                          onValueChange={(value) => {
                            if (value === "new") {
                              setShowCustomerModal(true);
                            } else if (value) {
                              field.onChange(Number(value));
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t("select-customer")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem
                              value="new"
                              className="font-semibold text-[#f6d265]"
                              onPointerDown={(e) => e.preventDefault()}
                            >
                              <Plus className="inline-block w-4 h-4 mr-2" />
                              {t("create-new-customer")}
                            </SelectItem>
                            {customers.length > 0 && (
                              <div className="border-t my-1" />
                            )}
                            {customers.map((customer) => (
                              <SelectItem key={customer.id} value={customer.id.toString()}>
                                {getPartyDisplayName(customer)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 3: Receiver and Offer */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control as any}
                  name="receiver"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("receiver")} <span className="text-gray-400 text-sm">{t("optional")}</span></FormLabel>
                      <FormControl>
                        <Select
                          value={field.value ? field.value.toString() : ""}
                          onValueChange={(value) => {
                            if (value === "new") {
                              setShowReceiverModal(true);
                            } else if (value) {
                              field.onChange(Number(value));
                            } else {
                              field.onChange(undefined);
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t("select-receiver")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no-receiver">
                              {t("no-receiver")}
                            </SelectItem>
                            <SelectItem
                              value="new"
                              className="font-semibold text-[#f6d265]"
                              onPointerDown={(e) => e.preventDefault()}
                            >
                              <Plus className="inline-block w-4 h-4 mr-2" />
                              {t("create-new-receiver")}
                            </SelectItem>
                            {receivers.length > 0 && (
                              <div className="border-t my-1" />
                            )}
                            {receivers.map((receiver) => (
                              <SelectItem key={receiver.id} value={receiver.id.toString()}>
                                {getPartyDisplayName(receiver)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
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
                        <Select
                          value={field.value ? field.value.toString() : ""}
                          onValueChange={(value) => {
                            field.onChange(value ? Number(value) : undefined);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t("select-offer")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no-offer">
                              {t("no-offer")}
                            </SelectItem>
                            {offers.map((offer) => (
                              <SelectItem key={offer.id} value={offer.id.toString()}>
                                {offer.offer_id} - {offer.product_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
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
                      <FormLabel>{t("weight")}</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          {...field}
                          onChange={(value) => field.onChange(value)}
                        />
                      </FormControl>
                      <FormMessage />
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
                        <Input
                          type="text"
                          {...field}
                          onChange={(e) => {
                            const value = convertPersianToEnglishNumbers(e.target.value);
                            field.onChange(value === '' ? 0 : parseFloat(value) || 0);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
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
                        <Input
                          type="text"
                          {...field}
                          onChange={(e) => {
                            const value = convertPersianToEnglishNumbers(e.target.value);
                            field.onChange(value === '' ? 0 : parseFloat(value) || 0);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 5: Payment Method and Date */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control as any}
                  name="payment_method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("payment-method")}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("select-payment-method")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">{t("cash")}</SelectItem>
                          <SelectItem value="credit">{t("credit")}</SelectItem>
                          <SelectItem value="installment">{t("installment")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
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
                      <FormMessage />
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
                      <FormMessage />
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
                      <FormMessage />
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
                      <FormMessage />
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleClose}>
                  {t("cancel")}
                </Button>
                <Button type="submit" className="hover:bg-[#f6d265]">{t("save")}</Button>
              </div>
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
    </>
  );
}