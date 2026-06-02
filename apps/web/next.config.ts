import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"

const nextConfig: NextConfig = {
  transpilePackages: ["@bookzi/ui", "@bookzi/shared", "@bookzi/db"],
}

const sentryOptions = {
  ...(process.env.SENTRY_ORG     && { org:     process.env.SENTRY_ORG }),
  ...(process.env.SENTRY_PROJECT && { project: process.env.SENTRY_PROJECT }),
  silent:  !process.env.CI,
  widenClientFileUpload: true,
  sourcemaps: { deleteSourcemapsAfterUpload: true },
  disableLogger: true,
  automaticVercelMonitors: true,
} as const

export default withSentryConfig(nextConfig, sentryOptions)
