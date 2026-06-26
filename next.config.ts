import type { NextConfig } from "next";

// When EXPORT=1 (the `ship` flow), build a fully static export rooted at the
// subpath it lives on under liamhowell.com. Normal `npm run dev` stays at "/".
const isExport = process.env.EXPORT === "1";

const nextConfig: NextConfig = isExport
  ? {
      output: "export",
      basePath: "/games/managing-up",
      trailingSlash: true,
      images: { unoptimized: true },
    }
  : {};

export default nextConfig;
