import type { RequestConfig } from "next-intl/server";

export default async function getRequestConfig({
  locale,
}: {
  locale?: string;
}): Promise<RequestConfig> {
  const activeLocale = locale || "fa";

  const messages = (await import(`./src/messages/fa.json`)).default;

  return {
    locale: activeLocale,
    messages,
  };
}
