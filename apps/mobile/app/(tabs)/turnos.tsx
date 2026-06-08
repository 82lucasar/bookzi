import { useCallback, useEffect, useState } from "react"
import {
  ActivityIndicator, FlatList, Pressable,
  RefreshControl, StyleSheet, Text, View,
} from "react-native"
import { useRouter } from "expo-router"
import { supabase } from "../../lib/supabase"
import { getAppointments, updateAppointmentStatus, type Appointment } from "../../lib/api"

const TZ = "America/Argentina/Buenos_Aires"
const STATUS_COLOR: Record<string, string> = {
  pending: "#D97706", confirmed: "#059669", cancelled: "#DC2626", completed: "#64748B",
}
const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente", confirmed: "Confirmado", cancelled: "Cancelado", completed: "Completado",
}
const FILTERS = ["Todos", "Pendiente", "Confirmado", "Completado", "Cancelado"] as const
const FILTER_MAP: Record<string, string | undefined> = {
  "Todos": undefined, "Pendiente": "pending", "Confirmado": "confirmed",
  "Completado": "completed", "Cancelado": "cancelled",
}

function fmtDateTime(d: string) {
  const date = new Date(d)
  return {
    date: date.toLocaleDateString("es-AR", { day: "numeric", month: "short", timeZone: TZ }),
    time: date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: TZ }),
  }
}

export default function TurnosScreen() {
  const router = useRouter()
  const [all, setAll] = useState<Appointment[]>([])
  const [filter, setFilter] = useState<typeof FILTERS[number]>("Todos")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

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

  const filtered = all.filter(a => {
    const mapped = FILTER_MAP[filter]
    return mapped ? a.status === mapped : true
  })

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#0284C7" /></View>

  return (
    <View style={{ flex: 1 }}>
      {/* FAB */}
      <Pressable style={s.fab} onPress={() => router.push("/nuevo-turno")}>
        <Text style={s.fabText}>+</Text>
      </Pressable>
      {/* Filter chips */}
      <FlatList
        data={FILTERS as unknown as string[]}
        horizontal
        keyExtractor={i => i}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.chips}
        renderItem={({ item }) => (
          <Pressable
            style={[s.chip, filter === item && s.chipActive]}
            onPress={() => setFilter(item as typeof FILTERS[number])}
          >
            <Text style={[s.chipText, filter === item && s.chipTextActive]}>{item}</Text>
          </Pressable>
        )}
      />

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={a => a.id}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0284C7" />}
        renderItem={({ item }) => {
          const { date, time } = fmtDateTime(item.startAt)
          return (
            <Pressable style={s.card} onPress={() => router.push(`/turno/${item.id}`)}>
              <View style={s.cardRow}>
                <View style={s.info}>
                  <Text style={s.clientName}>{item.clientName}</Text>
                  <Text style={s.meta}>{date} · {time} · {item.serviceName}</Text>
                  {item.clientPhone && <Text style={s.phone}>{item.clientPhone}</Text>}
                </View>
                <View style={[s.badge, { backgroundColor: STATUS_COLOR[item.status] + "22" }]}>
                  <Text style={[s.badgeText, { color: STATUS_COLOR[item.status] }]}>
                    {STATUS_LABEL[item.status]}
                  </Text>
                </View>
              </View>
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
            </Pressable>
          )
        }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>📋</Text>
            <Text style={s.emptyText}>No hay turnos{filter !== "Todos" ? ` ${filter.toLowerCase()}s` : ""}</Text>
          </View>
        }
      />
    </View>
  )
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F0F9FF" },
  chips: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 100,
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#E0F0F8",
  },
  chipActive: { backgroundColor: "#0284C7", borderColor: "#0284C7" },
  chipText: { fontSize: 13, fontWeight: "600", color: "#64748B" },
  chipTextActive: { color: "#fff" },
  list: { padding: 16, gap: 10, paddingBottom: 32 },
  card: {
    backgroundColor: "#fff", borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: "#E0F0F8",
    shadowColor: "#0284C7", shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  cardRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  info: { flex: 1 },
  clientName: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  meta: { fontSize: 13, color: "#64748B", marginTop: 2 },
  phone: { fontSize: 12, color: "#94A3B8", marginTop: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 100, alignSelf: "flex-start" },
  badgeText: { fontSize: 11, fontWeight: "700" },
  actions: { flexDirection: "row", gap: 8, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#F1F5F9" },
  btn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  btnText: { fontSize: 13, fontWeight: "700" },
  empty: { alignItems: "center", paddingTop: 60, gap: 8 },
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
