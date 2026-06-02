import Link from "next/link"
import type { AnalyticsPeriod } from "@/lib/actions/analytics"

const PERIODS: { value: AnalyticsPeriod; label: string }[] = [
  { value: "this_week",  label: "Esta semana" },
  { value: "this_month", label: "Este mes" },
  { value: "last_month", label: "Mes anterior" },
  { value: "12_months",  label: "Último año" },
]

function formatRevenue(amount: number) {
  return `$${amount.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export type AnalyticsData = {
  thisMonth:       { total: number; completed: number; cancelled: number; revenue: number }
  prevMonth:       { revenue: number }
  revTrend:        number | null
  topServices:     { name: string; total: number }[]
  clients:         { new: number; returning: number; total: number }
  occupancyRate:   number | null
  cancelRate:      number
  avgTicket:       number
  weeklyBreakdown: { label: string; count: number }[]
  bookedMinutes:   number
  availableMinutes: number
}

export default function AnalyticsContent({
  data,
  period,
  baseHref,
}: {
  data: AnalyticsData
  period: AnalyticsPeriod
  baseHref: string   // ej. "/dashboard/analytics" o "/dashboard/analytics/staff/[id]"
}) {
  const isEmpty = data.thisMonth.total === 0
  const maxWeeklyCount = Math.max(...data.weeklyBreakdown.map(d => d.count), 1)
  const maxServiceCount = data.topServices.length > 0 ? Math.max(...data.topServices.map(s => s.total)) : 1

  return (
    <>
      {/* Period selector */}
      <div style={{ padding: "16px 16px 0" }}>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2, scrollbarWidth: "none" }}>
          {PERIODS.map(p => (
            <Link
              key={p.value}
              href={`${baseHref}?period=${p.value}`}
              style={{
                flexShrink: 0,
                padding: "7px 14px",
                borderRadius: 100,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
                background: period === p.value ? "var(--primary)" : "white",
                color: period === p.value ? "white" : "var(--text-muted)",
                border: `1.5px solid ${period === p.value ? "var(--primary)" : "var(--border)"}`,
              }}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "16px 16px 32px", display: "flex", flexDirection: "column", gap: 16 }}>
        {isEmpty ? (
          <div style={{
            background: "white", borderRadius: 20, border: "1.5px solid var(--border)",
            display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
            padding: "52px 24px",
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-dark)", letterSpacing: "-0.4px", marginBottom: 10 }}>
              Sin datos en este período
            </div>
            <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 280 }}>
              Cuando tus clientes empiecen a reservar, acá vas a ver tus métricas.
            </p>
          </div>
        ) : (
          <>
            {/* ── KPI grid 2×3 ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

              <div style={{ background: "white", borderRadius: 16, border: "1.5px solid var(--border)", padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Ingresos</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: "var(--text-dark)", letterSpacing: "-0.5px", lineHeight: 1.1, marginBottom: 6 }}>
                  {formatRevenue(data.thisMonth.revenue)}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {data.revTrend !== null ? (
                    <span style={{ color: data.revTrend >= 0 ? "var(--accent)" : "var(--error)", fontWeight: 700 }}>
                      {data.revTrend >= 0 ? "↑" : "↓"} {data.revTrend >= 0 ? "+" : ""}{data.revTrend}%
                    </span>
                  ) : <span>—</span>}{" "}vs anterior
                </div>
              </div>

              <div style={{ background: "white", borderRadius: 16, border: "1.5px solid var(--border)", padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Ticket prom.</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: "var(--text-dark)", letterSpacing: "-0.5px", lineHeight: 1.1, marginBottom: 6 }}>
                  {data.avgTicket > 0 ? formatRevenue(data.avgTicket) : "—"}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>por turno completado</div>
              </div>

              <div style={{ background: "white", borderRadius: 16, border: "1.5px solid var(--border)", padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Completados</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: "var(--text-dark)", letterSpacing: "-0.5px", lineHeight: 1.1, marginBottom: 6 }}>
                  {data.thisMonth.completed}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  de {data.thisMonth.total} turno{data.thisMonth.total !== 1 ? "s" : ""} en el período
                </div>
              </div>

              <div style={{ background: "white", borderRadius: 16, border: "1.5px solid var(--border)", padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Cancelaciones</div>
                <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.5px", lineHeight: 1.1, marginBottom: 6,
                  color: data.cancelRate > 20 ? "var(--error)" : data.cancelRate > 10 ? "var(--warning)" : "var(--text-dark)",
                }}>
                  {data.cancelRate}%
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {data.thisMonth.cancelled} turno{data.thisMonth.cancelled !== 1 ? "s" : ""} cancelado{data.thisMonth.cancelled !== 1 ? "s" : ""}
                </div>
              </div>

              <div style={{ background: "white", borderRadius: 16, border: "1.5px solid var(--border)", padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Ocupación</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: "var(--text-dark)", letterSpacing: "-0.5px", lineHeight: 1.1, marginBottom: 6 }}>
                  {data.occupancyRate !== null ? `${data.occupancyRate}%` : "—"}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {data.occupancyRate !== null ? `${data.bookedMinutes}min de ${data.availableMinutes}min` : "Sin disponibilidad"}
                </div>
              </div>

              <div style={{ background: "white", borderRadius: 16, border: "1.5px solid var(--border)", padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Clientes</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: "var(--text-dark)", letterSpacing: "-0.5px", lineHeight: 1.1, marginBottom: 6 }}>
                  {data.clients.total}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  <span style={{ color: "var(--primary)", fontWeight: 700 }}>{data.clients.new} nuevos</span>
                  {" · "}
                  <span style={{ color: "var(--accent)", fontWeight: 700 }}>{data.clients.returning} recurrentes</span>
                </div>
              </div>
            </div>

            {/* ── Actividad semanal ── */}
            {data.weeklyBreakdown.some(d => d.count > 0) && (
              <div style={{ background: "white", borderRadius: 16, border: "1.5px solid var(--border)", padding: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-dark)", letterSpacing: "-0.3px", marginBottom: 20 }}>
                  Actividad semanal
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {data.weeklyBreakdown.map((day, i) => {
                    const barH = Math.max((day.count / maxWeeklyCount) * 72, day.count > 0 ? 6 : 0)
                    const isMax = day.count === maxWeeklyCount && day.count > 0
                    return (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: day.count > 0 ? (isMax ? "var(--primary)" : "var(--text-muted)") : "transparent", height: 18, display: "flex", alignItems: "center" }}>
                          {day.count}
                        </div>
                        <div style={{ height: 72, width: "100%", display: "flex", alignItems: "flex-end", padding: "0 1px" }}>
                          <div style={{ width: "100%", height: barH, background: isMax ? "var(--primary)" : day.count > 0 ? "rgba(2,132,199,0.35)" : "rgba(2,132,199,0.08)", borderRadius: "4px 4px 2px 2px", minHeight: day.count > 0 ? 4 : 6 }} />
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: isMax ? "var(--primary)" : "var(--text-muted)", marginTop: 6 }}>
                          {day.label}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Top servicios ── */}
            {data.topServices.length > 0 && (
              <div style={{ background: "white", borderRadius: 16, border: "1.5px solid var(--border)", padding: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-dark)", letterSpacing: "-0.3px", marginBottom: 16 }}>
                  Top servicios
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {[...data.topServices].reverse().map((service, i) => {
                    const pct = (service.total / maxServiceCount) * 100
                    return (
                      <div key={`${service.name}-${i}`}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-dark)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 12 }}>
                            {service.name}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: "var(--primary)", flexShrink: 0 }}>
                            {service.total}
                          </span>
                        </div>
                        <div style={{ height: 8, borderRadius: 4, background: "rgba(2,132,199,0.12)", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, borderRadius: 4, background: "var(--primary)", transition: "width 0.4s ease" }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Clientes nuevos vs recurrentes ── */}
            {data.clients.total > 0 && (
              <div style={{ background: "white", borderRadius: 16, border: "1.5px solid var(--border)", padding: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-dark)", letterSpacing: "-0.3px", marginBottom: 16 }}>
                  Clientes del período
                </div>
                <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                  <div style={{ flex: 1, background: "rgba(2,132,199,0.07)", borderRadius: 12, padding: "14px 16px" }}>
                    <div style={{ fontSize: 24, fontWeight: 900, color: "#0284C7", letterSpacing: "-0.5px", marginBottom: 2 }}>{data.clients.new}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#0284C7" }}>Nuevos</div>
                  </div>
                  <div style={{ flex: 1, background: "rgba(5,150,105,0.07)", borderRadius: 12, padding: "14px 16px" }}>
                    <div style={{ fontSize: 24, fontWeight: 900, color: "#059669", letterSpacing: "-0.5px", marginBottom: 2 }}>{data.clients.returning}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#059669" }}>Recurrentes</div>
                  </div>
                </div>
                <div style={{ height: 10, borderRadius: 5, overflow: "hidden", display: "flex" }}>
                  {data.clients.new > 0 && <div style={{ flex: data.clients.new, background: "#0284C7" }} />}
                  {data.clients.returning > 0 && <div style={{ flex: data.clients.returning, background: "#059669" }} />}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: "#0284C7", fontWeight: 600 }}>
                    {Math.round((data.clients.new / data.clients.total) * 100)}% nuevos
                  </span>
                  <span style={{ fontSize: 11, color: "#059669", fontWeight: 600 }}>
                    {Math.round((data.clients.returning / data.clients.total) * 100)}% recurrentes
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
