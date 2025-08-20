export const handleApiError = (
  error: unknown,
  operation: string = "API operation"
): string => {
  console.error(`${operation} failed:`, error);

  if (!error || typeof error !== "object" || !("response" in error)) {
    console.error("Network error: No response from server");
    return "خطا در اتصال به سرور";
  }

  const errorObj = error as { response: { status: number; data: unknown } };
  const { status, data } = errorObj.response;
  console.error(`HTTP ${status} error:`, data);

  const statusMessages: Record<number, string> = {
    400: "درخواست نامعتبر",
    401: "لطفا ابتدا وارد سیستم شوید",
    403: "شما اجازه دسترسی به این بخش را ندارید",
    404: "موردی یافت نشد",
    405: "عملیات مجاز نیست",
    408: "زمان اتصال به سرور به پایان رسید",
    415: "نوع فایل پشتیبانی نمی‌شود",
    429: "درخواست‌های شما بیش از حد مجاز است",
  };

  if (statusMessages[status]) {
    return statusMessages[status];
  }

  if (status >= 500) {
    return "خطا در سرور - لطفاً دوباره تلاش کنید";
  }

  if (data && typeof data === "object") {
    const dataObj = data as Record<string, unknown>;

    if (typeof data === "string") {
      const dataStr = data as string;
      if (
        dataStr.includes("duplicate key value") ||
        dataStr.includes("already exists")
      ) {
        if (dataStr.includes("national_id"))
          return "شماره ملی/شناسه ملی تکراری است";
        if (dataStr.includes("personal_code")) return "کد ملی تکراری است";
        if (dataStr.includes("economic_code")) return "کد اقتصادی تکراری است";
        if (dataStr.includes("system_id")) return "شناسه سیستمی تکراری است";
        return "این مقدار قبلاً ثبت شده است";
      }

      const stringErrorMap: Record<string, string> = {
        IntegrityError: "خطا در یکپارچگی داده‌ها",
        ValidationError: "اطلاعات وارد شده نامعتبر است",
        PermissionDenied: "شما اجازه دسترسی به این بخش را ندارید",
        NotFound: "آیتم مورد نظر یافت نشد",
        ParseError: "خطا در تجزیه اطلاعات",
        AuthenticationFailed: "احراز هویت ناموفق",
      };

      for (const [pattern, message] of Object.entries(stringErrorMap)) {
        if (dataStr.includes(pattern)) return message;
      }
    }

    if ("detail" in dataObj && dataObj.detail) {
      if (Array.isArray(dataObj.detail)) {
        return (dataObj.detail as string[]).join(", ");
      }
      return dataObj.detail as string;
    }

    if ("message" in dataObj && dataObj.message) {
      return dataObj.message as string;
    }

    if (!Array.isArray(data)) {
      const fieldErrors = Object.entries(dataObj)
        .filter(([key]) => key !== "detail" && key !== "non_field_errors")
        .map(([field, errors]) => {
          const errorList = Array.isArray(errors) ? errors : [errors];
          const fieldName = getFieldNameInFarsi(field);

          return errorList
            .map((e) => {
              let errorMsg = String(e);
              const errorPatterns: Record<string, string> = {
                "already exists": "تکراری است",
                required: "الزامی است",
                blank: "نمی‌تواند خالی باشد",
                invalid: "نامعتبر است",
                max_length: "طول مجاز را رعایت کنید",
                min_length: "حداقل طول را رعایت کنید",
              };

              for (const [pattern, message] of Object.entries(errorPatterns)) {
                if (errorMsg.includes(pattern)) {
                  errorMsg = message;
                  break;
                }
              }

              return `${fieldName}: ${errorMsg}`;
            })
            .join(", ");
        })
        .filter(Boolean)
        .join(" | ");

      if (fieldErrors) return fieldErrors;
    }
  }

  return "خطا در ارتباط با سرور";
};

const getFieldNameInFarsi = (field: string): string => {
  const fieldMap: Record<string, string> = {
    national_id: "شماره ملی/شناسه ملی",
    personal_code: "کد ملی",
    economic_code: "کد اقتصادی",
    company_name: "نام شرکت",
    full_name: "نام و نام خانوادگی",
    phone: "تلفن",
    address: "آدرس",
    system_id: "شناسه سیستمی",
    unique_id: "شناسه یکتا",
    email: "ایمیل",
    name: "نام",
    description: "توضیحات",
    code: "کد",
    weight: "وزن",
    price: "قیمت",
    date: "تاریخ",
    warehouse: "انبار",
    product: "محصول",
    customer: "مشتری",
    supplier: "تامین‌کننده",
    receiver: "تحویل‌گیرنده",
  };

  return fieldMap[field] || field;
};

export const getOperationError = (
  operation: "create" | "update" | "delete" | "fetch",
  entity: string
): string => {
  const entityMap: Record<string, string> = {
    product: "محصول",
    supplier: "تامین‌کننده",
    customer: "مشتری",
    receiver: "تحویل‌گیرنده",
    warehouse: "انبار",
    receipt: "رسید انبار",
    dispatch: "حواله خروج",
    delivery: "تحویل کالا",
    offer: "عرضه بازارگاه",
    distribution: "عاملیت توزیع بازارگاه",
    sale: "فروش بازارگاه",
    proforma: "پیش‌فاکتور",
    shipping: "شرکت حمل‌ونقل",
  };

  const operationMap: Record<string, string> = {
    create: "ایجاد",
    update: "بروزرسانی",
    delete: "حذف",
    fetch: "دریافت",
  };

  const entityName = entityMap[entity] || entity;
  const operationName = operationMap[operation] || operation;

  return `خطا در ${operationName} ${entityName}`;
};
