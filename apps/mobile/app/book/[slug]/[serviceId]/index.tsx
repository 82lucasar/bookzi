import { useEffect, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import { useLocalSearchParams, useRouter, Stack } from "expo-router"
import { getPublicBusiness, getSlots, createPublicAppointment, type ServicePublic } from "../../../../lib/api"

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

function buildDateRange(count = 30): Date[] {
  const dates: Date[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = 0; i < count; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    dates.push(d)
  }
  return dates
}

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export default function BookingScreen() {
  const { slug, serviceId } = useLocalSearchParams<{ slug: string; serviceId: string }>()
  const router = useRouter()

  const [service, setService] = useState<ServicePublic | null>(null)
  const [businessId, setBusinessId] = useState<string>("")
  const [businessName, setBusinessName] = useState<string>("")
  const [loadingBusiness, setLoadingBusiness] = useState(true)

  const dates = buildDateRange(30)
  const [selectedDate, setSelectedDate] = useState<Date>(dates[0])
  const [slots, setSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)

  const [clientName, setClientName] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getPublicBusiness(slug)
      .then(({ business, services }) => {
        setBusinessId(business.id)
        setBusinessName(business.name.trim())
        const svc = services.find(s => s.id === serviceId)
        if (svc) setService(svc)
      })
      .finally(() => setLoadingBusiness(false))
  }, [slug, serviceId])

  useEffect(() => {
    if (!businessId || !serviceId) return
    setLoadingSlots(true)
    setSelectedSlot(null)
    getSlots(businessId, serviceId, toDateStr(selectedDate))
      .then(({ slots }) => setSlots(slots))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false))
  }, [businessId, serviceId, selectedDate])

  async function handleConfirm() {
    if (!selectedSlot) return Alert.alert("Seleccioná un horario")
    if (!clientName.trim()) return Alert.alert("Ingresá tu nombre")
    if (!clientPhone.trim()) return Alert.alert("Ingresá tu teléfono")

    setSubmitting(true)
    try {
      const { appointmentId } = await createPublicAppointment({
        businessId,
        serviceId,
        date: toDateStr(selectedDate),
        time: selectedSlot,
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        clientEmail: clientEmail.trim() || undefined,
      })
      router.replace(`/book/confirmed?id=${appointmentId}`)
    } catch {
      Alert.alert("Error", "No pudimos confirmar tu reserva. Intentá de nuevo.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingBusiness) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0284C7" />
      </View>
    )
  }

  if (!service) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Servicio no encontrado.</Text>
      </View>
    )
  }

  const price = new Intl.NumberFormat("es-AR", {
    style: "currency", currency: service.currency, maximumFractionDigits: 0,
  }).format(Number(service.price))

  return (
    <>
      <Stack.Screen options={{ title: "Elegí tu turno" }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Service summary */}
          <View style={styles.serviceCard}>
            <Text style={styles.serviceName}>{service.name}</Text>
            <Text style={styles.serviceMeta}>{service.durationMinutes} min · {price}</Text>
            <Text style={styles.businessName}>{businessName}</Text>
          </View>

          {/* Date picker */}
          <Text style={styles.sectionLabel}>Seleccioná una fecha</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateRow}>
            {dates.map(d => {
              const isSelected = toDateStr(d) === toDateStr(selectedDate)
              return (
                <Pressable
                  key={toDateStr(d)}
                  style={[styles.dateChip, isSelected && styles.dateChipSelected]}
                  onPress={() => setSelectedDate(d)}
                >
                  <Text style={[styles.dateDay, isSelected && styles.dateTextSelected]}>
                    {DAYS[d.getDay()]}
                  </Text>
                  <Text style={[styles.dateNum, isSelected && styles.dateTextSelected]}>
                    {d.getDate()}
                  </Text>
                  <Text style={[styles.dateMon, isSelected && styles.dateTextSelected]}>
                    {MONTHS[d.getMonth()]}
                  </Text>
                </Pressable>
              )
            })}
          </ScrollView>

          {/* Slot picker */}
          <Text style={styles.sectionLabel}>Seleccioná un horario</Text>
          {loadingSlots ? (
            <ActivityIndicator color="#0284C7" style={{ marginVertical: 16 }} />
          ) : slots.length === 0 ? (
            <Text style={styles.noSlots}>Sin turnos disponibles para esta fecha.</Text>
          ) : (
            <View style={styles.slotsGrid}>
              {slots.map(slot => {
                const isSelected = slot === selectedSlot
                return (
                  <Pressable
                    key={slot}
                    style={[styles.slotChip, isSelected && styles.slotChipSelected]}
                    onPress={() => setSelectedSlot(slot)}
                  >
                    <Text style={[styles.slotText, isSelected && styles.slotTextSelected]}>
                      {slot}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          )}

          {/* Client form */}
          <Text style={styles.sectionLabel}>Tus datos</Text>
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Nombre y apellido *"
              placeholderTextColor="#94A3B8"
              value={clientName}
              onChangeText={setClientName}
              autoCapitalize="words"
            />
            <TextInput
              style={styles.input}
              placeholder="Teléfono *"
              placeholderTextColor="#94A3B8"
              value={clientPhone}
              onChangeText={setClientPhone}
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.input}
              placeholder="Email (opcional)"
              placeholderTextColor="#94A3B8"
              value={clientEmail}
              onChangeText={setClientEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <Pressable
            style={[styles.btn, (!selectedSlot || submitting) && styles.btnDisabled]}
            onPress={handleConfirm}
            disabled={!selectedSlot || submitting}
          >
            {submitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Confirmar turno</Text>
            }
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F0F9FF" },
  errorText: { fontSize: 15, color: "#DC2626", textAlign: "center", padding: 24 },
  scroll: { padding: 16, gap: 8, paddingBottom: 48 },
  serviceCard: {
    backgroundColor: "#fff", borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: "#E0F0F8", marginBottom: 8,
  },
  serviceName: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  serviceMeta: { fontSize: 14, color: "#0284C7", fontWeight: "600", marginTop: 4 },
  businessName: { fontSize: 13, color: "#64748B", marginTop: 2 },
  sectionLabel: {
    fontSize: 13, fontWeight: "700", color: "#64748B",
    textTransform: "uppercase", letterSpacing: 0.8, marginTop: 16, marginBottom: 8,
  },
  dateRow: { marginHorizontal: -16, paddingHorizontal: 16 },
  dateChip: {
    alignItems: "center", paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 12, borderWidth: 1, borderColor: "#E0F0F8",
    backgroundColor: "#fff", marginRight: 8,
  },
  dateChipSelected: { backgroundColor: "#0284C7", borderColor: "#0284C7" },
  dateDay: { fontSize: 11, fontWeight: "600", color: "#64748B" },
  dateNum: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  dateMon: { fontSize: 11, color: "#64748B" },
  dateTextSelected: { color: "#fff" },
  noSlots: { fontSize: 14, color: "#64748B", textAlign: "center", marginVertical: 16 },
  slotsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  slotChip: {
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10,
    borderWidth: 1, borderColor: "#E0F0F8", backgroundColor: "#fff",
  },
  slotChipSelected: { backgroundColor: "#0284C7", borderColor: "#0284C7" },
  slotText: { fontSize: 15, fontWeight: "600", color: "#0F172A" },
  slotTextSelected: { color: "#fff" },
  form: { gap: 10, marginTop: 4 },
  input: {
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#E0F0F8",
    borderRadius: 12, padding: 14, fontSize: 15, color: "#0F172A",
  },
  btn: {
    backgroundColor: "#0284C7", borderRadius: 14, padding: 16,
    alignItems: "center", marginTop: 24,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
})
