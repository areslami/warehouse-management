"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCoreData } from "@/lib/core-data-context";
import { CustomerModal } from "./customer-modal";
import { WarehouseModal } from "./warehouse-modal";
import { ProductModal } from "./product-modal";
import { createCustomer, createProduct } from "@/lib/api/core";
import { createWarehouse } from "@/lib/api/warehouse";
import { getPartyDisplayName } from "@/lib/utils/party-utils";
import { PersianDatePicker } from "../ui/persian-date-picker";

type B2BDistributionFormData = {
  warehouse: number;
  product: number;
  customer: number;
  agency_weight: number;
  agency_date: string;
  description?: string;
};

interface B2BDistributionModalProps {
  trigger?: React.ReactNode;
  onSubmit?: (data: B2BDistributionFormData) => Promise<void>;
  onClose?: () => void;
  initialData?: Partial<B2BDistributionFormData>;
}

export function B2BDistributionModal({ trigger, onSubmit, onClose, initialData }: B2BDistributionModalProps) {
  const tval = useTranslations("b2bDistribution.validation");
  const t = useTranslations("b2bDistribution");
  const { products, customers, warehouses, refreshData: refreshCoreData } = useCoreData();
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  
  useEffect(() => {
    if (products.length === 0) {
      refreshCoreData('products');
    }
    if (customers.length === 0) {
      refreshCoreData('customers');
    }
    if (warehouses.length === 0) {
      refreshCoreData('warehouses');
    }
  }, []);

  const b2bDistributionSchema = z.object({
    warehouse: z.number().min(1, tval("warehouse")),
    product: z.number().min(1, tval("product")),
    customer: z.number().min(1, tval("customer")),
    agency_weight: z.number().positive(tval("agency-weight")),
    agency_date: z.string().min(1, tval("agency-date")),
    description: z.string().optional(),
  });

  const [open, setOpen] = useState(trigger ? false : true);

  const form = useForm<B2BDistributionFormData>({
    resolver: zodResolver(b2bDistributionSchema),
    defaultValues: {
      warehouse: initialData?.warehouse || 0,
      product: initialData?.product || 0,
      customer: initialData?.customer || 0,
      agency_weight: initialData?.agency_weight || 0,
      agency_date: initialData?.agency_date || "",
      description: initialData?.description || "",
    },
  });

  const handleSubmit = async (data: B2BDistributionFormData) => {
    try {
      await onSubmit?.(data);
      if (trigger) {
        setOpen(false);
      } else {
        onClose?.();
      }
      form.reset();
    } catch (error) {
      console.error("Error submitting distribution:", error);
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
      <DialogContent dir="rtl" className="min-w-[70%] max-h-[90vh] overflow-y-auto scrollbar-hide p-0 my-0 mx-auto [&>button]:hidden">
        <DialogHeader className="px-3.5 py-4.5 justify-start" style={{ backgroundColor: "#f6d265" }}>
          <DialogTitle className="font-bold text-white text-right">{t("title")}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4 px-12">
            <div className="grid grid-cols-2 gap-4">
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
                          {warehouses.length > 0 && (
                            <div className="border-t my-1" />
                          )}
                          {warehouses.map((warehouse) => (
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

              <FormField
                control={form.control}
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
            </div>

            <FormField
              control={form.control}
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="agency_weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("agency-weight")}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
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
                name="agency_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("agency-date")}</FormLabel>
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
                  <FormLabel>{t("description")} <span className="text-gray-400 text-sm">(اختیاری)</span></FormLabel>
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
    
    {showWarehouseModal && (
      <WarehouseModal
        onSubmit={async (newWarehouse) => {
          const created = await createWarehouse(newWarehouse);
          if (created) {
            await refreshCoreData('warehouses');
            form.setValue('warehouse', created.id);
            setShowWarehouseModal(false);
          }
        }}
        onClose={() => setShowWarehouseModal(false)}
      />
    )}

    {showProductModal && (
      <ProductModal
        onSubmit={async (newProduct) => {
          const created = await createProduct(newProduct);
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
        onSubmit={async (newCustomer) => {
          const created = await createCustomer(newCustomer);
          if (created) {
            await refreshCoreData('customers');
            form.setValue('customer', created.id);
            setShowCustomerModal(false);
          }
        }}
        onClose={() => setShowCustomerModal(false)}
      />
    )}
    </>
  );
}