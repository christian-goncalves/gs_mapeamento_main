import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/*": ["./src/data/municipios-ibge.json"],
  },
  typescript: {
    // Use only after an explicit `tsc --noEmit` in memory-constrained CI.
    ignoreBuildErrors: process.env.NEXT_BUILD_EXTERNAL_TYPECHECK === "1",
  },
};

export default nextConfig;
