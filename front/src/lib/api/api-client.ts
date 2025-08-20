interface FetchOptions {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  showError?: boolean;
}
interface DetailError {
  detail: string | string[];
}

interface MessageError {
  message: string;
}

type FieldErrors = Record<string, string | string[]>;

type ApiError = string | string[] | DetailError | MessageError | FieldErrors;

const getErrorMessage = (data: ApiError, status: number, t: (key: string) => string): string => {
  if (typeof data === "string") {
    if (data.includes("duplicate key value")) {
      if (data.includes("national_id")) {
        return t("errors.duplicate_national_id");
      }
      if (data.includes("personal_code")) {
        return t("errors.duplicate_personal_code");
      }
      if (data.includes("economic_code")) {
        return t("errors.duplicate_economic_code");
      }
      if (data.includes("system_id")) {
        return t("errors.duplicate_system_id");
      }
      return t("errors.duplicate_value");
    }
    return data;
  }

  if (typeof data === "object" && data && "detail" in data)
    return Array.isArray(data.detail)
      ? data.detail.join(", ")
      : (data.detail as string);
  if (
    typeof data === "object" &&
    data &&
    "message" in data &&
    typeof data.message === "string"
  )
    return data.message;
  if (
    typeof data === "object" &&
    data &&
    "error" in data &&
    typeof data.error === "string"
  )
    return data.error;

  if (Array.isArray(data)) return data.join(", ");

  const fieldErrors = Object.entries(data || {})
    .filter(([key]) => key !== "detail" && key !== "non_field_errors")
    .map(([field, errors]) => {
      const errorList = Array.isArray(errors) ? errors : [errors];
      const fieldName = t(`errors.field_names.${field}`) !== `errors.field_names.${field}` ? t(`errors.field_names.${field}`) : field;

      return errorList
        .map((e) => {
          let errorMsg = e;
          if (e.includes("already exists")) {
            errorMsg = t("errors.error_messages.already_exists");
          } else if (e.includes("required")) {
            errorMsg = t("errors.error_messages.required");
          } else if (e.includes("blank")) {
            errorMsg = t("errors.error_messages.blank");
          }
          return `${fieldName}: ${errorMsg}`;
        })
        .join(", ");
    })
    .filter(Boolean)
    .join(" | ");

  return fieldErrors || `${t("errors.error_prefix")} ${status}`;
};

export const apiFetch = async <T>(
  url: string,
  options: FetchOptions = { method: "GET", showError: true },
  t?: (key: string) => string
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
      let errorMessage = "";

      try {
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          const errorData = await response.json();
          errorMessage = t ? getErrorMessage(errorData, response.status, t) : JSON.stringify(errorData);
        } else {
          const text = await response.text();
          if (text.includes("IntegrityError")) {
            if (text.includes("duplicate key")) {
              if (text.includes("national_id")) {
                errorMessage = t ? t("errors.duplicate_national_id") : "Duplicate national ID";
              } else if (text.includes("personal_code")) {
                errorMessage = t ? t("errors.duplicate_personal_code") : "Duplicate personal code";
              } else if (text.includes("economic_code")) {
                errorMessage = t ? t("errors.duplicate_economic_code") : "Duplicate economic code";
              } else if (text.includes("system_id")) {
                errorMessage = t ? t("errors.duplicate_system_id") : "Duplicate system ID";
              } else {
                errorMessage = t ? t("errors.duplicate_value") : "Duplicate value";
              }
            } else {
              errorMessage = t ? t("errors.database_error") : "Database error";
            }
          } else if (text.includes("ValidationError")) {
            errorMessage = t ? t("errors.validation_data_error") : "Validation error";
          } else if (response.status === 500) {
            errorMessage = t ? t("errors.server_error_retry") : "Server error - please try again";
          } else {
            errorMessage = t ? `${t("errors.error_prefix")} ${response.status}` : `Error ${response.status}`;
          }
        }
      } catch {
        errorMessage = t ? `${t("errors.error_prefix")} ${response.status}` : `Error ${response.status}`;
      }

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
    if (
      options.showError !== false &&
      error instanceof Error &&
      !error.message.startsWith("Error ")
    ) {
      const { toast } = await import("../toast-helper");
      toast.error(error.message);
    }

    console.error("API Error:", error);
    throw error;
  }
};
