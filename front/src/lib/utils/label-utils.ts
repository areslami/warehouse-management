import { toJalali } from "@/lib/utils/persian-date";
import { formatNumber } from "@/lib/utils/number-format";
import type { Product, Supplier, Customer, Receiver, ShippingCompany } from "@/lib/interfaces/core";
import type { Warehouse, WarehouseReceipt } from "@/lib/interfaces/warehouse";
import type { PurchaseProforma, SalesProforma } from "@/lib/interfaces/finance";
import type { B2BOffer, B2BDistribution, B2BAddress } from "@/lib/interfaces/b2b";

export function describeProduct(p: Product): string {
  const parts = [p.name];
  if (p.code) parts.push(p.code);
  if (p.category) parts.push(p.category);
  return parts.filter(Boolean).join(" - ");
}

export function describeParty(p: Supplier | Customer | Receiver): string {
  const name = ("company_name" in p && p.company_name) || ("full_name" in p && p.full_name) || "";
  const extra = p.phone || p.economic_code || "";
  return [name, extra].filter(Boolean).join(" - ");
}

export function describeWarehouse(w: Warehouse): string {
  return [w.name, w.manager, w.phone].filter(Boolean).join(" - ");
}

export function describeShippingCompany(c: ShippingCompany): string {
  return [c.name, c.contact_person, c.phone].filter(Boolean).join(" - ");
}

export function describeSalesProforma(p: SalesProforma): string {
  const date = toJalali(p.date || "");
  const total = formatNumber(p.final_price);
  return [p.serial_number, p.customer_name, date, total].filter(Boolean).join(" - ");
}

export function describePurchaseProforma(p: PurchaseProforma): string {
  const date = toJalali(p.date || "");
  const total = formatNumber(p.final_price);
  return [p.serial_number, p.supplier_name, date, total].filter(Boolean).join(" - ");
}

export function describeWarehouseReceipt(r: WarehouseReceipt): string {
  const id = r.receipt_id || r.id.toString();
  const date = toJalali(r.date || "");
  const first = r.items && r.items[0];
  const itemCount = r.items ? r.items.length : 0;
  const isSingle = itemCount === 1;
  const sameWeight = isSingle && first && typeof first.weight === "number" && typeof r.total_weight === "number" && first.weight === r.total_weight;

  const total = r.total_weight && !sameWeight ? `${formatNumber(r.total_weight)} کیلوگرم` : "";

  let firstDesc = "";
  if (first) {
    const base = first.product_name || "";
    if (isSingle) {
      firstDesc = sameWeight && first.weight ? `${base} ${formatNumber(first.weight)} کیلوگرم` : base;
    } else {
      firstDesc = base;
    }
  }
  const more = itemCount > 1 ? `+${itemCount - 1}` : "";
  const productPart = [firstDesc, more].filter(Boolean).join(" ");
  return [id, r.warehouse_name, date, total, productPart].filter(Boolean).join(" - ");
}

const OFFER_STATUS_FA: Record<string, string> = {
  pending: "در انتظار",
  active: "فعال",
  sold: "فروخته شده",
  expired: "منقضی شده",
};

export function describeOffer(o: B2BOffer): string {
  const date = toJalali(o.offer_date || "");
  const weight = o.offer_weight ? `${formatNumber(o.offer_weight)} کیلوگرم` : "";
  const price = o.unit_price ? `${formatNumber(o.unit_price)} ریال` : "";
  const product = (o as any).product_name as string | undefined;
  const status = o.status ? (OFFER_STATUS_FA[o.status] ?? o.status) : "";
  return [o.offer_id, product, weight, date, status, price].filter(Boolean).join(" - ");
}

export function describeDistribution(d: B2BDistribution): string {
  const date = toJalali(d.agency_date || "");
  const weight = d.agency_weight ? `${formatNumber(d.agency_weight)} کیلوگرم` : "";
  return [d.transfer_id, d.customer_name, d.product_name, weight, date].filter(Boolean).join(" - ");
}

export function describeB2BAddress(a: B2BAddress): string {
  const date = a.purchase_date ? toJalali(a.purchase_date) : "";
  const weight = a.total_weight_purchased ? `${formatNumber(a.total_weight_purchased)} کیلوگرم` : "";
  return [a.allocation_id, a.customer_name, a.product_name, weight, date, a.city].filter(Boolean).join(" - ");
}
