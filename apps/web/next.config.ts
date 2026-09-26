import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // @winlerr/ai ships raw TypeScript source (main: ./src/index.ts), so Next
  // must compile it rather than treat it as prebuilt output.
  transpilePackages: ["@winlerr/ai"],
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
