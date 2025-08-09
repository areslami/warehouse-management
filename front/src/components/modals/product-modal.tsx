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

type ProductFormData = {
  name: string;
  code: string;
  b2bcode: string;
  b2breigon: number;
  category: number;
  description: string;
};

interface ProductModalProps {
  trigger?: React.ReactNode;
  onSubmit?: (data: ProductFormData) => void;
  onClose?: () => void;
}

export function ProductModal({ trigger, onSubmit, onClose }: ProductModalProps) {
  const tval = useTranslations("product.validation");
  const t = useTranslations("product");

  const productSchema = z.object({
    name: z.string().min(1, tval("name")),
    code: z.string().min(1, tval("code")),
    b2bcode: z.string().min(1, tval("b2bcode")),
    b2breigon: z.number().min(1, tval("b2breigon")),
    category: z.number().min(1, tval("category")),
    description: z.string(),
  });

  const [open, setOpen] = useState(trigger ? false : true);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      code: "",
      b2bcode: "",
      b2breigon: 0,
      category: 0,
      description: "",
    },
  });

  const handleSubmit = (data: ProductFormData) => {
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
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
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
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("code")}</FormLabel>
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
                name="b2bcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("b2bcode")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("category")}</FormLabel>
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
            </div>

            <FormField
              control={form.control}
              name="b2breigon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("b2breigon")}</FormLabel>
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