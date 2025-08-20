
"use client";

import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations("pages.dashboard");

  return (
    <div className="flex-1 min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-20">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            {t("title")}
          </h1>
          <div className="inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg">
            <span className="mr-2 font-medium">{t("coming_soon")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
