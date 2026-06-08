import { useEffect, useState } from "react"
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native"
import { supabase } from "../../lib/supabase"
import { getAppointments, type Appointment } from "../../lib/api"

const TZ = "America/Argentina/Buenos_Aires"

function todayStr() {
  return new Date().toLocaleDateString("en-CA", { timeZone: TZ })
}
function monthStr(offset = 0) {
  const d = new Date()
  d.setMonth(d.getMonth() + offset)
  return d.toLocaleDateString("es-AR", { month: "long", year: "numeric", timeZone: TZ })
}

function computeMetrics(appts: Appointment[]) {
  const now = new Date()
  const today = todayStr()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const prevMonthEnd = monthStart

  const completed = appts.filter(a => a.status === "completed")
  const thisMonth = completed.filter(a => a.startAt >= monthStart)
  const prevMonth = completed.filter(a => a.startAt >= prevMonthStart && a.startAt < prevMonthEnd)

  const revenue = (list: Appointment[]) =>
    list.reduce((sum, a) => sum + (a.priceSnapshot ? Number(a.priceSnapshot) : 0), 0)

  const uniqueClients = new Set(appts.filter(a => a.status !== "cancelled").map(a => a.clientName)).size

  const todayAppts = appts.filter(a => a.startAt.startsWith(today) && a.status !== "cancelled")

  const topServices: Record<string, number> = {}
  completed.forEach(a => { topServices[a.serviceName] = (topServices[a.serviceName] ?? 0) + 1 })
  const topServicesList = Object.entries(topServices)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  return {
    todayCount: todayAppts.length,
    totalCompleted: completed.length,
    thisMonthCount: thisMonth.length,
    prevMonthCount: prevMonth.length,
    thisMonthRevenue: revenue(thisMonth),
    prevMonthRevenue: revenue(prevMonth),
    uniqueClients,
    topServicesList,
    pending: appts.filter(a => a.status === "pending").length,
  }
}

function pct(curr: number, prev: number) {
  if (prev === 0) return null
  const diff = Math.round(((curr - prev) / prev) * 100)
  return diff > 0 ? `+${diff}%` : `${diff}%`
}

export default function MetricasScreen() {
  const [appts, setAppts] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      const data = await getAppointments(session.access_token)
      setAppts(Array.isArray(data) ? data : [])
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#0284C7" /></View>

  const m = computeMetrics(appts)
  const revDiff = pct(m.thisMonthRevenue, m.prevMonthRevenue)
  const countDiff = pct(m.thisMonthCount, m.prevMonthCount)

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.period}>{monthStr(0)}</Text>

      {/* Main stats */}
      <View style={s.row}>
        <MetricCard
          label="Ingresos del mes"
          value={new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(m.thisMonthRevenue)}
          sub={revDiff ? `${revDiff} vs mes anterior` : undefined}
          subColor={m.thisMonthRevenue >= m.prevMonthRevenue ? "#059669" : "#DC2626"}
          accent="#0284C7"
        />
        <MetricCard
          label="Turnos completados"
          value={String(m.thisMonthCount)}
          sub={countDiff ? `${countDiff} vs mes anterior` : undefined}
          subColor={m.thisMonthCount >= m.prevMonthCount ? "#059669" : "#DC2626"}
          accent="#059669"
        />
      </View>

      <View style={s.row}>
        <MetricCard label="Hoy" value={String(m.todayCount)} sub="turnos" accent="#0284C7" />
        <MetricCard label="Pendientes" value={String(m.pending)} sub="de confirmar" accent="#D97706" />
        <MetricCard label="Clientes" value={String(m.uniqueClients)} sub="únicos" accent="#7C3AED" />
      </View>

      {/* Top services */}
      {m.topServicesList.length > 0 && (
        <View style={s.card}>
          <Text style={s.cardTitle}>Servicios más reservados</Text>
          {m.topServicesList.map(([name, count], i) => (
            <View key={name} style={s.serviceRow}>
              <View style={[s.rank, { backgroundColor: i === 0 ? "#FEF3C7" : "#F1F5F9" }]}>
                <Text style={[s.rankText, { color: i === 0 ? "#D97706" : "#64748B" }]}>#{i + 1}</Text>
              </View>
              <Text style={s.serviceName}>{name}</Text>
              <Text style={s.serviceCount}>{count} turnos</Text>
            </View>
          ))}
        </View>
      )}

      {/* Historical */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Histórico</Text>
        <HistRow label="Total completados" value={m.totalCompleted} />
        <HistRow label="Mes anterior" value={m.prevMonthCount} sub={monthStr(-1)} />
        <HistRow label="Este mes" value={m.thisMonthCount} sub={monthStr(0)} />
      </View>
    </ScrollView>
  )
}

function MetricCard({ label, value, sub, subColor, accent }: { label: string; value: string; sub?: string; subColor?: string; accent: string }) {
  return (
    <View style={[s.metricCard, { flex: 1 }]}>
      <Text style={s.metricLabel}>{label}</Text>
      <Text style={[s.metricValue, { color: accent }]}>{value}</Text>
      {sub && <Text style={[s.metricSub, subColor ? { color: subColor } : {}]}>{sub}</Text>}
    </View>
  )
}

function HistRow({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <View style={s.histRow}>
      <View>
        <Text style={s.histLabel}>{label}</Text>
        {sub && <Text style={s.histSub}>{sub}</Text>}
      </View>
      <Text style={s.histValue}>{value}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F0F9FF" },
  container: { flex: 1, backgroundColor: "#F0F9FF" },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  period: { fontSize: 18, fontWeight: "800", color: "#0F172A", marginBottom: 4, textTransform: "capitalize" },
  row: { flexDirection: "row", gap: 10 },
  metricCard: {
    backgroundColor: "#fff", borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: "#E0F0F8",
    shadowColor: "#0284C7", shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  metricLabel: { fontSize: 11, fontWeight: "700", color: "#64748B", textTransform: "uppercase", letterSpacing: 0.5 },
  metricValue: { fontSize: 26, fontWeight: "800", marginTop: 4 },
  metricSub: { fontSize: 11, color: "#64748B", marginTop: 2 },
  card: {
    backgroundColor: "#fff", borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: "#E0F0F8",
  },
  cardTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A", marginBottom: 12 },
  serviceRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: "#F1F5F9" },
  rank: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  rankText: { fontSize: 12, fontWeight: "700" },
  serviceName: { flex: 1, fontSize: 14, color: "#0F172A", fontWeight: "600" },
  serviceCount: { fontSize: 13, color: "#64748B" },
  histRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#F1F5F9" },
  histLabel: { fontSize: 14, color: "#0F172A", fontWeight: "600" },
  histSub: { fontSize: 12, color: "#94A3B8", marginTop: 1 },
  histValue: { fontSize: 18, fontWeight: "800", color: "#0284C7" },
})
