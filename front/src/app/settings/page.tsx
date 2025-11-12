"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Sparkles,
  Plus,
  SlidersHorizontal,
  PenLine,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle as DialogHeading,
} from "@/components/ui/dialog";
import {
  IndicatorFormData,
  IndicatorModal,
} from "@/components/modals/settings/indicator-modal";
import {
  createIndicator,
  updateIndicator,
  deleteIndicator,
  fetchIndicators,
  setDefaultIndicator,
} from "@/lib/api/core";
import type { Indicator, IndicatorSection } from "@/lib/interfaces/core";
import { SimpleCombobox } from "@/components/ui/simple-combobox";
import { INDICATOR_SECTIONS } from "@/lib/constants/indicator-sections";
import {
  DEFAULT_INDICATOR_TEMPLATE,
  buildIndicatorPreview,
} from "@/lib/indicator-format";
import { toPersianDigits } from "@/lib/utils/numbers";
import {
  renderLocalizedValue,
  VALUE_PLACEHOLDER,
} from "@/lib/utils/localized-value";

const badgeClasses: Record<IndicatorSection, string> = {
  warehouse_receipt: "bg-blue-50 text-blue-700 border border-blue-200",
  dispatch_issue: "bg-purple-50 text-purple-700 border border-purple-200",
  delivery_fulfillment:
    "bg-emerald-50 text-emerald-700 border border-emerald-200",
  sale_proforma: "bg-amber-50 text-amber-800 border border-amber-200",
  purchase_proforma: "bg-rose-50 text-rose-700 border border-rose-200",
};

export default function SettingsPage() {
  const t = useTranslations("pages.settings");
  const tSidebar = useTranslations("sidebar");
  const tCommon = useTranslations("common");

  const [indicatorModalOpen, setIndicatorModalOpen] = useState(false);
  const [editingIndicator, setEditingIndicator] = useState<Indicator | null>(
    null
  );
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [indicatorsLoading, setIndicatorsLoading] = useState(false);
  const [settingSection, setSettingSection] = useState<IndicatorSection | null>(
    null
  );
  const [defaultsDialogOpen, setDefaultsDialogOpen] = useState(false);

  const sectionConfigs = useMemo(
    () =>
      INDICATOR_SECTIONS.map((section) => ({
        key: section.key,
        label: tSidebar(section.translationKey),
        helper: t(`defaults.sections.${section.key}`),
      })),
    [t, tSidebar]
  );

  const sectionLabel = (key: IndicatorSection) =>
    sectionConfigs.find((section) => section.key === key)?.label ?? key;

  const loadIndicators = async () => {
    setIndicatorsLoading(true);
    try {
      const data = await fetchIndicators();
      setIndicators(data ?? []);
    } catch (error) {
      console.error("Failed to load indicators:", error);
      toast.error(tCommon("toast_messages.loading_failed"));
    } finally {
      setIndicatorsLoading(false);
    }
  };

  useEffect(() => {
    loadIndicators();
  }, []);

  const handleModalClose = () => {
    setEditingIndicator(null);
    setIndicatorModalOpen(false);
  };

  const handleIndicatorSubmit = async (data: IndicatorFormData) => {
    try {
      if (editingIndicator) {
        await updateIndicator(editingIndicator.id, data);
        toast.success(tCommon("toast_messages.update_success"));
      } else {
        await createIndicator(data);
        toast.success(
          `${tSidebar("indicator")} - ${tCommon(
            "toast_messages.create_success_suffix"
          )}`
        );
      }
      await loadIndicators();
      setEditingIndicator(null);
    } catch (error) {
      console.error("Failed to save indicator:", error);
      toast.error(tCommon("toast_messages.indicator_error"));
      throw error;
    }
  };

  const handleDeleteIndicator = async (indicator: Indicator) => {
    const confirmed = window.confirm(
      t("indicator_list.confirm_delete", { name: indicator.name })
    );
    if (!confirmed) return;
    try {
      await deleteIndicator(indicator.id);
      toast.success(tCommon("toast_messages.delete_success"));
      await loadIndicators();
    } catch (error) {
      console.error("Failed to delete indicator:", error);
      toast.error(tCommon("toast_messages.indicator_error"));
    }
  };

  const handleSelectDefault = async (
    sectionKey: IndicatorSection,
    indicatorIdValue: string
  ) => {
    if (!indicatorIdValue) return;
    const indicatorId = Number(indicatorIdValue);
    if (Number.isNaN(indicatorId)) return;

    setSettingSection(sectionKey);
    try {
      await setDefaultIndicator(indicatorId);
      toast.success(tCommon("toast_messages.indicator_default_success"));
      setIndicators((prev) =>
        prev.map((indicator) =>
          indicator.belongs === sectionKey
            ? { ...indicator, is_default: indicator.id === indicatorId }
            : indicator
        )
      );
    } catch (error) {
      console.error("Failed to set default indicator:", error);
      toast.error(tCommon("toast_messages.indicator_error"));
    } finally {
      setSettingSection(null);
    }
  };

  const sortedIndicators = useMemo(
    () => [...indicators].sort((a, b) => a.belongs.localeCompare(b.belongs)),
    [indicators]
  );

  const formatNextValue = (indicator: Indicator) =>
    buildIndicatorPreview(
      indicator.format_template || DEFAULT_INDICATOR_TEMPLATE,
      {
        counter: (indicator.counter ?? 0) + 1,
      }
    );

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            {t("subtitle")}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <Card className="border-dashed border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="text-xl">
                  {t("indicator.title")}
                </CardTitle>
                <CardDescription>{t("indicator.description")}</CardDescription>
              </div>
              <div className="rounded-full bg-yellow-100 p-3 text-yellow-600">
                <Sparkles className="h-6 w-6" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4 flex justify-between pt-0">
              <p className="text-sm text-muted-foreground">
                {t("indicator.helper")}
              </p>
              <div className="flex items-end gap-3 ">
                <Button
                  className="bg-[#f6d265] hover:bg-[#f5c842] text-black"
                  onClick={() => {
                    setEditingIndicator(null);
                    setIndicatorModalOpen(true);
                  }}
                >
                  <Plus className="ml-2 h-4 w-4" />
                  {t("indicator.action")}
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => setDefaultsDialogOpen(true)}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  {t("defaults.title")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-2">
          {indicatorsLoading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {t("defaults.loading")}
            </div>
          ) : sortedIndicators.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {t("indicator_list.empty")}
            </div>
          ) : (
            <div className="grid gap-3">
              {sortedIndicators.map((indicator) => {
                const key = indicator.belongs as IndicatorSection;
                const badge =
                  badgeClasses[key] ??
                  "bg-gray-100 text-gray-700 border border-gray-200";
                const counterTemplate = t("indicator_list.current_counter", {
                  value: VALUE_PLACEHOLDER,
                });
                const nextValueTemplate = t("indicator_list.next_value", {
                  value: VALUE_PLACEHOLDER,
                });
                const formattedCounter = toPersianDigits(
                  indicator.counter ?? 0
                );
                const nextValue = formatNextValue(indicator);
                return (
                  <div
                    key={indicator.id}
                    className="rounded-lg border border-gray-100 bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-gray-900">
                          {indicator.name}
                        </p>
                        <p className="text-xs text-muted-foreground" dir="rtl">
                          {renderLocalizedValue(
                            counterTemplate,
                            <bdi
                              dir="auto"
                              style={{ unicodeBidi: "plaintext" }}
                            >
                              {formattedCounter}
                            </bdi>,
                            "font-mono"
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground" dir="rtl">
                          {renderLocalizedValue(
                            nextValueTemplate,
                            nextValue.parts.map((part, index) => (
                              <bdi
                                key={`${indicator.id}-next-${index}`}
                                dir="auto"
                                style={{ unicodeBidi: "plaintext" }}
                                className="leading-none"
                              >
                                {part}
                              </bdi>
                            )),
                            "font-mono"
                          )}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge}`}
                        >
                          {sectionLabel(key)}
                        </span>
                        {indicator.is_default && (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                            {t("defaults.default_badge")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex-1" />
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-gray-600 hover:text-gray-900"
                          onClick={() => {
                            setEditingIndicator(indicator);
                            setIndicatorModalOpen(true);
                          }}
                          aria-label={t("indicator_list.edit")}
                        >
                          <PenLine className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                          onClick={() => handleDeleteIndicator(indicator)}
                          aria-label={t("indicator_list.delete")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {indicatorModalOpen && (
        <IndicatorModal
          initialData={
            editingIndicator
              ? {
                  name: editingIndicator.name,
                  belongs: editingIndicator.belongs as IndicatorSection,
                  format_template: editingIndicator.format_template,
                }
              : undefined
          }
          onSubmit={handleIndicatorSubmit}
          onClose={handleModalClose}
        />
      )}

      <Dialog open={defaultsDialogOpen} onOpenChange={setDefaultsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogHeading>{t("defaults.title")}</DialogHeading>
            <p className="text-sm text-muted-foreground">
              {t("defaults.description")}
            </p>
          </DialogHeader>
          {indicatorsLoading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {t("defaults.loading")}
            </div>
          ) : (
            <div className="space-y-4">
              {sectionConfigs.map((section) => {
                const sectionIndicators = indicators.filter(
                  (indicator) => indicator.belongs === section.key
                );
                const defaultIndicator = sectionIndicators.find(
                  (indicator) => indicator.is_default
                );
                const options = sectionIndicators.map((indicator) => {
                  const nextValue = formatNextValue(indicator);
                  return {
                    value: indicator.id.toString(),
                    label: `${indicator.name} • ${t(
                      "indicator_list.next_value",
                      { value: nextValue.text }
                    )}`,
                    name: indicator.name,
                  };
                });

                return (
                  <div
                    key={section.key}
                    className="grid gap-2 rounded-md border border-gray-100 p-3 shadow-sm md:grid-cols-[1fr_240px]"
                  >
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-800">
                        {section.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {section.helper}
                      </p>
                    </div>
                    <SimpleCombobox
                      options={options}
                      value={defaultIndicator?.id.toString() || ""}
                      placeholder={
                        sectionIndicators.length
                          ? t("defaults.placeholder")
                          : t("defaults.empty")
                      }
                      searchPlaceholder={t("defaults.search")}
                      emptyText={t("defaults.empty")}
                      disabled={
                        sectionIndicators.length === 0 ||
                        settingSection === section.key
                      }
                      onValueChange={(value) =>
                        handleSelectDefault(section.key, value)
                      }
                    />
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
