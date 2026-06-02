export const dynamic = "force-dynamic"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getAnalytics, getAnalyticsSummary, type AnalyticsPeriod } from "@/lib/actions/analytics"
import Link from "next/link"
import AnalyticsContent from "./AnalyticsContent"

const VALID_PERIODS: AnalyticsPeriod[] = ["this_week", "this_month", "last_month", "12_months"]

function formatRevenue(n: number) {
  return `$${n.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { period: rawPeriod } = await searchParams
  const period: AnalyticsPeriod = VALID_PERIODS.includes(rawPeriod as AnalyticsPeriod)
    ? (rawPeriod as AnalyticsPeriod)
    : "this_month"

  const [data, summary] = await Promise.all([
    getAnalytics(period),
    getAnalyticsSummary(period),
  ])

  if (!data) redirect("/dashboard/setup")

  const showStaff    = (summary?.staff.length ?? 0) > 1
  const showServices = (summary?.services.length ?? 0) > 1

  return (
    <div style={{ background: "var(--bg)", minHeight: "100dvh", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <header className="app-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/dashboard" className="back-btn">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <span style={{ fontSize: 17, fontWeight: 700, color: "var(--text-dark)" }}>Métricas</span>
        </div>
        <Link href="/dashboard" className="logo-home-btn">B</Link>
      </header>

      {/* Metrics */}
      <AnalyticsContent data={data} period={period} baseHref="/dashboard/analytics" />

      {/* ── Drill-down: Por espacio ── */}
      {showStaff && summary && (
        <div style={{ padding: "0 16px 24px" }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-dark)", letterSpacing: "-0.3px", marginBottom: 12 }}>
            Por espacio
          </div>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
            {summary.staff.map(s => (
              <Link
                key={s.id}
                href={`/dashboard/analytics/staff/${s.id}?period=${period}`}
                style={{ textDecoration: "none", flexShrink: 0 }}
              >
                <div style={{
                  background: "white", borderRadius: 16, border: "1.5px solid var(--border)",
                  padding: "14px 16px", width: 160,
                  display: "flex", flexDirection: "column", gap: 4,
                  transition: "border-color 150ms",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-dark)", lineHeight: 1.3, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 6 }}>
                      {s.name}
                    </div>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                      <path d="M4 7h6M7 4l3 3-3 3" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-dark)" }}>
                    {s.total} turno{s.total !== 1 ? "s" : ""}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {s.revenue > 0 ? formatRevenue(s.revenue) : "Sin ingresos"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Drill-down: Por servicio ── */}
      {showServices && summary && (
        <div style={{ padding: "0 16px 100px" }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-dark)", letterSpacing: "-0.3px", marginBottom: 12 }}>
            Por servicio
          </div>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
            {summary.services.map(s => (
              <Link
                key={s.id}
                href={`/dashboard/analytics/service/${s.id}?period=${period}`}
                style={{ textDecoration: "none", flexShrink: 0 }}
              >
                <div style={{
                  background: "white", borderRadius: 16, border: "1.5px solid var(--border)",
                  padding: "14px 16px", width: 160,
                  display: "flex", flexDirection: "column", gap: 4,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-dark)", lineHeight: 1.3, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 6 }}>
                      {s.name}
                    </div>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                      <path d="M4 7h6M7 4l3 3-3 3" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-dark)" }}>
                    {s.total} turno{s.total !== 1 ? "s" : ""}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {s.revenue > 0 ? formatRevenue(s.revenue) : "Sin ingresos"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Bottom padding cuando no hay drill-downs */}
      {!showStaff && !showServices && <div style={{ height: 100 }} />}
    </div>
  )
}
