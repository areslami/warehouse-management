import createMiddleware from "next-intl/middleware";

export default createMiddleware({
  locales: ["fa"],
  defaultLocale: "fa",
  localePrefix: "never",
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
