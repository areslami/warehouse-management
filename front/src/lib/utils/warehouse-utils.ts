export function filterByWarehouse<T extends { warehouse: number }>(
  items: T[],
  warehouseId?: number
): T[] {
  return warehouseId
    ? items.filter((item) => item.warehouse === warehouseId)
    : items;
}

export function searchFilter<T extends object>(
  items: T[],
  searchTerm: string,
  searchFields: string[]
): T[] {
  if (!searchTerm) return items;

  const searchLower = searchTerm.toLowerCase();
  return items.filter((item) =>
    searchFields.some((field) => {
      const value = item[field];
      return value && String(value).toLowerCase().includes(searchLower);
    })
  );
}
