"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { useTranslations } from "next-intl";

export type ReceiverFormData = {
  receiver_type: "individual" | "corporate";
  receiver_veichle_type: "single" | "double" | "trailer";
  unique_id: string;
  company_name?: string;
  national_id?: string;
  full_name?: string;
  personal_code?: string;
  economic_code: string;
  phone: string;
  address: string;
  description?: string;
  postal_code: string;
};

interface ReceiverModalProps {
  trigger?: React.ReactNode;
  onSubmit?: (data: ReceiverFormData) => void;
  onClose?: () => void;
  initialData?: Partial<ReceiverFormData>;
}

export function ReceiverModal({ trigger, onSubmit, onClose, initialData }: ReceiverModalProps) {
  const tval = useTranslations("modals.receiver.validation");
  const t = useTranslations("modals.receiver");

  const receiverSchema = z.object({
    receiver_type: z.enum(["individual", "corporate"]),
    receiver_veichle_type: z.enum(["single", "double", "trailer"]),
    unique_id: z.string().min(1, tval("unique-id")),
    company_name: z.string().optional(),
    national_id: z.string().optional(),
    full_name: z.string().optional(),
    personal_code: z.string().optional(),
    economic_code: z.string().min(1, tval("economic-code")),
    phone: z.string().min(1, tval("phone")),
    address: z.string().min(1, tval("address")),
    description: z.string().optional(),
    postal_code: z.string().min(1, tval("postal-code")),
  }).refine((data) => {
    if (data.receiver_type === "corporate") {
      return data.company_name && data.company_name.length > 0 && data.national_id && data.national_id.length > 0;
    }
    return data.full_name && data.full_name.length > 0 && data.personal_code && data.personal_code.length > 0;
  }, {
    message: tval("party-fields"),
    path: ["receiver_type"]
  });

  const [open, setOpen] = useState(trigger ? false : true);

  const form = useForm<ReceiverFormData>({
    resolver: zodResolver(receiverSchema),
    defaultValues: {
      receiver_type: initialData?.receiver_type || "individual",
      unique_id: initialData?.unique_id || "",
      company_name: initialData?.company_name || "",
      national_id: initialData?.national_id || "",
      full_name: initialData?.full_name || "",
      personal_code: initialData?.personal_code || "",
      economic_code: initialData?.economic_code || "",
      phone: initialData?.phone || "",
      address: initialData?.address || "",
      description: initialData?.description || "",
      postal_code: initialData?.postal_code || "",
    },
  });

  const receiverType = form.watch("receiver_type");

  const handleSubmit = async (data: ReceiverFormData) => {
    if (onSubmit) {
      await onSubmit(data);
    }
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
      <DialogContent dir="rtl" className="min-w-[80%] max-h-[90vh] overflow-y-auto scrollbar-hide  p-0 my-0 mx-auto [&>button]:hidden">
        <DialogHeader className="px-3.5 py-4.5  justify-start" style={{ backgroundColor: "#f6d265" }}>
          <DialogTitle className="font-bold text-white text-right">{t("title")}</DialogTitle>
          <DialogDescription className="sr-only">Create or edit receiver</DialogDescription>
        </DialogHeader>

        <Form {...form} >
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4 px-12">
            <FormField
              control={form.control}
              name="receiver_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("receiver-type")}</FormLabel>
                  <FormControl>
                    <select {...field} className="w-full px-3 py-2 border rounded-md">
                      <option value="individual">{t("type-individual")}</option>
                      <option value="corporate">{t("type-corporate")}</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">

              <FormField
                control={form.control}
                name="unique_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("unique-id")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {receiverType === "corporate" ? (
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

            <div className="grid grid-cols-2 gap-4">
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

              <FormField
                control={form.control}
                name="postal_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("postal-code")}</FormLabel>
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
              name="receiver_veichle_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("receiver_veichle_type")}</FormLabel>
                  <FormControl>
                    <select {...field} className="w-full px-3 py-2 border rounded-md">
                      <option value="single">{t("receiver_veichle_type-single")}</option>
                      <option value="double">{t("receiver_veichle_type-double")}</option>
                      <option value="trailer">{t("receiver_veichle_type-trailer")}</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("description")} (اختیاری)</FormLabel>
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
              <Button type="submit" className="hover:bg-[#f6d265]"> {t("save")}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog >
  );
}