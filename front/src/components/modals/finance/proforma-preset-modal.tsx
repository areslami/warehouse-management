"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../ui/form";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import { useTranslations } from "next-intl";

export type ProformaPresetFormData = {
  name: string;
  bank_name: string;
  account_number: string;
  sheba_number: string;
  description?: string;
};

interface ProformaPresetModalProps {
  trigger?: React.ReactNode;
  onSubmit?: (data: ProformaPresetFormData) => void;
  onClose?: () => void;
  initialData?: Partial<ProformaPresetFormData>;
}

export function ProformaPresetModal({
  trigger,
  onSubmit,
  onClose,
  initialData,
}: ProformaPresetModalProps) {
  const t = useTranslations("modals.salesProformaPreset");

  const schema = z.object({
    name: z
      .string()
      .min(1, t("validation.name"))
      .max(100, t("validation.name")),
    bank_name: z
      .string()
      .min(1, t("validation.bank_name"))
      .max(100, t("validation.bank_name")),
    account_number: z
      .string()
      .min(1, t("validation.account_number"))
      .max(64, t("validation.account_number")),
    sheba_number: z
      .string()
      .min(1, t("validation.sheba_number"))
      .max(34, t("validation.sheba_number")),
    description: z.string().optional(),
  });

  const [open, setOpen] = useState(trigger ? false : true);

  const form = useForm<ProformaPresetFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name || "",
      bank_name: initialData?.bank_name || "",
      account_number: initialData?.account_number || "",
      sheba_number: initialData?.sheba_number || "",
      description: initialData?.description || "",
    },
  });

  const handleSubmit = (data: ProformaPresetFormData) => {
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
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent
        dir="rtl"
        className="min-w-[70%] max-h-[90vh] overflow-y-auto scrollbar-hide p-0 my-0 mx-auto [&>button]:hidden"
      >
        <DialogHeader
          className="px-3.5 py-4.5 justify-start"
          style={{ backgroundColor: "#f6d265" }}
        >
          <DialogTitle className="font-bold text-white text-right">
            {t("title")}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Create sales proforma preset
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6 py-4 px-12"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control as any}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("name")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control as any}
                name="bank_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("bank_name")}</FormLabel>
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
                control={form.control as any}
                name="account_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("account_number")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control as any}
                name="sheba_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("sheba_number")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <Textarea rows={6} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 justify-end">
              <Button
                type="submit"
                className="bg-[#f6d265] hover:bg-[#f5c842] text-black"
              >
                {t("save")}
              </Button>
              <Button type="button" variant="outline" onClick={handleClose}>
                {t("cancel")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
