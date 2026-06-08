import { useEffect, useState } from "react"
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Linking, Platform,
  Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View,
} from "react-native"
import { Stack, useRouter } from "expo-router"
import { supabase } from "../lib/supabase"
import { getServices, getSlots, getMyBusiness, getAppointments, createAppointment, type Service } from "../lib/api"

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
const MONTHS_LONG = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]
const TZ = "America/Argentina/Buenos_Aires"

function buildDates(n = 30): Date[] {
  const today = new Date(); today.setHours(0,0,0,0)
  return Array.from({ length: n }, (_, i) => { const d = new Date(today); d.setDate(today.getDate()+i); return d })
}
function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`
}
function fmtDateLong(d: Date) {
  return `${DAYS[d.getDay()]} ${d.getDate()} de ${MONTHS_LONG[d.getMonth()]}`
}

type Step = 1 | 2 | 3

export default function NuevoTurnoScreen() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [services, setServices] = useState<Service[]>([])
  const [businessId, setBusinessId] = useState("")
  const [loading, setLoading] = useState(true)
  const dates = buildDates(30)

  // Step 1
  const [clientName, setClientName] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [notes, setNotes] = useState("")

  // Step 2
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(dates[0])
  const [slots, setSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)

  // Step 3
  const [sendWhatsApp, setSendWhatsApp] = useState(false)
  const [sendEmail, setSendEmail] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [created, setCreated] = useState<{ id: string } | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      const [svcs, biz] = await Promise.all([getServices(session.access_token), getMyBusiness(session.access_token)])
      setServices(Array.isArray(svcs) ? svcs.filter(s => s.isActive) : [])
      setBusinessId(biz.id)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedService || !businessId) return
    setLoadingSlots(true)
    setSelectedSlot(null)
    const dateStr = toDateStr(selectedDate)
    const svc = selectedService

    async function loadSlots() {
      const [{ slots: rawSlots }, session] = await Promise.all([
        getSlots(businessId, svc.id, dateStr),
        supabase.auth.getSession().then(r => r.data.session),
      ])
      const appts = session
        ? await getAppointments(session.access_token, { date: dateStr }).catch(() => [] as any[])
        : []
      const existing = Array.isArray(appts) ? appts.filter((a: any) => a.status !== "cancelled") : []
      const filtered = rawSlots.filter(slot => {
        const [h, m] = slot.split(":").map(Number)
        const slotStart = new Date(`${dateStr}T${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:00-03:00`).getTime()
        const slotEnd = slotStart + svc.durationMinutes * 60000
        return !existing.some((a: any) => {
          const aStart = new Date(a.startAt).getTime()
          const aEnd = new Date(a.endAt).getTime()
          // Mismo criterio que el backend deployado: overlap estricto
          return aStart < slotEnd && aEnd > slotStart
        })
      })
      setSlots(filtered)
    }
    loadSlots().catch(() => setSlots([])).finally(() => setLoadingSlots(false))
  }, [selectedService, selectedDate, businessId])

  function goStep1to2() {
    if (!clientName.trim()) return Alert.alert("Ingresá el nombre del cliente")
    if (!clientPhone.trim()) return Alert.alert("Ingresá el teléfono del cliente")
    if (!selectedService) return Alert.alert("Seleccioná un servicio")
    setStep(2)
  }

  function goStep2to3() {
    if (!selectedSlot) return Alert.alert("Seleccioná un horario")
    setStep(3)
  }

  async function handleConfirm() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session || !selectedService || !selectedSlot) return
    setSubmitting(true)
    try {
      // Reload slots to verify availability
      const { slots: fresh } = await getSlots(businessId, selectedService.id, toDateStr(selectedDate))
      if (!fresh.includes(selectedSlot)) {
        setSlots(fresh); setSelectedSlot(null); setStep(2)
        Alert.alert("Horario ocupado", "Ese horario ya no está disponible. Elegí otro.")
        return
      }
      const appt = await createAppointment(session.access_token, {
        serviceId: selectedService.id,
        date: toDateStr(selectedDate),
        time: selectedSlot,
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        clientEmail: clientEmail.trim() || undefined,
        notes: notes.trim() || undefined,
        sendNotification: sendEmail,
      })
      setCreated({ id: appt.id })
      if (sendWhatsApp && clientPhone.trim()) {
        const msg = encodeURIComponent(`¡Hola ${clientName}! Tu turno en ${selectedService.name} quedó confirmado para el ${fmtDateLong(selectedDate)} a las ${selectedSlot} hs.`)
        const phone = clientPhone.replace(/\D/g, "")
        Linking.openURL(`https://wa.me/${phone}?text=${msg}`)
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "No se pudo crear el turno.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#0284C7" /></View>

  // ── SUCCESS ──────────────────────────────────────────────────────────────
  if (created) {
    return (
      <>
        <Stack.Screen options={{ title: "Turno creado", headerBackVisible: false }} />
        <View style={s.successContainer}>
          <View style={s.successIcon}><Text style={s.successCheck}>✓</Text></View>
          <Text style={s.successTitle}>¡Turno creado!</Text>
          <Text style={s.successSub}>
            El turno para <Text style={{ fontWeight: "800" }}>{clientName}</Text> quedó como{" "}
            <Text style={{ color: "#059669", fontWeight: "700" }}>confirmado</Text>.
          </Text>
          <View style={s.successCard}>
            <SRow label="Cliente" value={clientName} />
            <SRow label="Servicio" value={`${selectedService?.name} · ${selectedService?.durationMinutes} min`} />
            <SRow label="Fecha" value={`${fmtDateLong(selectedDate)} · ${selectedSlot}`} />
          </View>
          <Pressable style={s.btnPrimary} onPress={() => router.replace(`/turno/${created.id}`)}>
            <Text style={s.btnPrimaryText}>Ver y confirmar turno →</Text>
          </Pressable>
          <Pressable style={s.btnSecondary} onPress={() => router.replace("/(tabs)")}>
            <Text style={s.btnSecondaryText}>Volver al inicio</Text>
          </Pressable>
        </View>
      </>
    )
  }

  const stepLabels = ["1. Cliente", "2. Fecha y hora", "3. Confirmar"]

  return (
    <>
      <Stack.Screen options={{ title: "Nueva reserva", headerBackTitle: "Volver" }} />

      {/* Step indicator */}
      <View style={s.steps}>
        {stepLabels.map((label, i) => (
          <View key={label} style={s.stepItem}>
            <Text style={[s.stepLabel, step === i + 1 && s.stepLabelActive]}>{label}</Text>
            {step === i + 1 && <View style={s.stepLine} />}
          </View>
        ))}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          {/* ── STEP 1: Cliente ── */}
          {step === 1 && (
            <>
              <Text style={s.sectionLabel}>Servicio</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.hScroll}>
                {services.map(svc => (
                  <Pressable key={svc.id}
                    style={[s.chip, selectedService?.id === svc.id && s.chipActive]}
                    onPress={() => setSelectedService(svc)}
                  >
                    <Text style={[s.chipText, selectedService?.id === svc.id && s.chipTextActive]}>{svc.name}</Text>
                    <Text style={[s.chipSub, selectedService?.id === svc.id && s.chipTextActive]}>{svc.durationMinutes} min</Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Text style={s.sectionLabel}>Datos del cliente</Text>
              <View style={s.form}>
                <TextInput style={s.input} placeholder="Nombre y apellido *" placeholderTextColor="#94A3B8"
                  value={clientName} onChangeText={setClientName} autoCapitalize="words" />
                <TextInput style={s.input} placeholder="Teléfono *" placeholderTextColor="#94A3B8"
                  value={clientPhone} onChangeText={setClientPhone} keyboardType="phone-pad" />
                <TextInput style={s.input} placeholder="Email (opcional)" placeholderTextColor="#94A3B8"
                  value={clientEmail} onChangeText={setClientEmail} keyboardType="email-address" autoCapitalize="none" />
                <TextInput style={[s.input, { height: 72 }]} placeholder="Notas (opcional)" placeholderTextColor="#94A3B8"
                  value={notes} onChangeText={setNotes} multiline textAlignVertical="top" />
              </View>
              <Pressable style={s.btnPrimary} onPress={goStep1to2}>
                <Text style={s.btnPrimaryText}>Siguiente →</Text>
              </Pressable>
            </>
          )}

          {/* ── STEP 2: Fecha y hora ── */}
          {step === 2 && (
            <>
              <View style={s.serviceTag}>
                <Text style={s.serviceTagText}>{selectedService?.name} · {selectedService?.durationMinutes} min</Text>
                <Pressable onPress={() => setStep(1)}><Text style={s.editLink}>Cambiar</Text></Pressable>
              </View>

              <Text style={s.sectionLabel}>Fecha *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.hScroll}>
                {dates.map(d => {
                  const isSel = toDateStr(d) === toDateStr(selectedDate)
                  return (
                    <Pressable key={toDateStr(d)} style={[s.dateChip, isSel && s.chipActive]} onPress={() => setSelectedDate(d)}>
                      <Text style={[s.dateDay, isSel && s.chipTextActive]}>{DAYS[d.getDay()]}</Text>
                      <Text style={[s.dateNum, isSel && s.chipTextActive]}>{d.getDate()}</Text>
                      <Text style={[s.dateMon, isSel && s.chipTextActive]}>{MONTHS[d.getMonth()]}</Text>
                    </Pressable>
                  )
                })}
              </ScrollView>

              <Text style={s.sectionLabel}>Horario *</Text>
              {loadingSlots
                ? <ActivityIndicator color="#0284C7" style={{ marginVertical: 12 }} />
                : slots.length === 0
                  ? <Text style={s.noSlots}>Sin horarios disponibles para esta fecha</Text>
                  : (
                    <View style={s.slotsGrid}>
                      {slots.map(slot => (
                        <Pressable key={slot}
                          style={[s.slotChip, selectedSlot === slot && s.chipActive]}
                          onPress={() => setSelectedSlot(slot)}
                        >
                          <Text style={[s.slotText, selectedSlot === slot && s.chipTextActive]}>{slot}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )
              }
              <View style={s.row}>
                <Pressable style={[s.btnSecondary, { flex: 1 }]} onPress={() => setStep(1)}>
                  <Text style={s.btnSecondaryText}>← Volver</Text>
                </Pressable>
                <Pressable style={[s.btnPrimary, { flex: 1 }]} onPress={goStep2to3}>
                  <Text style={s.btnPrimaryText}>Siguiente →</Text>
                </Pressable>
              </View>
            </>
          )}

          {/* ── STEP 3: Confirmar ── */}
          {step === 3 && (
            <>
              <Text style={s.confirmTitle}>Confirmá el turno</Text>
              <Text style={s.confirmSub}>Revisá los datos antes de confirmar.</Text>

              <View style={s.summaryCard}>
                <SRow label="Cliente" value={clientName} sub={clientPhone} icon="👤" />
                <SRow label="Fecha y hora" value={`${fmtDateLong(selectedDate)} · ${selectedSlot}`} icon="📅" />
                <SRow label="Servicio · Duración" value={`${selectedService?.name} · ${selectedService?.durationMinutes} min`} icon="⏱" />
              </View>

              <View style={s.notifCard}>
                <Text style={s.notifTitle}>Notificaciones al cliente</Text>
                <View style={s.notifRow}>
                  <Text style={s.notifLabel}>Enviar confirmación por WhatsApp</Text>
                  <Switch value={sendWhatsApp} onValueChange={setSendWhatsApp} trackColor={{ true: "#0284C7" }} />
                </View>
                <View style={s.notifRow}>
                  <Text style={s.notifLabel}>Enviar confirmación por Email</Text>
                  <Switch value={sendEmail} onValueChange={setSendEmail} trackColor={{ true: "#0284C7" }}
                    disabled={!clientEmail.trim()}
                  />
                </View>
                {!clientEmail.trim() && (
                  <Text style={s.notifNote}>No hay email del cliente cargado</Text>
                )}
              </View>

              <Pressable style={[s.btnConfirm, submitting && s.btnDisabled]} onPress={handleConfirm} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={s.btnConfirmText}>Confirmar turno</Text>}
              </Pressable>
              <Pressable style={s.btnSecondary} onPress={() => setStep(2)}>
                <Text style={s.btnSecondaryText}>← Volver</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  )
}

function SRow({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon?: string }) {
  return (
    <View style={s.sRow}>
      {icon && <Text style={s.sRowIcon}>{icon}</Text>}
      <View style={{ flex: 1 }}>
        <Text style={s.sRowLabel}>{label}</Text>
        <Text style={s.sRowValue}>{value}</Text>
        {sub && <Text style={s.sRowSub}>{sub}</Text>}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F0F9FF" },
  steps: { flexDirection: "row", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#E0F0F8" },
  stepItem: { flex: 1, alignItems: "center", paddingVertical: 10 },
  stepLabel: { fontSize: 11, fontWeight: "600", color: "#94A3B8" },
  stepLabelActive: { color: "#0284C7", fontWeight: "700" },
  stepLine: { height: 2, width: "80%", backgroundColor: "#0284C7", marginTop: 4, borderRadius: 1 },
  scroll: { padding: 16, gap: 8, paddingBottom: 48 },
  sectionLabel: { fontSize: 12, fontWeight: "700", color: "#64748B", textTransform: "uppercase", letterSpacing: 0.8, marginTop: 12, marginBottom: 6 },
  hScroll: { marginHorizontal: -16, paddingHorizontal: 16 },
  chip: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, marginRight: 8, borderWidth: 1, borderColor: "#E0F0F8", backgroundColor: "#fff", alignItems: "center" },
  chipActive: { backgroundColor: "#0284C7", borderColor: "#0284C7" },
  chipText: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  chipSub: { fontSize: 11, color: "#64748B", marginTop: 1 },
  chipTextActive: { color: "#fff" },
  form: { gap: 10 },
  input: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#E0F0F8", borderRadius: 12, padding: 14, fontSize: 15, color: "#0F172A" },
  serviceTag: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#EFF6FF", borderRadius: 10, padding: 12, marginBottom: 4 },
  serviceTagText: { fontSize: 14, fontWeight: "700", color: "#0284C7" },
  editLink: { fontSize: 13, color: "#0284C7", fontWeight: "600" },
  dateChip: { alignItems: "center", paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: "#E0F0F8", backgroundColor: "#fff", marginRight: 8 },
  dateDay: { fontSize: 11, fontWeight: "600", color: "#64748B" },
  dateNum: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  dateMon: { fontSize: 11, color: "#64748B" },
  noSlots: { fontSize: 14, color: "#64748B", marginVertical: 8 },
  slotsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  slotChip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: "#E0F0F8", backgroundColor: "#fff" },
  slotText: { fontSize: 15, fontWeight: "600", color: "#0F172A" },
  confirmTitle: { fontSize: 22, fontWeight: "800", color: "#0F172A", marginTop: 8 },
  confirmSub: { fontSize: 14, color: "#64748B", marginBottom: 8 },
  summaryCard: { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#E0F0F8", overflow: "hidden", marginBottom: 8 },
  notifCard: { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#E0F0F8", padding: 16, gap: 12, marginBottom: 8 },
  notifTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  notifRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  notifLabel: { fontSize: 14, color: "#334155", flex: 1, marginRight: 8 },
  notifNote: { fontSize: 12, color: "#94A3B8" },
  sRow: { flexDirection: "row", alignItems: "flex-start", padding: 14, borderBottomWidth: 1, borderBottomColor: "#F1F5F9", gap: 10 },
  sRowIcon: { fontSize: 18, marginTop: 2 },
  sRowLabel: { fontSize: 11, fontWeight: "600", color: "#64748B", textTransform: "uppercase", letterSpacing: 0.5 },
  sRowValue: { fontSize: 15, fontWeight: "700", color: "#0F172A", marginTop: 2 },
  sRowSub: { fontSize: 13, color: "#64748B", marginTop: 1 },
  row: { flexDirection: "row", gap: 10, marginTop: 16 },
  btnPrimary: { backgroundColor: "#0284C7", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 16 },
  btnPrimaryText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  btnConfirm: { backgroundColor: "#059669", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 8 },
  btnConfirmText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  btnSecondary: { borderRadius: 12, padding: 16, alignItems: "center", marginTop: 8, borderWidth: 1.5, borderColor: "#E0F0F8" },
  btnSecondaryText: { color: "#64748B", fontSize: 15, fontWeight: "700" },
  btnDisabled: { opacity: 0.5 },
  successContainer: { flex: 1, backgroundColor: "#F0F9FF", padding: 24, alignItems: "center" },
  successIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#059669", alignItems: "center", justifyContent: "center", marginTop: 32, marginBottom: 16 },
  successCheck: { fontSize: 36, color: "#fff" },
  successTitle: { fontSize: 26, fontWeight: "800", color: "#0F172A" },
  successSub: { fontSize: 14, color: "#64748B", textAlign: "center", lineHeight: 20, marginTop: 6, marginBottom: 20 },
  successCard: { width: "100%", backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#E0F0F8", overflow: "hidden", marginBottom: 20 },
})
