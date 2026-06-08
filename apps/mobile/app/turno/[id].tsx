import { useEffect, useState } from "react"
import {
  ActivityIndicator, Alert, Linking, Pressable,
  ScrollView, StyleSheet, Text, View,
} from "react-native"
import { Stack, useLocalSearchParams, useRouter } from "expo-router"
import { supabase } from "../../lib/supabase"
import { getAppointmentDetail, updateAppointmentStatus } from "../../lib/api"

const TZ = "America/Argentina/Buenos_Aires"
const STATUS_COLOR: Record<string, string> = {
  pending: "#D97706", confirmed: "#0284C7", cancelled: "#DC2626", completed: "#059669",
}
const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente de confirmación", confirmed: "Confirmado",
  cancelled: "Cancelado", completed: "Completado",
}

type ApptDetail = {
  id: string; status: string; startAt: string; endAt: string
  clientName: string; clientPhone: string | null; clientEmail: string | null
  serviceName: string; durationMinutes: number; staffName: string
  priceSnapshot: string | null; paymentProofUrl: string | null
  notes: string | null; cancelReason: string | null
  currencySnapshot?: string | null
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "long", timeZone: TZ })
}
function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: TZ })
}

export default function TurnoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [appt, setAppt] = useState<ApptDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      const data = await getAppointmentDetail(session.access_token, id)
      setAppt(data as unknown as ApptDetail)
    }).finally(() => setLoading(false))
  }, [id])

  async function handleStatus(status: "confirmed" | "cancelled" | "completed") {
    const label = status === "confirmed" ? "Confirmar" : status === "completed" ? "Completar" : "Cancelar"
    Alert.alert(label, `¿Querés ${label.toLowerCase()} este turno?`, [
      { text: "No", style: "cancel" },
      {
        text: label, style: status === "cancelled" ? "destructive" : "default",
        onPress: async () => {
          const { data: { session } } = await supabase.auth.getSession()
          if (!session) return
          await updateAppointmentStatus(session.access_token, id, status)
          setAppt(prev => prev ? { ...prev, status } : prev)
        },
      },
    ])
  }

  function openWhatsApp() {
    if (!appt?.clientPhone) return
    const phone = appt.clientPhone.replace(/\D/g, "")
    Linking.openURL(`https://wa.me/${phone}`)
  }

  function openEmail() {
    if (!appt?.clientEmail) return
    Linking.openURL(`mailto:${appt.clientEmail}`)
  }

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#0284C7" /></View>
  if (!appt) return <View style={s.center}><Text style={s.error}>Turno no encontrado</Text></View>

  const color = STATUS_COLOR[appt.status] ?? "#64748B"
  const price = appt.priceSnapshot
    ? new Intl.NumberFormat("es-AR", { style: "currency", currency: appt.currencySnapshot ?? "ARS", maximumFractionDigits: 0 }).format(Number(appt.priceSnapshot))
    : null

  return (
    <>
      <Stack.Screen options={{ title: "Detalle del turno", headerBackTitle: "Volver" }} />
      <ScrollView style={s.container} contentContainerStyle={s.content}>

        {/* Date header */}
        <View style={s.dateHeader}>
          <View style={s.dateBadge}>
            <Text style={s.dateBadgeDay}>{new Date(appt.startAt).toLocaleDateString("es-AR", { day: "numeric", timeZone: TZ })}</Text>
            <Text style={s.dateBadgeMonth}>{new Date(appt.startAt).toLocaleDateString("es-AR", { month: "short", timeZone: TZ }).toUpperCase()}</Text>
            <Text style={s.dateBadgeYear}>{new Date(appt.startAt).getFullYear()}</Text>
          </View>
          <View style={s.dateInfo}>
            <Text style={s.dateClient}>{appt.clientName}</Text>
            <Text style={s.dateService}>{appt.serviceName}</Text>
            <Text style={s.dateTime}>{fmtTime(appt.startAt)} — {fmtTime(appt.endAt)}</Text>
            <View style={[s.statusBadge, { backgroundColor: color + "22" }]}>
              <Text style={[s.statusText, { color }]}>{STATUS_LABEL[appt.status]}</Text>
            </View>
          </View>
        </View>

        {/* Client */}
        <View style={s.card}>
          <Text style={s.cardTitle}>CLIENTE</Text>
          <Text style={s.cardName}>{appt.clientName}</Text>
          {appt.clientPhone && <Text style={s.cardSub}>{appt.clientPhone}</Text>}
          {appt.clientEmail && <Text style={s.cardSub}>{appt.clientEmail}</Text>}
          <View style={s.contactRow}>
            {appt.clientPhone && (
              <Pressable style={[s.contactBtn, { backgroundColor: "#D1FAE5" }]} onPress={openWhatsApp}>
                <Text style={[s.contactBtnText, { color: "#059669" }]}>💬 WhatsApp</Text>
              </Pressable>
            )}
            {appt.clientEmail && (
              <Pressable style={[s.contactBtn, { backgroundColor: "#EFF6FF" }]} onPress={openEmail}>
                <Text style={[s.contactBtnText, { color: "#0284C7" }]}>✉️ Email</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Price */}
        {price && (
          <View style={s.card}>
            <Text style={s.cardTitle}>PRECIO</Text>
            <Text style={s.priceValue}>{price}</Text>
          </View>
        )}

        {/* Payment proof */}
        <View style={s.card}>
          <Text style={s.cardTitle}>COMPROBANTE DE PAGO</Text>
          {appt.paymentProofUrl
            ? <Text style={[s.cardSub, { color: "#059669" }]}>✓ Comprobante recibido</Text>
            : (
              <>
                <View style={s.noProofBadge}><Text style={s.noProofText}>Sin comprobante</Text></View>
                <Text style={s.cardSub}>El cliente aún no subió el comprobante de pago.</Text>
              </>
            )
          }
        </View>

        {/* Notes */}
        {appt.notes && (
          <View style={s.card}>
            <Text style={s.cardTitle}>NOTAS</Text>
            <Text style={s.cardSub}>{appt.notes}</Text>
          </View>
        )}

        {/* Actions */}
        {appt.status !== "cancelled" && appt.status !== "completed" && (
          <View style={s.actions}>
            {appt.status === "pending" && (
              <Pressable style={[s.actionBtn, { backgroundColor: "#059669" }]} onPress={() => handleStatus("confirmed")}>
                <Text style={s.actionBtnText}>✓ Confirmar</Text>
              </Pressable>
            )}
            {appt.status === "confirmed" && (
              <Pressable style={[s.actionBtn, { backgroundColor: "#0284C7" }]} onPress={() => handleStatus("completed")}>
                <Text style={s.actionBtnText}>Completar</Text>
              </Pressable>
            )}
            <Pressable style={[s.actionBtn, s.cancelBtn]} onPress={() => handleStatus("cancelled")}>
              <Text style={[s.actionBtnText, { color: "#DC2626" }]}>Cancelar</Text>
            </Pressable>
          </View>
        )}

        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backBtnText}>← Volver</Text>
        </Pressable>
      </ScrollView>
    </>
  )
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F0F9FF" },
  error: { fontSize: 15, color: "#DC2626" },
  container: { flex: 1, backgroundColor: "#F0F9FF" },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  dateHeader: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16, flexDirection: "row", gap: 14,
    borderWidth: 1, borderColor: "#E0F0F8",
  },
  dateBadge: {
    width: 56, backgroundColor: "#0284C7", borderRadius: 12, alignItems: "center",
    justifyContent: "center", paddingVertical: 8,
  },
  dateBadgeDay: { fontSize: 22, fontWeight: "800", color: "#fff" },
  dateBadgeMonth: { fontSize: 10, color: "rgba(255,255,255,0.8)", fontWeight: "700" },
  dateBadgeYear: { fontSize: 10, color: "rgba(255,255,255,0.6)" },
  dateInfo: { flex: 1, gap: 2 },
  dateClient: { fontSize: 16, fontWeight: "800", color: "#0F172A" },
  dateService: { fontSize: 13, color: "#64748B" },
  dateTime: { fontSize: 15, fontWeight: "700", color: "#0284C7" },
  statusBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, marginTop: 4 },
  statusText: { fontSize: 11, fontWeight: "700" },
  card: {
    backgroundColor: "#fff", borderRadius: 14, padding: 16, gap: 4,
    borderWidth: 1, borderColor: "#E0F0F8",
  },
  cardTitle: { fontSize: 10, fontWeight: "700", color: "#64748B", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 },
  cardName: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  cardSub: { fontSize: 13, color: "#64748B" },
  contactRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  contactBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  contactBtnText: { fontSize: 14, fontWeight: "700" },
  priceValue: { fontSize: 28, fontWeight: "800", color: "#059669" },
  noProofBadge: { alignSelf: "flex-start", backgroundColor: "#FEF3C7", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, marginBottom: 4 },
  noProofText: { fontSize: 12, fontWeight: "700", color: "#D97706" },
  actions: { gap: 10 },
  actionBtn: { borderRadius: 12, padding: 16, alignItems: "center" },
  actionBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  cancelBtn: { backgroundColor: "#FEE2E2" },
  backBtn: { borderRadius: 12, padding: 14, alignItems: "center", borderWidth: 1, borderColor: "#E0F0F8" },
  backBtnText: { fontSize: 14, color: "#64748B", fontWeight: "600" },
})
