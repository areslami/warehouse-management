"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useTranslations } from "next-intl";
import { useCoreData } from "@/lib/core-data-context";

type ProductFormData = {
  name: string;
  code: string;
  b2bcode: string;
  b2bregion: number;
  category: number;
  description: string;
};

interface ProductModalProps {
  trigger?: React.ReactNode;
  onSubmit?: (data: ProductFormData) => void;
  onClose?: () => void;
  initialData?: Partial<ProductFormData>;
}

export function ProductModal({ trigger, onSubmit, onClose, initialData }: ProductModalProps) {
  const tval = useTranslations("product.validation");
  const t = useTranslations("product");
  const { data, refreshData } = useCoreData();
  
  useEffect(() => {
    if (data.productCategories.length === 0) {
      refreshData('productCategories');
    }
    if (data.productRegions.length === 0) {
      refreshData('productRegions');
    }
  }, []);

  const productSchema = z.object({
    name: z.string().min(1, tval("name")),
    code: z.string().min(1, tval("code")),
    b2bcode: z.string().min(1, tval("b2bcode")),
    b2bregion: z.number().min(1, tval("b2bregion")),
    category: z.number().min(1, tval("category")),
    description: z.string(),
  });

  const [open, setOpen] = useState(trigger ? false : true);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name || "",
      code: initialData?.code || "",
      b2bcode: initialData?.b2bcode || "",
      b2bregion: initialData?.b2bregion || 0,
      category: initialData?.category || 0,
      description: initialData?.description || "",
    },
  });

  const handleSubmit = (data: ProductFormData) => {
    onSubmit?.(data);
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
          <DialogDescription className="sr-only">Create or edit product</DialogDescription>
        </DialogHeader>

        <Form {...form} >
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4 px-12">
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
                      <Select
                        value={field.value > 0 ? field.value.toString() : ""}
                        onValueChange={(value) => field.onChange(Number(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("select-category")} />
                        </SelectTrigger>
                        <SelectContent>
                          {data.productCategories.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
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
              name="b2bregion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("b2breigon")}</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value > 0 ? field.value.toString() : ""}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("select-region")} />
                      </SelectTrigger>
                      <SelectContent>
                        {data.productRegions.map((region) => (
                          <SelectItem key={region.id} value={region.id.toString()}>
                            {region.name}
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