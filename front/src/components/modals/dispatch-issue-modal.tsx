"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCoreData } from "@/lib/core-data-context";
import { useModal } from "@/lib/modal-context";
import { PersianDatePicker } from "../ui/persian-date-picker";
import { getTodayGregorian } from "@/lib/utils/persian-date";
import { WarehouseModal } from "./warehouse-modal";
import { ProductModal } from "./product-modal";
import { ReceiverModal } from "./receiver-modal";
import { ShippingCompanyModal } from "./shipping-company-modal";
import { SalesProformaModal } from "./salesproforma-modal";
import { createWarehouse } from "@/lib/api/warehouse";
import { createProduct, createReceiver, createShippingCompany } from "@/lib/api/core";
import { createSalesProforma } from "@/lib/api/finance";

type DispatchIssueFormData = {
  dispatch_id: string;
  warehouse: number;
  sales_proforma: number;
  issue_date: string;
  validity_date: string;
  description: string;
  shipping_company: number;
  items: {
    product: number;
    weight: number;
    vehicle_type: "truck" | "pickup" | "van" | "container" | "other";
    receiver: number;
  }[];
};

interface DispatchIssueModalProps {
  trigger?: React.ReactNode;
  onSubmit?: (data: DispatchIssueFormData) => void;
  onClose?: () => void;
  initialData?: Partial<DispatchIssueFormData>;
}

export function DispatchIssueModal({ trigger, onSubmit, onClose, initialData }: DispatchIssueModalProps) {
  const tval = useTranslations("dispatchIssue.validation");
  const t = useTranslations("dispatchIssue");
  const { data, refreshData } = useCoreData();
  const { openModal, closeModal } = useModal();
  
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showReceiverModal, setShowReceiverModal] = useState(false);
  const [showShippingCompanyModal, setShowShippingCompanyModal] = useState(false);
  const [showSalesProformaModal, setShowSalesProformaModal] = useState(false);
  const [pendingProductIndex, setPendingProductIndex] = useState<number | null>(null);
  const [pendingReceiverIndex, setPendingReceiverIndex] = useState<number | null>(null);
  
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

  const dispatchItemSchema = z.object({
    product: z.number().min(1, tval("product-required")),
    weight: z.number().min(0.00000001, tval("weight")),
    vehicle_type: z.enum(["truck", "pickup", "van", "container", "other"]),
    receiver: z.number().min(1, tval("receiver")),
  });

  const dispatchIssueSchema = z.object({
    dispatch_id: z.string().min(1, tval("dispatch-id")),
    warehouse: z.number().min(1, tval("warehouse")),
    sales_proforma: z.number().min(1, tval("sales-proforma")),
    issue_date: z.string().min(1, tval("issue-date")),
    validity_date: z.string().min(1, tval("validity-date")),
    description: z.string(),
    shipping_company: z.number().min(1, tval("shipping-company")),
    items: z.array(dispatchItemSchema).min(1, tval("items")),
  });

  const [open, setOpen] = useState(trigger ? false : true);

  const form = useForm<DispatchIssueFormData>({
    resolver: zodResolver(dispatchIssueSchema),
    defaultValues: {
      dispatch_id: initialData?.dispatch_id || "",
      warehouse: initialData?.warehouse || 0,
      sales_proforma: initialData?.sales_proforma || 0,
      issue_date: initialData?.issue_date || getTodayDate(),
      validity_date: initialData?.validity_date || getTodayDate(),
      description: initialData?.description || "",
      shipping_company: initialData?.shipping_company || 0,
      items: initialData?.items || [{ product: 0, weight: 0, vehicle_type: "truck", receiver: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const handleSubmit = (data: DispatchIssueFormData) => {
    onSubmit?.(data);
    if (trigger) {
      setOpen(false);
    } else {
      onClose?.();
    }
    form.reset();
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
      <DialogContent dir="rtl" className="min-w-[80%] max-h-[90vh] overflow-y-auto scrollbar-hide  p-0 my-0 mx-auto [&>button]:hidden">
        <DialogHeader className="px-3.5 py-4.5  justify-start" style={{ backgroundColor: "#f6d265" }}>
          <DialogTitle className="font-bold text-white text-right">{t("title")}</DialogTitle>
          <DialogDescription className="sr-only">Create or edit dispatch issue</DialogDescription>
        </DialogHeader>

        <Form {...form} >
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4 px-12">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dispatch_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("dispatch-id")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="warehouse"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("warehouse")}</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value > 0 ? field.value.toString() : ""}
                        onValueChange={(value) => {
                          if (value === "new") {
                            setShowWarehouseModal(true);
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
                              {warehouse.name} (#{warehouse.id})
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
                control={form.control}
                name="sales_proforma"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("sales-proforma")}</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value > 0 ? field.value.toString() : ""}
                        onValueChange={(value) => {
                          if (value === "new") {
                            setShowSalesProformaModal(true);
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
                              {proforma.serial_number} (#{proforma.id})
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
                control={form.control}
                name="shipping_company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("shipping-company")}</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value > 0 ? field.value.toString() : ""}
                        onValueChange={(value) => {
                          if (value === "new") {
                            setShowShippingCompanyModal(true);
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
                              {company.name} (#{company.id})
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
                control={form.control}
                name="issue_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("issue-date")}</FormLabel>
                    <FormControl>
                      <PersianDatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={t("select-date")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="validity_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("validity-date")}</FormLabel>
                    <FormControl>
                      <PersianDatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={t("select-date")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
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
                  onClick={() => append({ product: 0, weight: 0, vehicle_type: "truck", receiver: 0 })}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t("add-item")}
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-5 gap-4 p-4 border rounded-lg">
                  <FormField
                    control={form.control}
                    name={`items.${index}.product`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("product")}</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value > 0 ? field.value.toString() : ""}
                            onValueChange={(value) => {
                              if (value === "new") {
                                setPendingProductIndex(index);
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
                              {data.products.length > 0 && (
                                <div className="border-t my-1" />
                              )}
                              {data.products.map((product) => (
                                <SelectItem key={product.id} value={product.id.toString()}>
                                  {product.name} (#{product.id})
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
                    control={form.control}
                    name={`items.${index}.weight`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("weight")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.00000001"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.vehicle_type`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("vehicle-type")}</FormLabel>
                        <FormControl>
                          <select {...field} className="w-full px-3 py-2 border rounded-md">
                            <option value="truck">{t("vehicle-truck")}</option>
                            <option value="pickup">{t("vehicle-pickup")}</option>
                            <option value="van">{t("vehicle-van")}</option>
                            <option value="container">{t("vehicle-container")}</option>
                            <option value="other">{t("vehicle-other")}</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.receiver`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("receiver")}</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value > 0 ? field.value.toString() : ""}
                            onValueChange={(value) => {
                              if (value === "new") {
                                setPendingReceiverIndex(index);
                                setShowReceiverModal(true);
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
                                  {receiver.name} (#{receiver.id})
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

    {showWarehouseModal && (
      <WarehouseModal
        onSubmit={async (newWarehouse: any) => {
          const created = await createWarehouse(newWarehouse);
          if (created) {
            await refreshData('warehouses');
            form.setValue('warehouse', created.id);
            setShowWarehouseModal(false);
          }
        }}
        onClose={() => setShowWarehouseModal(false)}
      />
    )}

    {showSalesProformaModal && (
      <SalesProformaModal
        onSubmit={async (newProforma: any) => {
          const created = await createSalesProforma(newProforma);
          if (created) {
            await refreshData('salesProformas');
            form.setValue('sales_proforma', created.id);
            setShowSalesProformaModal(false);
          }
        }}
        onClose={() => setShowSalesProformaModal(false)}
      />
    )}

    {showShippingCompanyModal && (
      <ShippingCompanyModal
        onSubmit={async (newCompany: any) => {
          const created = await createShippingCompany(newCompany);
          if (created) {
            await refreshData('shippingCompanies');
            form.setValue('shipping_company', created.id);
            setShowShippingCompanyModal(false);
          }
        }}
        onClose={() => setShowShippingCompanyModal(false)}
      />
    )}

    {showProductModal && (
      <ProductModal
        onSubmit={async (newProduct: any) => {
          const created = await createProduct(newProduct);
          if (created) {
            await refreshData('products');
            if (pendingProductIndex !== null) {
              form.setValue(`items.${pendingProductIndex}.product`, created.id);
            }
            setShowProductModal(false);
            setPendingProductIndex(null);
          }
        }}
        onClose={() => {
          setShowProductModal(false);
          setPendingProductIndex(null);
        }}
      />
    )}

    {showReceiverModal && (
      <ReceiverModal
        onSubmit={async (newReceiver: any) => {
          const created = await createReceiver(newReceiver);
          if (created) {
            await refreshData('receivers');
            if (pendingReceiverIndex !== null) {
              form.setValue(`items.${pendingReceiverIndex}.receiver`, created.id);
            }
            setShowReceiverModal(false);
            setPendingReceiverIndex(null);
          }
        }}
        onClose={() => {
          setShowReceiverModal(false);
          setPendingReceiverIndex(null);
        }}
      />
    )}
    </>
  );
}