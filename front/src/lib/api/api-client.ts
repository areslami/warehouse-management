interface FetchOptions {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  showError?: boolean;
}

const getErrorMessage = (data: any, status: number): string => {
  if (typeof data === 'string') return data;
  if (data?.detail) return Array.isArray(data.detail) ? data.detail.join(', ') : data.detail;
  if (data?.message) return data.message;
  if (data?.error) return data.error;
  if (Array.isArray(data)) return data.join(', ');
  
  const fieldErrors = Object.entries(data || {})
    .filter(([key]) => key !== 'detail' && key !== 'non_field_errors')
    .map(([field, errors]) => {
      const errorList = Array.isArray(errors) ? errors : [errors];
      return errorList.map(e => `${field}: ${e}`).join(', ');
    })
    .filter(Boolean)
    .join(' | ');
    
  return fieldErrors || `Error ${status}`;
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
        const errorData = await response.json();
        errorMessage = getErrorMessage(errorData, response.status);
      } catch {
        errorMessage = `Error ${response.status}`;
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