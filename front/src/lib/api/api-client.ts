interface FetchOptions {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  showError?: boolean;
}

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
      const errorMessage = `خطا در ارتباط با سرور: ${response.status} ${response.statusText}`;
      
      if (options.showError !== false) {
        // Import toast dynamically to avoid circular dependencies
        const { toast } = await import('./toast-helper');
        toast.error(errorMessage);
      }
      
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'خطای نامشخص در ارتباط با سرور';
    
    if (options.showError !== false) {
      const { toast } = await import('./toast-helper');
      toast.error(errorMessage);
    }
    
    console.error('API Error:', error);
    throw error;
  }
};