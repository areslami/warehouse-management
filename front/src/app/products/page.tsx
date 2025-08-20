"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ProductModal } from "@/components/modals/product-modal";
import { useCoreData } from "@/lib/core-data-context";
import { Product } from "@/lib/interfaces/core";
import {
  createProduct, updateProduct, deleteProduct,

} from "@/lib/api/core";

export default function ProductsPage() {
  const t = useTranslations("pages.product");
  const tErrors = useTranslations("errors");
  const tCommon = useTranslations("common");
  const { products, refreshData } = useCoreData();
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const handleDeleteProduct = async (id: number) => {
    if (confirm(t("confirm_delete_product"))) {
      try {
        await deleteProduct(id);
        refreshData("products");
        toast.success(tErrors("success_delete"));
      } catch (error) {
        console.error("Error deleting product:", error);
        toast.error(tErrors("delete_failed"));
      }
    }
  };



  return (
    <div className="flex-1 p-6 min-h-screen bg-gray-50" dir="rtl">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">{t("title")}</h1>

      <div className="space-y-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
              <Package className="w-5 h-5 text-[#f6d265]" />
              {t("products")}
            </h2>
            <Button
              size="sm"
              className="bg-[#f6d265] hover:bg-[#f5c842] text-black"
              onClick={() => {
                setEditingProduct(null);
                setShowProductModal(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              {t("add_product")}
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.length === 0 ? (
              <p className="text-gray-500 col-span-full text-center py-8">{t("no_products")}</p>
            ) : (
              products.map((product) => (
                <Card key={product.id} className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-800">{product.name}</h3>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-gray-100"
                          onClick={() => {
                            setEditingProduct(product);
                            setShowProductModal(true);
                          }}
                        >
                          <Edit2 className="w-4 h-4 text-gray-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-gray-100"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{tCommon('product_labels.product_code')} {product.code}</p>
                    {product.category && (
                      <p className="text-sm text-gray-600">{tCommon('product_labels.product_category')} {typeof product.category === 'object' ? product.category.name : ''}</p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

      </div>

      {showProductModal && (
        <ProductModal
          initialData={editingProduct ? {
            ...editingProduct,
            b2bregion: editingProduct.b2bregion?.id || editingProduct.b2bregion,
            category: editingProduct.category?.id || editingProduct.category
          } : undefined}
          onSubmit={async (data) => {
            try {
              if (editingProduct) {
                await updateProduct(editingProduct.id, data);
                toast.success(tErrors("success_update"));
              } else {
                await createProduct(data);
                toast.success(tErrors("success_create"));
              }
              await refreshData("products");
              setShowProductModal(false);
              setEditingProduct(null);
            } catch (error) {
              console.error("Error saving product:", error);
              toast.error(editingProduct ? tErrors("update_failed") : tErrors("create_failed"));
            }
          }}
          onClose={() => {
            setShowProductModal(false);
            setEditingProduct(null);
          }}
        />
      )}



    </div>
  );
}