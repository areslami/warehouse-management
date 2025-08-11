'use client';

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Tabs, TabsTrigger, TabsList, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SalesProformaTab } from "@/components/finance/SalesProformaTab";
import { PurchaseProformaTab } from "@/components/finance/PurchaseProformaTab";
import { FileText, Receipt } from "lucide-react";

export default function FinancePage() {
  const t = useTranslations("finance_page");
  const [documentType, setDocumentType] = useState<"proforma" | "invoice">("proforma");

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">{t("title")}</h2>
          
          <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700 font-medium">{t("document_type_label")}</p>
            <Select 
              value={documentType}
              onValueChange={(value) => setDocumentType(value as "proforma" | "invoice")} 
              dir="rtl"
            >
              <SelectTrigger className="w-[280px] text-right bg-white border-gray-300 hover:border-gray-400">
                <SelectValue />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="proforma" className="font-medium">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#f6d265]" />
                    {t("proforma")}
                  </div>
                </SelectItem>
                <SelectItem value="invoice" className="font-medium">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-gray-400" />
                    {t("invoice")}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {documentType === "proforma" && (
          <div className="bg-white rounded-lg shadow-sm">
            <Tabs defaultValue="sales" className="flex-1 flex flex-col">
              <TabsList className="w-full grid grid-cols-2 bg-gray-100 p-1 rounded-t-lg">
                <TabsTrigger 
                  value="purchase" 
                  className="data-[state=active]:bg-[#f6d265] data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all"
                >
                  {t("purchase_proforma_tab")}
                </TabsTrigger>
                <TabsTrigger 
                  value="sales" 
                  className="data-[state=active]:bg-[#f6d265] data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all"
                >
                  {t("sales_proforma_tab")}
                </TabsTrigger>
              </TabsList>
              
              <div className="p-6">
                <TabsContent value="sales" className="mt-0">
                  <SalesProformaTab />
                </TabsContent>
                <TabsContent value="purchase" className="mt-0">
                  <PurchaseProformaTab />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        )}

        {documentType === "invoice" && (
          <div className="bg-white rounded-lg shadow-sm p-12">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <Receipt className="w-16 h-16 text-gray-300" />
              <p className="text-xl text-gray-500">{t("invoice_coming_soon")}</p>
              <p className="text-sm text-gray-400">این بخش در حال توسعه است و به زودی در دسترس خواهد بود</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}