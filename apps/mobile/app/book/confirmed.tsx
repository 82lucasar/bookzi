import { useEffect, useState } from "react"
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native"
import { useLocalSearchParams, useRouter, Stack } from "expo-router"
import { getPublicAppointment, type AppointmentPublic } from "../../lib/api"

const TZ = "America/Argentina/Buenos_Aires"

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("es-AR", {
    weekday: "long", day: "numeric", month: "long", timeZone: TZ,
  })
}

function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString("es-AR", {
    hour: "2-digit", minute: "2-digit", timeZone: TZ,
  })
}

export default function ConfirmedScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [appt, setAppt] = useState<AppointmentPublic | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    getPublicAppointment(id)
      .then(appt => setAppt(appt))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0284C7" />
      </View>
    )
  }

  return (
    <>
      <Stack.Screen options={{ title: "Reserva confirmada", headerBackVisible: false }} />
      <View style={styles.container}>
        <View style={styles.checkCircle}>
          <Text style={styles.checkIcon}>✓</Text>
        </View>

        <Text style={styles.title}>¡Reserva recibida!</Text>
        <Text style={styles.subtitle}>
          Tu solicitud fue enviada. El profesional la confirmará en breve.
        </Text>

        {appt && (
          <View style={styles.card}>
            <Row label="Negocio" value={appt.businessName} />
            <Row label="Servicio" value={appt.serviceName} />
            <Row label="Fecha" value={fmtDate(appt.startAt)} />
            <Row label="Horario" value={`${fmtTime(appt.startAt)} hs`} />
            {appt.priceSnapshot && (
              <Row label="Monto" value={
                new Intl.NumberFormat("es-AR", {
                  style: "currency", currency: "ARS", maximumFractionDigits: 0,
                }).format(Number(appt.priceSnapshot))
              } />
            )}
            <Row label="Estado" value="Pendiente de confirmación" accent />
          </View>
        )}

        <Pressable style={styles.btn} onPress={() => router.replace("/")}>
          <Text style={styles.btnText}>Volver al inicio</Text>
        </Pressable>
      </View>
    </>
  )
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, accent && styles.rowAccent]}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F0F9FF" },
  container: { flex: 1, backgroundColor: "#F0F9FF", padding: 24, alignItems: "center" },
  checkCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "#059669", alignItems: "center", justifyContent: "center",
    marginTop: 32, marginBottom: 20,
  },
  checkIcon: { fontSize: 40, color: "#fff", fontWeight: "800" },
  title: { fontSize: 24, fontWeight: "800", color: "#0F172A", textAlign: "center" },
  subtitle: {
    fontSize: 14, color: "#64748B", textAlign: "center",
    lineHeight: 20, marginTop: 8, marginBottom: 24,
  },
  card: {
    backgroundColor: "#fff", borderRadius: 16, padding: 20,
    width: "100%", borderWidth: 1, borderColor: "#E0F0F8",
    shadowColor: "#0284C7", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    gap: 14,
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowLabel: { fontSize: 13, color: "#64748B", fontWeight: "600" },
  rowValue: { fontSize: 14, color: "#0F172A", fontWeight: "700", textAlign: "right", flex: 1, marginLeft: 12 },
  rowAccent: { color: "#D97706" },
  btn: {
    backgroundColor: "#0284C7", borderRadius: 14, paddingVertical: 16,
    paddingHorizontal: 32, marginTop: 28,
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
})
