"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { useTranslations } from "next-intl";

type CustomerFormData = {
  customer_type: "Individual" | "Corporate";
  company_name: string;
  national_id: string;
  full_name: string;
  personal_code: string;
  economic_code: string;
  phone: string;
  address: string;
  description: string;
  tags: string;
};

interface CustomerModalProps {
  trigger?: React.ReactNode;
  onSubmit?: (data: CustomerFormData) => void;
  onClose?: () => void;
}

export function CustomerModal({ trigger, onSubmit, onClose }: CustomerModalProps) {
  const tval = useTranslations("customer.validation");
  const t = useTranslations("customer");

  const customerSchema = z.object({
    customer_type: z.enum(["Individual", "Corporate"]),
    company_name: z.string(),
    national_id: z.string(),
    full_name: z.string(),
    personal_code: z.string(),
    economic_code: z.string().min(1, tval("economic-code")),
    phone: z.string().min(1, tval("phone")),
    address: z.string().min(1, tval("address")),
    description: z.string(),
    tags: z.string(),
  }).refine((data) => {
    if (data.customer_type === "Corporate") {
      return data.company_name.length > 0 && data.national_id.length > 0;
    }
    return data.full_name.length > 0 && data.personal_code.length > 0;
  }, {
    message: tval("party-fields"),
    path: ["customer_type"]
  });

  const [open, setOpen] = useState(trigger ? false : true);

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      customer_type: "Individual",
      company_name: "",
      national_id: "",
      full_name: "",
      personal_code: "",
      economic_code: "",
      phone: "",
      address: "",
      description: "",
      tags: "",
    },
  });

  const customerType = form.watch("customer_type");

  const handleSubmit = (data: CustomerFormData) => {
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
    <Dialog open={open} onOpenChange={trigger ? setOpen : handleClose}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent dir="rtl" className="min-w-[70%] max-h-[90vh] overflow-y-auto scrollbar-hide  p-0 my-0 mx-auto [&>button]:hidden">
        <DialogHeader className="px-3.5 py-4.5  justify-start" style={{ backgroundColor: "#f6d265" }}>
          <DialogTitle className="font-bold text-white text-right">{t("title")}</DialogTitle>
        </DialogHeader>

        <Form {...form} >
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4 px-8">
            <FormField
              control={form.control}
              name="customer_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("customer-type")}</FormLabel>
                  <FormControl>
                    <select {...field} className="w-full px-3 py-2 border rounded-md">
                      <option value="Individual">{t("type-individual")}</option>
                      <option value="Corporate">{t("type-corporate")}</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {customerType === "Corporate" ? (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="company_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("company-name")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="national_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("national-id")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("full-name")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="personal_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("personal-code")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="economic_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("economic-code")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("phone")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("address")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
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

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("tags")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
    </Dialog >
  );
}