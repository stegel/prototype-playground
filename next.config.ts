import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
    resolveAlias: {
      "@prototypes": "./prototypes-repo/src/prototypes",
    },
  },
};

export default nextConfig;
