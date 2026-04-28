import { getApiBaseUrl } from "./config";

export interface OverdueDispatch {
  dispatch_id: string;
  validity_date: string;
  warehouse: string;
  customer: string;
  total_weight: number;
}

export interface DeadlineItem {
  id: string;
  type: 'dispatch' | 'offer';
  label: string;
  customer: string;
  warehouse: string;
  weight: number;
  deadline: string;
  days_left: number;
  is_overdue: boolean;
  product?: string;
}

export interface WeeklyTrendPoint {
  date: string;
  received: number;
  delivered: number;
  revenue: number;
  offers: number;
}

export interface RevenueBreakdown {
  product: string;
  total: number;
}

export interface RevenueDetail {
  total_income: number;
  total_spent: number;
  net: number;
  breakdown_by_product: RevenueBreakdown[];
}

export interface InventoryProduct {
  product: string;
  weight: number;
}

export interface InventoryWarehouse {
  warehouse: string;
  products: InventoryProduct[];
}

export interface ActiveOfferItem {
  offer_id: string;
  product: string;
  warehouse: string;
  weight: number;
  unit_price: number;
  total_price: number;
  offer_type: string;
  offer_date: string;
  exp_date: string;
}

export interface PendingDispatchItem {
  dispatch_id: string;
  issue_date: string;
  validity_date: string;
  warehouse: string;
  customer: string;
  total_weight: number;
  is_overdue: boolean;
}

export interface DashboardSummary {
  realized_revenue: number;
  pipeline_revenue: number;
  pending_dispatches: number;
  stock_weight: number;
  active_offers: number;
  deadline_items: DeadlineItem[];
  weekly_trend: WeeklyTrendPoint[];
  revenue_breakdown: RevenueBreakdown[];
  revenue_detail: RevenueDetail;
  inventory_detail: InventoryWarehouse[];
  active_offers_detail: ActiveOfferItem[];
  pending_dispatches_detail: PendingDispatchItem[];
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const res = await fetch(`${getApiBaseUrl()}dashboard/summary/`);
  if (!res.ok) throw new Error(`Dashboard fetch failed: ${res.status}`);
  return res.json();
}
