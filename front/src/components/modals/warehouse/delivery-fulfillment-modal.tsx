"use client";


import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../../ui/form";
import { Input } from "../../ui/input";
import { convertPersianToEnglishNumbers } from "@/lib/utils/number-format";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCoreData } from "@/lib/core-data-context";
import { useModal } from "@/lib/modal-context";
import { PersianDatePicker } from "../../ui/persian-date-picker";
import { getTodayGregorian } from "@/lib/utils/persian-date";
import { getPartyDisplayName } from "@/lib/utils/party-utils";
import { WarehouseFormData, WarehouseModal } from "./warehouse-modal";
import { ProductFormData, ProductModal } from "../product-modal";
import { ReceiverFormData, ReceiverModal } from "../receiver-modal";
import { ShippingCompanyFormData, ShippingCompanyModal } from "../shipping-company-modal";
import { SalesProformaFormData, SalesProformaModal } from "../finance/salesproforma-modal";
import { createWarehouse } from "@/lib/api/warehouse";
import { createProduct, createReceiver, createShippingCompany } from "@/lib/api/core";
import { createSalesProforma } from "@/lib/api/finance";

type DeliveryFulfillmentFormData = {
  delivery_id: string;
  issue_date: string;
  validity_date: string;
  warehouse: number;
  sales_proforma: number;
  description?: string;
  shipping_company: number;
  items: {
    shipment_id: string;
    shipment_price?: string | number;
    product: number;
    weight?: string | number;
    vehicle_type: "single" | 'double' | 'trailer';
    receiver: number;
  }[];
};

interface DeliveryFulfillmentModalProps {
  trigger?: React.ReactNode;
  onSubmit?: (data: any) => void;
  onClose?: () => void;
  initialData?: any;
}

export function DeliveryFulfillmentModal({ trigger, onSubmit, onClose, initialData }: DeliveryFulfillmentModalProps) {
  const tval = useTranslations("modals.deliveryFulfillment.validation");
  const t = useTranslations("modals.deliveryFulfillment");
  const { data, refreshData } = useCoreData();
  const { openModal } = useModal();

  useEffect(() => {
    if (data.warehouses.length === 0) {
      refreshData('warehouses');
    }
    if (data.products.length === 0) {
      refreshData('products');
    }
    if (data.receivers.length === 0) {
      refreshData('receivers');
    }
    if (data.shippingCompanies.length === 0) {
      refreshData('shippingCompanies');
    }
    if (data.salesProformas.length === 0) {
      refreshData('salesProformas');
    }
  }, []);
  const getTodayDate = () => {
    if (typeof window === 'undefined') return '';
    return getTodayGregorian();
  };

  const deliveryItemSchema = z.object({
    shipment_id: z.string().min(1, tval("shipment-id")),
    shipment_price: z.union([z.string(), z.number()]).optional(),
    product: z.number().min(1, tval("product-required")),
    weight: z.union([z.string(), z.number()]).optional(),
    vehicle_type: z.enum(["single", "double", "trailer"]),
    receiver: z.number().min(0),
  });

  const deliveryFulfillmentSchema = z.object({
    delivery_id: z.string().min(1, tval("delivery-id")),
    issue_date: z.string().min(1, tval("issue-date")),
    validity_date: z.string().min(1, tval("validity-date")),
    warehouse: z.number().min(0),
    sales_proforma: z.number().min(0),
    description: z.string().optional(),
    shipping_company: z.number().min(0),
    items: z.array(deliveryItemSchema).min(1, tval("items")),
  });

  const [open, setOpen] = useState(trigger ? false : true);

  const form = useForm<DeliveryFulfillmentFormData>({
    resolver: zodResolver(deliveryFulfillmentSchema) as any,
    defaultValues: {
      delivery_id: initialData?.delivery_id || "",
      issue_date: initialData?.issue_date || getTodayDate(),
      validity_date: initialData?.validity_date || getTodayDate(),
      warehouse: initialData?.warehouse || 0,
      sales_proforma: initialData?.sales_proforma || 0,
      description: initialData?.description || "",
      shipping_company: initialData?.shipping_company || 0,
      items: initialData?.items || [{ shipment_id: "", shipment_price: 0, product: 0, weight: 0, vehicle_type: "single", receiver: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const handleSubmit = async (data: any) => {
    try {
      if (onSubmit) {
        await onSubmit(data);
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
          <DialogHeader className="px-3.5 py-4.5  justify-start" style={{ backgroundColor: "#f6d265" }}>
            <DialogTitle className="font-bold text-white text-right">{t("title")}</DialogTitle>
            <DialogDescription className="sr-only">Create or edit delivery fulfillment</DialogDescription>
          </DialogHeader>

          <Form {...form} >
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4 px-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control as any}
                  name="delivery_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("delivery-id")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                      <FormLabel>{t("warehouse")}</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value > 0 ? field.value.toString() : ""}
                          onValueChange={(value) => {
                            if (value === "new") {
                              openModal(WarehouseModal, {
                                onSubmit: async (newWarehouse: WarehouseFormData) => {
                                  const created = await createWarehouse(newWarehouse);
                                  if (created) {
                                    await refreshData('warehouses');
                                    form.setValue('warehouse', created.id);
                                  }
                                }
                              });
                            } else if (value) {
                              field.onChange(Number(value));
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t("select-warehouse")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem
                              value="new"
                              className="font-semibold text-[#f6d265]"
                              onPointerDown={(e) => e.preventDefault()}
                            >
                              <Plus className="inline-block w-4 h-4 mr-2" />
                              {t("create-new-warehouse")}
                            </SelectItem>
                            {data.warehouses.length > 0 && (
                              <div className="border-t my-1" />
                            )}
                            {data.warehouses.map((warehouse) => (
                              <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                                {warehouse.name}
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control as any}
                  name="sales_proforma"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("sales-proforma")}</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value > 0 ? field.value.toString() : ""}
                          onValueChange={(value) => {
                            if (value === "new") {
                              openModal(SalesProformaModal, {
                                onSubmit: async (newProforma: SalesProformaFormData) => {
                                  const cleanProforma = {
                                    ...newProforma,
                                    tax: parseFloat(newProforma.tax) || 0,
                                    discount: parseFloat(newProforma.discount) || 0,
                                    lines: newProforma.lines.map(line => ({
                                      ...line,
                                      weight: parseFloat(line.weight) || 0,
                                      unit_price: parseFloat(line.unit_price) || 0
                                    }))
                                  };
                                  const created = await createSalesProforma(cleanProforma);
                                  if (created) {
                                    await refreshData('salesProformas');
                                    form.setValue('sales_proforma', created.id);
                                  }
                                }
                              });
                            } else if (value) {
                              field.onChange(Number(value));
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t("select-sales-proforma")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem
                              value="new"
                              className="font-semibold text-[#f6d265]"
                              onPointerDown={(e) => e.preventDefault()}
                            >
                              <Plus className="inline-block w-4 h-4 mr-2" />
                              {t("create-new-sales-proforma")}
                            </SelectItem>
                            {data.salesProformas.length > 0 && (
                              <div className="border-t my-1" />
                            )}
                            {data.salesProformas.map((proforma) => (
                              <SelectItem key={proforma.id} value={proforma.id.toString()}>
                                {proforma.serial_number}
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
                  name="shipping_company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("shipping-company")}</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value > 0 ? field.value.toString() : ""}
                          onValueChange={(value) => {
                            if (value === "new") {
                              openModal(ShippingCompanyModal, {
                                onSubmit: async (newCompany: ShippingCompanyFormData) => {
                                  const created = await createShippingCompany(newCompany);
                                  if (created) {
                                    await refreshData('shippingCompanies');
                                    form.setValue('shipping_company', created.id);
                                  }
                                }
                              });
                            } else if (value) {
                              field.onChange(Number(value));
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t("select-shipping-company")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem
                              value="new"
                              className="font-semibold text-[#f6d265]"
                              onPointerDown={(e) => e.preventDefault()}
                            >
                              <Plus className="inline-block w-4 h-4 mr-2" />
                              {t("create-new-shipping-company")}
                            </SelectItem>
                            {data.shippingCompanies.length > 0 && (
                              <div className="border-t my-1" />
                            )}
                            {data.shippingCompanies.map((company) => (
                              <SelectItem key={company.id} value={company.id.toString()}>
                                {company.name}
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

              <div className="grid grid-cols-2 gap-4">
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
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="validity_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("validity-date")}</FormLabel>
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

              <FormField
                control={form.control as any}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("description")}</FormLabel>
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
                    onClick={() => append({ shipment_id: "", shipment_price: 0, product: 0, weight: 0, vehicle_type: "single", receiver: 0 })}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t("add-item")}
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-6 gap-4 p-4 border rounded-lg">
                    <FormField
                      control={form.control as any}
                      name={`items.${index}.shipment_id`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("shipment-id")}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control as any}
                      name={`items.${index}.shipment_price`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("shipment-price")}</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              step="0.01"
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
                      name={`items.${index}.product`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("product")}</FormLabel>
                          <FormControl>
                            <Select
                              value={field.value > 0 ? field.value.toString() : ""}
                              onValueChange={(value) => {
                                if (value === "new") {
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
                                {data.products.length > 0 && (
                                  <div className="border-t my-1" />
                                )}
                                {data.products.map((product) => (
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
                      name={`items.${index}.weight`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("weight")}</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              step="0.00000001"
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
                      name={`items.${index}.vehicle_type`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("vehicle-type")}</FormLabel>
                          <FormControl>
                            <select {...field} className="w-full px-3 py-2 border rounded-md">
                              <option value="single">{t("vehicle-single")}</option>
                              <option value="double">{t("vehicle-double")}</option>
                              <option value="trailer">{t("vehicle-trailer")}</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control as any}
                      name={`items.${index}.receiver`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("receiver")}</FormLabel>
                          <FormControl>
                            <Select
                              value={field.value > 0 ? field.value.toString() : ""}
                              onValueChange={(value) => {
                                if (value === "new") {
                                  const currentIndex = index;
                                  openModal(ReceiverModal, {
                                    onSubmit: async (newReceiver: ReceiverFormData) => {
                                      const created = await createReceiver(newReceiver);
                                      if (created) {
                                        await refreshData('receivers');
                                        const items = form.getValues('items');
                                        items[currentIndex].receiver = created.id;
                                        form.setValue('items', items);
                                      }
                                    }
                                  });
                                } else if (value) {
                                  field.onChange(Number(value));
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={t("select-receiver")} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem
                                  value="new"
                                  className="font-semibold text-[#f6d265]"
                                  onPointerDown={(e) => e.preventDefault()}
                                >
                                  <Plus className="inline-block w-4 h-4 mr-2" />
                                  {t("create-new-receiver")}
                                </SelectItem>
                                {data.receivers.length > 0 && (
                                  <div className="border-t my-1" />
                                )}
                                {data.receivers.map((receiver) => (
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

                    <div className="flex items-end">
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
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleClose}>
                  {t("cancel")}
                </Button>
                <Button type="submit" className="hover:bg-[#f6d265]"> {t("save")}</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}