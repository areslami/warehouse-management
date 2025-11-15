import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  /* config options here */
};

export default createNextIntlPlugin("./next-intl.config.ts")(nextConfig);
