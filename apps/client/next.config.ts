import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/domain", "@repo/trpc"],
};

export default nextConfig;
