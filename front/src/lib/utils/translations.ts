// Utility functions for translating enum values

export function translateReceiptType(type: string): string {
  const translations: Record<string, string> = {
    'import_cottage': 'وارده کوتاژ',
    'distribution_cottage': 'توزیع کوتاژ',
    'purchase': 'خرید'
  };
  return translations[type] || type;
}

export function translateVehicleType(type: string): string {
  const translations: Record<string, string> = {
    'truck': 'کامیون',
    'pickup': 'وانت',
    'van': 'ون',
    'container': 'کانتینر',
    'other': 'سایر'
  };
  return translations[type] || type;
}

export function translatePaymentType(type: string): string {
  const translations: Record<string, string> = {
    'cash': 'نقدی',
    'credit': 'اعتباری',
    'other': 'سایر',
    'Cash': 'نقدی',
    'Credit': 'اعتباری',
    'Installment': 'اقساطی'
  };
  return translations[type] || type;
}

export function translateOfferStatus(status: string): string {
  const translations: Record<string, string> = {
    'pending': 'در انتظار',
    'accepted': 'پذیرفته شده',
    'rejected': 'رد شده',
    'expired': 'منقضی شده'
  };
  return translations[status] || status;
}

export function translatePartyType(type: string): string {
  const translations: Record<string, string> = {
    'Individual': 'شخص حقیقی',
    'Corporate': 'شخص حقوقی'
  };
  return translations[type] || type;
}