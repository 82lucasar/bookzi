import { useCallback, useEffect, useState } from "react"
import {
  ActivityIndicator, FlatList, Pressable,
  RefreshControl, StyleSheet, Text, View,
} from "react-native"
import { useRouter } from "expo-router"
import { supabase } from "../../lib/supabase"
import { getAppointments, updateAppointmentStatus, getMyBusiness, type Appointment, type Business } from "../../lib/api"

const TZ = "America/Argentina/Buenos_Aires"

const STATUS_COLOR: Record<string, string> = {
  pending: "#D97706",
  confirmed: "#059669",
  cancelled: "#DC2626",
  completed: "#64748B",
}
const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
  completed: "Completado",
}

function todayStr() {
  return new Date().toLocaleDateString("en-CA", { timeZone: TZ })
}
function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: TZ })
}
function fmtDateShort(d: string) {
  const date = new Date(d)
  return {
    day: date.toLocaleDateString("es-AR", { day: "numeric", timeZone: TZ }),
    month: date.toLocaleDateString("es-AR", { month: "short", timeZone: TZ }).toUpperCase(),
  }
}

export default function AgendaScreen() {
  const router = useRouter()
  const [business, setBusiness] = useState<Business | null>(null)
  const [all, setAll] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const [business, appointments] = await Promise.all([
      getMyBusiness(session.access_token),
      getAppointments(session.access_token),
    ])
    setBusiness(business)
    setAll(Array.isArray(appointments) ? appointments : [])
  }, [])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

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

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#0284C7" /></View>
  }

  const today = todayStr()
  const todayAppts = all.filter(a => a.startAt.startsWith(today) && a.status !== "cancelled")
  const pending = all.filter(a => a.status === "pending")
  const upcoming = all.filter(a => a.status === "confirmed" && a.startAt > new Date().toISOString())

  const greeting = new Date().toLocaleTimeString("es-AR", { hour: "2-digit", timeZone: TZ })
  const hour = parseInt(greeting)
  const greetWord = hour < 13 ? "Buenos días" : hour < 20 ? "Buenas tardes" : "Buenas noches"

  return (
    <View style={{ flex: 1 }}>
    <Pressable style={styles.fab} onPress={() => router.push("/nuevo-turno")}>
      <Text style={styles.fabText}>+</Text>
    </Pressable>
    <FlatList
      data={[]}
      keyExtractor={() => ""}
      renderItem={null}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0284C7" />}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <>
          {/* Hero */}
          <View style={styles.hero}>
            <Text style={styles.heroGreeting}>{greetWord}, {business?.name?.trim() ?? ""}</Text>
            <Text style={styles.heroTitle}>
              {todayAppts.length === 0 ? "Sin turnos hoy" : `${todayAppts.length} turno${todayAppts.length > 1 ? "s" : ""} hoy`}
            </Text>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <StatCard label="HOY" value={todayAppts.length} color="#0284C7" />
            <StatCard label="PENDIENTES" value={pending.length} color="#D97706" />
            <StatCard label="PRÓXIMOS" value={upcoming.length} color="#059669" />
          </View>

          {/* Pending */}
          {pending.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Pendientes de confirmación</Text>
                <Text style={styles.sectionBadge}>{pending.length}</Text>
              </View>
              {pending.map(appt => (
                <ApptCard key={appt.id} appt={appt} onStatusChange={changeStatus} />
              ))}
            </>
          )}

          {/* Today */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Agenda de hoy</Text>
          </View>
          {todayAppts.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>No tenés turnos para hoy</Text>
            </View>
          ) : (
            todayAppts.map(appt => (
              <ApptCard key={appt.id} appt={appt} onStatusChange={changeStatus} />
            ))
          )}
        </>
      }
    />
    </View>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

function ApptCard({ appt, onStatusChange }: { appt: Appointment; onStatusChange: (id: string, s: "confirmed" | "cancelled" | "completed") => void }) {
  const { day, month } = fmtDateShort(appt.startAt)
  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={styles.dateBox}>
          <Text style={styles.dateDay}>{day}</Text>
          <Text style={styles.dateMonth}>{month}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.clientName}>{appt.clientName}</Text>
          <Text style={styles.serviceInfo}>{fmtTime(appt.startAt)} · {appt.serviceName}</Text>
          {appt.clientPhone && <Text style={styles.phone}>{appt.clientPhone}</Text>}
        </View>
        <View style={[styles.badge, { backgroundColor: STATUS_COLOR[appt.status] + "22" }]}>
          <Text style={[styles.badgeText, { color: STATUS_COLOR[appt.status] }]}>
            {STATUS_LABEL[appt.status]}
          </Text>
        </View>
      </View>

      {(appt.status === "pending" || appt.status === "confirmed") && (
        <View style={styles.actions}>
          {appt.status === "pending" && (
            <Pressable style={[styles.actionBtn, { backgroundColor: "#D1FAE5" }]} onPress={() => onStatusChange(appt.id, "confirmed")}>
              <Text style={[styles.actionText, { color: "#059669" }]}>Confirmar</Text>
            </Pressable>
          )}
          {appt.status === "confirmed" && (
            <Pressable style={[styles.actionBtn, { backgroundColor: "#DBEAFE" }]} onPress={() => onStatusChange(appt.id, "completed")}>
              <Text style={[styles.actionText, { color: "#1D4ED8" }]}>Completar</Text>
            </Pressable>
          )}
          <Pressable style={[styles.actionBtn, { backgroundColor: "#FEE2E2" }]} onPress={() => onStatusChange(appt.id, "cancelled")}>
            <Text style={[styles.actionText, { color: "#DC2626" }]}>Cancelar</Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F0F9FF" },
  list: { padding: 16, gap: 10, paddingBottom: 32 },
  hero: {
    backgroundColor: "#0284C7", borderRadius: 16, padding: 24, marginBottom: 4,
  },
  heroGreeting: { fontSize: 14, color: "rgba(255,255,255,0.8)", fontWeight: "600" },
  heroTitle: { fontSize: 26, fontWeight: "800", color: "#fff", marginTop: 4 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 4 },
  statCard: {
    flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 14,
    alignItems: "center", borderWidth: 1, borderColor: "#E0F0F8",
  },
  statValue: { fontSize: 28, fontWeight: "800" },
  statLabel: { fontSize: 10, fontWeight: "700", color: "#64748B", letterSpacing: 0.5, marginTop: 2 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8, marginBottom: 4 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  sectionBadge: {
    backgroundColor: "#FEF3C7", color: "#D97706", fontSize: 12, fontWeight: "700",
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 100,
  },
  card: {
    backgroundColor: "#fff", borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: "#E0F0F8",
    shadowColor: "#0284C7", shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  cardRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  dateBox: {
    width: 44, height: 44, backgroundColor: "#EFF6FF", borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  dateDay: { fontSize: 16, fontWeight: "800", color: "#0284C7" },
  dateMonth: { fontSize: 9, fontWeight: "700", color: "#0284C7" },
  cardInfo: { flex: 1 },
  clientName: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  serviceInfo: { fontSize: 13, color: "#64748B", marginTop: 2 },
  phone: { fontSize: 12, color: "#94A3B8", marginTop: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 100, alignSelf: "flex-start" },
  badgeText: { fontSize: 11, fontWeight: "700" },
  actions: { flexDirection: "row", gap: 8, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#F1F5F9" },
  actionBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  actionText: { fontSize: 13, fontWeight: "700" },
  empty: { alignItems: "center", paddingVertical: 32, gap: 8 },
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
