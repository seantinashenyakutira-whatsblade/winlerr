import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NOTE: legacy /winlaos* aliases are handled in middleware.ts (host-aware:
  // marketing hosts redirect to OS destinations, other hosts rewrite
  // internally). They must NOT also live in redirects() — config-level
  // redirects take precedence over middleware and would bypass the
  // host-aware mapping with a wrong-host hop.
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  // @winlerr/* packages ship raw TypeScript source (main: ./src/index.ts),
  // so Next must compile them rather than treat them as prebuilt output.
  transpilePackages: ["@winlerr/ai", "@winlerr/auth", "@winlerr/workspace"],
  webpack: (config) => {
    // packages/ai is authored for NodeNext resolution, so its relative
    // imports carry explicit `.js` extensions that actually point at `.ts`
    // sources. Map them back so webpack can resolve them.
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      ".js": [".ts", ".tsx", ".js"],
    };
    return config;
  },
};

export default nextConfig;
