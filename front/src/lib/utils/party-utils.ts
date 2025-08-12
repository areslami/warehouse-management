import { Supplier, Customer, Receiver } from "@/lib/interfaces/core";

export function getPartyDisplayName(party: Supplier | Customer | Receiver | null | undefined): string {
  if (!party) return "";
  
  // Check for Corporate type and return company name
  if ('customer_type' in party && party.customer_type === "Corporate") {
    return party.company_name || party.full_name || "";
  }
  if ('supplier_type' in party && party.supplier_type === "Corporate") {
    return party.company_name || party.full_name || "";
  }  
  if ('receiver_type' in party && party.receiver_type === "Corporate") {
    return party.company_name || party.full_name || "";
  }
  
  // For Individual type, return full name first
  return party.full_name || party.company_name || "";
}