import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@bookzi/ui", "@bookzi/shared"],
  experimental: {
    typedRoutes: true,
  },
}

export default nextConfig
