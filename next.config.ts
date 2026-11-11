import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/relatorio-mensal/:groupKey/:month/:year",
        destination: "/api/relatorios/mensal/:groupKey/:month/:year",
      },
      {
        source: "/ata-:number/:date/:groupKey",
        destination: "/api/atas/friendly/:number/:date/:groupKey",
      },
    ];
  },
  outputFileTracingIncludes: {
    "/*": ["./src/data/municipios-ibge.json"],
  },
  typescript: {
    // Use only after an explicit `tsc --noEmit` in memory-constrained CI.
    ignoreBuildErrors: process.env.NEXT_BUILD_EXTERNAL_TYPECHECK === "1",
  },
};

export default nextConfig;
