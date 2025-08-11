"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, Package, Tag, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { ProductModal } from "@/components/modals/product-modal";
import { ProductCategoryModal } from "@/components/modals/product-category-modal";
import { ProductRegionModal } from "@/components/modals/product-region-modal";
import { useCoreData } from "@/lib/core-data-context";
import { Product, ProductCategory, ProductRegion } from "@/lib/interfaces/core";
import {
  createProduct, updateProduct, deleteProduct,
  createProductCategory, updateProductCategory, deleteProductCategory,
  createProductRegion, updateProductRegion, deleteProductRegion
} from "@/lib/api/core";

export default function ProductsPage() {
  const t = useTranslations("products_page");
  const { products, productCategories, productRegions, refreshData } = useCoreData();
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [editingRegion, setEditingRegion] = useState<ProductRegion | null>(null);

  const handleDeleteProduct = async (id: number) => {
    if (confirm(t("confirm_delete_product"))) {
      await deleteProduct(id);
      refreshData("products");
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (confirm(t("confirm_delete_category"))) {
      await deleteProductCategory(id);
      refreshData("productCategories");
    }
  };

  const handleDeleteRegion = async (id: number) => {
    if (confirm(t("confirm_delete_region"))) {
      await deleteProductRegion(id);
      refreshData("productRegions");
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
                    <p className="text-sm text-gray-600">کد: {product.code}</p>
                    {product.category && (
                      <p className="text-sm text-gray-600">دسته: {typeof product.category === 'object' ? product.category.name : ''}</p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
              <Tag className="w-5 h-5 text-[#f6d265]" />
              {t("product_categories")}
            </h2>
            <Button
              size="sm"
              className="bg-[#f6d265] hover:bg-[#f5c842] text-black"
              onClick={() => {
                setEditingCategory(null);
                setShowCategoryModal(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              {t("add_category")}
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {productCategories.length === 0 ? (
              <p className="text-gray-500 col-span-full text-center py-8">{t("no_categories")}</p>
            ) : (
              productCategories.map((category) => (
                <Card key={category.id} className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-800">{category.name}</h3>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-gray-100"
                          onClick={() => {
                            setEditingCategory(category);
                            setShowCategoryModal(true);
                          }}
                        >
                          <Edit2 className="w-4 h-4 text-gray-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-gray-100"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    {category.description && (
                      <p className="text-sm text-gray-600">{category.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#f6d265]" />
              {t("product_regions")}
            </h2>
            <Button
              size="sm"
              className="bg-[#f6d265] hover:bg-[#f5c842] text-black"
              onClick={() => {
                setEditingRegion(null);
                setShowRegionModal(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              {t("add_region")}
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {productRegions.length === 0 ? (
              <p className="text-gray-500 col-span-full text-center py-8">{t("no_regions")}</p>
            ) : (
              productRegions.map((region) => (
                <Card key={region.id} className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-800">{region.name}</h3>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-gray-100"
                          onClick={() => {
                            setEditingRegion(region);
                            setShowRegionModal(true);
                          }}
                        >
                          <Edit2 className="w-4 h-4 text-gray-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-gray-100"
                          onClick={() => handleDeleteRegion(region.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    {region.description && (
                      <p className="text-sm text-gray-600">{region.description}</p>
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
            if (editingProduct) {
              await updateProduct(editingProduct.id, data);
            } else {
              await createProduct(data);
            }
            await refreshData("products");
            setShowProductModal(false);
            setEditingProduct(null);
          }}
          onClose={() => {
            setShowProductModal(false);
            setEditingProduct(null);
          }}
        />
      )}

      {showCategoryModal && (
        <ProductCategoryModal
          initialData={editingCategory || undefined}
          onSubmit={async (data) => {
            if (editingCategory) {
              await updateProductCategory(editingCategory.id, data);
            } else {
              await createProductCategory(data);
            }
            await refreshData("productCategories");
            setShowCategoryModal(false);
            setEditingCategory(null);
          }}
          onClose={() => {
            setShowCategoryModal(false);
            setEditingCategory(null);
          }}
        />
      )}

      {showRegionModal && (
        <ProductRegionModal
          initialData={editingRegion || undefined}
          onSubmit={async (data) => {
            if (editingRegion) {
              await updateProductRegion(editingRegion.id, data);
            } else {
              await createProductRegion(data);
            }
            await refreshData("productRegions");
            setShowRegionModal(false);
            setEditingRegion(null);
          }}
          onClose={() => {
            setShowRegionModal(false);
            setEditingRegion(null);
          }}
        />
      )}
    </div>
  );
}