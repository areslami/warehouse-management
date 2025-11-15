import type { IndicatorSection } from "@/lib/interfaces/core";

export type IndicatorSectionConfig = {
  key: IndicatorSection;
  translationKey: string;
};

export const INDICATOR_SECTIONS: IndicatorSectionConfig[] = [
  { key: "warehouse_receipt", translationKey: "warehouse-receipt" },
  { key: "dispatch_issue", translationKey: "dispatch-issue" },
  { key: "delivery_fulfillment", translationKey: "delivery-fulfillment" },
  { key: "sale_proforma", translationKey: "sale-proforma" },
  { key: "purchase_proforma", translationKey: "purchase-proforma" },
];
