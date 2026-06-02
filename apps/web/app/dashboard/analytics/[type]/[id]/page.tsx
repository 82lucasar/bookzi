export const dynamic = "force-dynamic"
import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getAnalytics, getFilterLabel, type AnalyticsPeriod } from "@/lib/actions/analytics"
import Link from "next/link"
import AnalyticsContent from "../../AnalyticsContent"

const VALID_PERIODS: AnalyticsPeriod[] = ["this_week", "this_month", "last_month", "12_months"]

export default async function AnalyticsDrilldownPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string; id: string }>
  searchParams: Promise<{ period?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { type, id } = await params
  if (type !== "staff" && type !== "service") notFound()

  const { period: rawPeriod } = await searchParams
  const period: AnalyticsPeriod = VALID_PERIODS.includes(rawPeriod as AnalyticsPeriod)
    ? (rawPeriod as AnalyticsPeriod)
    : "this_month"

  const filter = type === "staff" ? { staffId: id } : { serviceId: id }

  const [data, label] = await Promise.all([
    getAnalytics(period, filter),
    getFilterLabel(type, id),
  ])

  if (!data) redirect("/dashboard/setup")
  if (!label) notFound()

  const typeLabel = type === "staff" ? "Espacio" : "Servicio"
  const backHref  = `/dashboard/analytics?period=${period}`
  const baseHref  = `/dashboard/analytics/${type}/${id}`

  return (
    <div style={{ background: "var(--bg)", minHeight: "100dvh", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <header className="app-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href={backHref} className="back-btn">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text-dark)", lineHeight: 1.2 }}>
              {label}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {typeLabel}
            </div>
          </div>
        </div>
        <Link href="/dashboard" className="logo-home-btn">B</Link>
      </header>

      {/* Metrics filtradas */}
      <AnalyticsContent data={data} period={period} baseHref={baseHref} />

      <div style={{ height: 100 }} />
    </div>
  )
}
