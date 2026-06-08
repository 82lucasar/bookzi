import { useEffect, useMemo, useState } from "react"
import {
  ActivityIndicator, FlatList, StyleSheet, Text, TextInput, View,
} from "react-native"
import { supabase } from "../../lib/supabase"
import { getAppointments, type Appointment } from "../../lib/api"

type ClientSummary = {
  name: string
  phone: string | null
  email: string | null
  total: number
  lastAt: string
  lastService: string
}

function buildClients(appts: Appointment[]): ClientSummary[] {
  const map: Record<string, ClientSummary> = {}
  appts
    .filter(a => a.status !== "cancelled")
    .sort((a, b) => b.startAt.localeCompare(a.startAt))
    .forEach(a => {
      const key = a.clientName.toLowerCase().trim()
      if (!map[key]) {
        map[key] = {
          name: a.clientName,
          phone: a.clientPhone ?? null,
          email: a.clientEmail ?? null,
          total: 0,
          lastAt: a.startAt,
          lastService: a.serviceName,
        }
      }
      map[key].total++
    })
  return Object.values(map).sort((a, b) => b.total - a.total)
}

const TZ = "America/Argentina/Buenos_Aires"
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric", timeZone: TZ })
}

export default function ClientesScreen() {
  const [appts, setAppts] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      const data = await getAppointments(session.access_token)
      setAppts(Array.isArray(data) ? data : [])
    }).finally(() => setLoading(false))
  }, [])

  const clients = useMemo(() => buildClients(appts), [appts])

  const filtered = useMemo(() =>
    search.trim()
      ? clients.filter(c =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          (c.phone ?? "").includes(search) ||
          (c.email ?? "").toLowerCase().includes(search.toLowerCase())
        )
      : clients,
    [clients, search]
  )

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#0284C7" /></View>

  return (
    <View style={{ flex: 1, backgroundColor: "#F0F9FF" }}>
      <View style={s.searchContainer}>
        <TextInput
          style={s.search}
          placeholder="Buscar por nombre, teléfono o email…"
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={c => c.name}
        contentContainerStyle={s.list}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{item.name[0]?.toUpperCase() ?? "?"}</Text>
            </View>
            <View style={s.info}>
              <Text style={s.name}>{item.name}</Text>
              {item.phone && <Text style={s.meta}>{item.phone}</Text>}
              {item.email && <Text style={s.meta}>{item.email}</Text>}
              <Text style={s.last}>Último: {item.lastService} · {fmtDate(item.lastAt)}</Text>
            </View>
            <View style={s.totalBox}>
              <Text style={s.totalNum}>{item.total}</Text>
              <Text style={s.totalLabel}>turnos</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>👥</Text>
            <Text style={s.emptyText}>{search ? "Sin resultados" : "Sin clientes aún"}</Text>
          </View>
        }
      />
    </View>
  )
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F0F9FF" },
  searchContainer: { padding: 16, paddingBottom: 8 },
  search: {
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#E0F0F8",
    borderRadius: 12, padding: 12, fontSize: 14, color: "#0F172A",
  },
  list: { padding: 16, gap: 10, paddingTop: 8, paddingBottom: 32 },
  card: {
    backgroundColor: "#fff", borderRadius: 14, padding: 14,
    flexDirection: "row", alignItems: "center", gap: 12,
    borderWidth: 1, borderColor: "#E0F0F8",
    shadowColor: "#0284C7", shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontSize: 18, fontWeight: "800", color: "#0284C7" },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  meta: { fontSize: 12, color: "#64748B", marginTop: 1 },
  last: { fontSize: 11, color: "#94A3B8", marginTop: 3 },
  totalBox: { alignItems: "center" },
  totalNum: { fontSize: 22, fontWeight: "800", color: "#0284C7" },
  totalLabel: { fontSize: 10, color: "#64748B", fontWeight: "600" },
  empty: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 14, color: "#64748B" },
})
