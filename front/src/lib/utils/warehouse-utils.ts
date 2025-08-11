/**
 * Utility functions for warehouse operations
 */

/**
 * Prepare receipt data for API submission
 * Handles empty strings, calculates total weight, and generates receipt ID if needed
 */
export function prepareReceiptData(data: any) {
  const totalWeight = data.items.reduce((sum: number, item: any) => sum + (item.weight || 0), 0);
  
  return {
    ...data,
    receipt_id: data.receipt_id?.trim() || `WR-${Date.now()}`,
    total_weight: totalWeight,
    cottage_serial_number: data.cottage_serial_number?.trim() || undefined,
    proforma: (data.proforma && data.proforma > 0) ? data.proforma : undefined
  };
}

/**
 * Prepare dispatch data for API submission
 */
export function prepareDispatchData(data: any) {
  const totalWeight = data.items.reduce((sum: number, item: any) => sum + (item.weight || 0), 0);
  
  return {
    ...data,
    total_weight: totalWeight
  };
}

/**
 * Prepare delivery data for API submission
 */
export function prepareDeliveryData(data: any) {
  const totalWeight = data.items.reduce((sum: number, item: any) => sum + (item.weight || 0), 0);
  
  return {
    ...data,
    total_weight: totalWeight
  };
}

/**
 * Generic filter function for warehouse entities
 */
export function filterByWarehouse<T extends { warehouse: number }>(
  items: T[],
  warehouseId?: number
): T[] {
  return warehouseId ? items.filter(item => item.warehouse === warehouseId) : items;
}

/**
 * Generic search filter function
 */
export function searchFilter<T extends Record<string, any>>(
  items: T[],
  searchTerm: string,
  searchFields: string[]
): T[] {
  if (!searchTerm) return items;
  
  const searchLower = searchTerm.toLowerCase();
  return items.filter(item => 
    searchFields.some(field => {
      const value = item[field];
      return value && String(value).toLowerCase().includes(searchLower);
    })
  );
}