import { useCallback, useEffect, useState } from "react"
import {
  ActivityIndicator, FlatList, Pressable,
  RefreshControl, ScrollView, StyleSheet, Text, View,
} from "react-native"
import { useRouter } from "expo-router"
import { supabase } from "../../lib/supabase"
import { getAppointments, updateAppointmentStatus, type Appointment } from "../../lib/api"

const TZ = "America/Argentina/Buenos_Aires"
const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

const STATUS_COLOR: Record<string, string> = {
  pending: "#D97706", confirmed: "#0284C7", cancelled: "#DC2626", completed: "#059669",
}
const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente", confirmed: "Confirmado", cancelled: "Cancelado", completed: "Completado",
}

function toDateStr(d: Date) {
  return d.toLocaleDateString("en-CA", { timeZone: TZ })
}
function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: TZ })
}

function buildWeek(anchor: Date): Date[] {
  const dow = anchor.getDay()
  const monday = new Date(anchor)
  monday.setDate(anchor.getDate() - ((dow + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

export default function AgendaScreen() {
  const router = useRouter()
  const [all, setAll] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [anchor, setAnchor] = useState(new Date())
  const [selected, setSelected] = useState(new Date())

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const data = await getAppointments(session.access_token)
    setAll(Array.isArray(data) ? data : [])
  }, [])

  useEffect(() => { load().finally(() => setLoading(false)) }, [load])

  async function onRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  async function changeStatus(id: string, status: "confirmed" | "cancelled" | "completed") {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await updateAppointmentStatus(session.access_token, id, status)
    setAll(prev => prev.map(a => a.id === id ? { ...a, status } : a))
  }

  const week = buildWeek(anchor)
  const selStr = toDateStr(selected)
  const dayAppts = all
    .filter(a => a.startAt.startsWith(selStr) && a.status !== "cancelled")
    .sort((a, b) => a.startAt.localeCompare(b.startAt))

  // Count per day for dots
  const countByDay: Record<string, number> = {}
  all.filter(a => a.status !== "cancelled").forEach(a => {
    const d = a.startAt.slice(0, 10)
    countByDay[d] = (countByDay[d] ?? 0) + 1
  })

  function prevWeek() {
    const d = new Date(anchor)
    d.setDate(d.getDate() - 7)
    setAnchor(d)
  }
  function nextWeek() {
    const d = new Date(anchor)
    d.setDate(d.getDate() + 7)
    setAnchor(d)
  }

  const monthLabel = `${MONTH_LABELS[anchor.getMonth()]} ${anchor.getFullYear()}`
  const selLabel = selected.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", timeZone: TZ })

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#0284C7" /></View>

  return (
    <View style={{ flex: 1, backgroundColor: "#F0F9FF" }}>
      {/* FAB */}
      <Pressable style={s.fab} onPress={() => router.push("/nuevo-turno")}>
        <Text style={s.fabText}>+</Text>
      </Pressable>

      {/* Week header */}
      <View style={s.weekHeader}>
        <Pressable onPress={prevWeek} style={s.navBtn}><Text style={s.navText}>‹</Text></Pressable>
        <Text style={s.monthLabel}>{monthLabel}</Text>
        <Pressable onPress={nextWeek} style={s.navBtn}><Text style={s.navText}>›</Text></Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.dayRow}>
        {week.map(d => {
          const dStr = toDateStr(d)
          const isSel = dStr === selStr
          const isToday = dStr === toDateStr(new Date())
          const count = countByDay[dStr] ?? 0
          return (
            <Pressable key={dStr} style={[s.dayChip, isSel && s.dayChipSel]} onPress={() => setSelected(d)}>
              <Text style={[s.dayName, isSel && s.dayTextSel]}>{DAY_LABELS[d.getDay()]}</Text>
              <Text style={[s.dayNum, isSel && s.dayTextSel, isToday && !isSel && s.today]}>{d.getDate()}</Text>
              {count > 0
                ? <View style={[s.dot, isSel && s.dotSel]} />
                : <View style={s.dotEmpty} />
              }
            </Pressable>
          )
        })}
      </ScrollView>

      {/* Day title */}
      <Text style={s.dayTitle}>{selLabel.charAt(0).toUpperCase() + selLabel.slice(1)}</Text>

      {/* Appointments */}
      <FlatList
        data={dayAppts}
        keyExtractor={a => a.id}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0284C7" />}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={[s.statusBar, { backgroundColor: STATUS_COLOR[item.status] }]} />
            <View style={s.cardContent}>
              <View style={s.cardTop}>
                <Text style={s.timeText}>{fmtTime(item.startAt)} — {fmtTime(item.endAt)}</Text>
                <View style={[s.badge, { backgroundColor: STATUS_COLOR[item.status] + "22" }]}>
                  <Text style={[s.badgeText, { color: STATUS_COLOR[item.status] }]}>{STATUS_LABEL[item.status]}</Text>
                </View>
              </View>
              <Text style={s.clientName}>{item.clientName}</Text>
              <Text style={s.serviceName}>{item.serviceName}</Text>
              {item.clientPhone && <Text style={s.phone}>{item.clientPhone}</Text>}
              {(item.status === "pending" || item.status === "confirmed") && (
                <View style={s.actions}>
                  {item.status === "pending" && (
                    <Pressable style={[s.btn, { backgroundColor: "#D1FAE5" }]} onPress={() => changeStatus(item.id, "confirmed")}>
                      <Text style={[s.btnText, { color: "#059669" }]}>Confirmar</Text>
                    </Pressable>
                  )}
                  {item.status === "confirmed" && (
                    <Pressable style={[s.btn, { backgroundColor: "#DBEAFE" }]} onPress={() => changeStatus(item.id, "completed")}>
                      <Text style={[s.btnText, { color: "#1D4ED8" }]}>Completar</Text>
                    </Pressable>
                  )}
                  <Pressable style={[s.btn, { backgroundColor: "#FEE2E2" }]} onPress={() => changeStatus(item.id, "cancelled")}>
                    <Text style={[s.btnText, { color: "#DC2626" }]}>Cancelar</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>📭</Text>
            <Text style={s.emptyText}>Sin turnos para este día</Text>
          </View>
        }
      />
    </View>
  )
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F0F9FF" },
  weekHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  navBtn: { padding: 8 },
  navText: { fontSize: 24, color: "#0284C7", fontWeight: "700" },
  monthLabel: { fontSize: 16, fontWeight: "800", color: "#0F172A", textTransform: "capitalize" },
  dayRow: { paddingHorizontal: 12, paddingBottom: 8, gap: 4 },
  dayChip: {
    width: 44, alignItems: "center", paddingVertical: 8, borderRadius: 12,
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#E0F0F8",
  },
  dayChipSel: { backgroundColor: "#0284C7", borderColor: "#0284C7" },
  dayName: { fontSize: 10, fontWeight: "700", color: "#64748B" },
  dayNum: { fontSize: 18, fontWeight: "800", color: "#0F172A", marginVertical: 2 },
  dayTextSel: { color: "#fff" },
  today: { color: "#0284C7" },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff" },
  dotSel: { backgroundColor: "#fff" },
  dotEmpty: { width: 6, height: 6 },
  dayTitle: { fontSize: 14, fontWeight: "700", color: "#64748B", paddingHorizontal: 16, paddingBottom: 8, textTransform: "capitalize" },
  list: { padding: 16, gap: 10, paddingBottom: 80 },
  card: {
    backgroundColor: "#fff", borderRadius: 14, flexDirection: "row", overflow: "hidden",
    borderWidth: 1, borderColor: "#E0F0F8",
    shadowColor: "#0284C7", shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  statusBar: { width: 4 },
  cardContent: { flex: 1, padding: 14, gap: 3 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  timeText: { fontSize: 13, fontWeight: "700", color: "#0284C7" },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 },
  badgeText: { fontSize: 10, fontWeight: "700" },
  clientName: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  serviceName: { fontSize: 13, color: "#64748B" },
  phone: { fontSize: 12, color: "#94A3B8" },
  actions: { flexDirection: "row", gap: 8, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#F1F5F9" },
  btn: { flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: "center" },
  btnText: { fontSize: 12, fontWeight: "700" },
  empty: { alignItems: "center", paddingTop: 48, gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 14, color: "#64748B" },
  fab: {
    position: "absolute", bottom: 24, right: 20, zIndex: 10,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: "#0284C7", alignItems: "center", justifyContent: "center",
    shadowColor: "#0284C7", shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  fabText: { fontSize: 28, color: "#fff", fontWeight: "800", lineHeight: 32 },
})
