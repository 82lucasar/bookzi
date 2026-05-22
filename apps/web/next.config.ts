import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@bookzi/ui", "@bookzi/shared", "@bookzi/db"],
}

export default nextConfig
