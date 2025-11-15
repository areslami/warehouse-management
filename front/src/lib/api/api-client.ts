import { handleApiError } from "./error-handler";

interface FetchOptions {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  showError?: boolean;
}

export const apiFetch = async <T>(
  url: string,
  options: FetchOptions = { method: "GET", showError: true }
): Promise<T | null> => {
  const config: RequestInit = {
    method: options.method,
    headers: { "Content-Type": "application/json" },
    body: options.body ? JSON.stringify(options.body) : undefined,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorResponse = {
        response: {
          status: response.status,
          data: null as unknown,
        },
      };

      try {
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          errorResponse.response.data = await response.json();
        } else {
          errorResponse.response.data = await response.text();
        }
      } catch {
        errorResponse.response.data = `HTTP ${response.status} Error`;
      }

      const errorMessage = handleApiError(
        errorResponse,
        `${options.method} ${url}`
      );

      if (options.showError !== false) {
        const { toast } = await import("../toast-helper");
        toast.error(errorMessage);
      }

      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  } catch (error) {
    const e = error as Error & { response?: { status: number; data: unknown } };
    if (!e.response) {
      const networkError = handleApiError(error, `${options.method} ${url}`);

      if (options.showError !== false) {
        const { toast } = await import("../toast-helper");
        toast.error(networkError);
      }

      throw new Error(networkError);
    }

    throw error;
  }
};
