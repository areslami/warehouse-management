interface FetchOptions {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  showError?: boolean;
}

const getErrorMessage = (data: any, status: number): string => {
  if (typeof data === 'string') {
    // Handle database constraint errors
    if (data.includes('duplicate key value')) {
      if (data.includes('national_id')) {
        return 'شماره ملی/شناسه ملی تکراری است';
      }
      if (data.includes('personal_code')) {
        return 'کد ملی تکراری است';
      }
      if (data.includes('economic_code')) {
        return 'کد اقتصادی تکراری است';
      }
      if (data.includes('system_id')) {
        return 'شناسه سیستمی تکراری است';
      }
      return 'این مقدار قبلاً ثبت شده است';
    }
    return data;
  }
  
  if (data?.detail) return Array.isArray(data.detail) ? data.detail.join(', ') : data.detail;
  if (data?.message) return data.message;
  if (data?.error) return data.error;
  if (Array.isArray(data)) return data.join(', ');
  
  // Handle field-specific errors
  const fieldErrors = Object.entries(data || {})
    .filter(([key]) => key !== 'detail' && key !== 'non_field_errors')
    .map(([field, errors]) => {
      const errorList = Array.isArray(errors) ? errors : [errors];
      // Translate field names to Persian
      const fieldName = {
        'national_id': 'شماره ملی/شناسه ملی',
        'personal_code': 'کد ملی',
        'economic_code': 'کد اقتصادی',
        'company_name': 'نام شرکت',
        'full_name': 'نام و نام خانوادگی',
        'phone': 'تلفن',
        'address': 'آدرس',
        'system_id': 'شناسه سیستمی',
        'unique_id': 'شناسه یکتا'
      }[field] || field;
      
      return errorList.map(e => {
        // Translate common error messages
        let errorMsg = e;
        if (e.includes('already exists')) {
          errorMsg = 'تکراری است';
        } else if (e.includes('required')) {
          errorMsg = 'الزامی است';
        } else if (e.includes('blank')) {
          errorMsg = 'نمی‌تواند خالی باشد';
        }
        return `${fieldName}: ${errorMsg}`;
      }).join(', ');
    })
    .filter(Boolean)
    .join(' | ');
    
  return fieldErrors || `خطا ${status}`;
};

export const apiFetch = async <T>(
  url: string,
  options: FetchOptions = { method: "GET", showError: true }
): Promise<T | null> => {
  const headers = {
    "Content-Type": "application/json",
  };

  const config: RequestInit = {
    method: options.method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorMessage = '';
      
      try {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = getErrorMessage(errorData, response.status);
        } else {
          // Handle HTML error pages (like Django's debug page)
          const text = await response.text();
          // Try to extract meaningful error from HTML
          if (text.includes('IntegrityError')) {
            if (text.includes('duplicate key')) {
              if (text.includes('national_id')) {
                errorMessage = 'شماره ملی/شناسه ملی تکراری است';
              } else if (text.includes('personal_code')) {
                errorMessage = 'کد ملی تکراری است';
              } else if (text.includes('economic_code')) {
                errorMessage = 'کد اقتصادی تکراری است';
              } else if (text.includes('system_id')) {
                errorMessage = 'شناسه سیستمی تکراری است';
              } else {
                errorMessage = 'این مقدار قبلاً ثبت شده است';
              }
            } else {
              errorMessage = 'خطا در پایگاه داده';
            }
          } else if (text.includes('ValidationError')) {
            errorMessage = 'خطا در اعتبارسنجی داده‌ها';
          } else if (response.status === 500) {
            errorMessage = 'خطای سرور - لطفاً دوباره تلاش کنید';
          } else {
            errorMessage = `خطا ${response.status}`;
          }
        }
      } catch {
        errorMessage = `خطا ${response.status}`;
      }
      
      if (options.showError !== false) {
        const { toast } = await import('../toast-helper');
        toast.error(errorMessage);
      }
      
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  } catch (error) {
    if (options.showError !== false && error instanceof Error && !error.message.startsWith('Error ')) {
      const { toast } = await import('../toast-helper');
      toast.error(error.message);
    }
    
    console.error('API Error:', error);
    throw error;
  }
};