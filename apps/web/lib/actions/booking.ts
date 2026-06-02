"use server"

import { z } from "zod"
import { db } from "@bookzi/db"
import { businesses, services, staff, staffServices, clients, appointments, availability, availabilityBlocks, availabilityServices } from "@bookzi/db/schema"
import { eq, and, gte, lt, isNull, ne, inArray, or, count } from "drizzle-orm"
import { sendBookingReceivedToClient, sendNewBookingToProfessional } from "@/lib/email"

const BookAppointmentSchema = z.object({
  businessId: z.string().uuid(),
  serviceId:  z.string().uuid(),
  staffId:    z.string().uuid().optional().nullable(),
  date:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time:       z.string().regex(/^\d{2}:\d{2}$/),
  clientName:  z.string().min(1).max(255),
  clientPhone: z.string().min(6).max(30),
  clientEmail: z.string().email().optional().or(z.literal("")).or(z.literal(null)),
  notes:       z.string().max(1000).optional().nullable(),
})

const DAY_MAP: Record<number, string> = {
  0: "sunday", 1: "monday", 2: "tuesday", 3: "wednesday",
  4: "thursday", 5: "friday", 6: "saturday",
}

const TZ = "America/Argentina/Buenos_Aires"

function pad(n: number) {
  return n.toString().padStart(2, "0")
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Devuelve los colaboradores activos que pueden atender el servicio dado.
 *
 * Regla:
 *   - Si staffServices está vacío para este negocio → todos pueden hacer todo.
 *   - Si hay asignaciones explícitas:
 *       • Staff SIN ninguna asignación → sin restricción, puede hacer todo.
 *       • Staff CON asignaciones → solo los servicios que tienen listados.
 */
export async function getEligibleStaff(
  businessId: string,
  serviceId: string,
): Promise<{ id: string; name: string }[]> {
  const activeStaff = await db
    .select({ id: staff.id, name: staff.name })
    .from(staff)
    .where(and(
      eq(staff.businessId, businessId),
      eq(staff.isActive, true),
      isNull(staff.deletedAt),
    ))
    .orderBy(staff.createdAt)

  if (activeStaff.length === 0) return []

  const allAssignments = await db
    .select({ staffId: staffServices.staffId, serviceId: staffServices.serviceId })
    .from(staffServices)
    .where(inArray(staffServices.staffId, activeStaff.map(s => s.id)))

  // Sin asignaciones → todos elegibles
  if (allAssignments.length === 0) return activeStaff

  const staffWithAnyAssignment  = new Set(allAssignments.map(a => a.staffId))
  const staffWithThisService     = new Set(
    allAssignments.filter(a => a.serviceId === serviceId).map(a => a.staffId),
  )

  return activeStaff.filter(s =>
    !staffWithAnyAssignment.has(s.id) ||  // sin restricción
    staffWithThisService.has(s.id),        // o tiene este servicio explícito
  )
}

/**
 * Devuelve los colaboradores activos que tienen el servicio habilitado en al menos
 * un día de su disponibilidad (via availabilityServices).
 *
 * Regla por slot de disponibilidad:
 *   - Si el slot no tiene filas en availabilityServices → sin restricción (todo permitido).
 *   - Si tiene filas → el servicio debe estar con isEnabled = true.
 *
 * Fallback: si el colaborador no tiene disponibilidad propia, se evalúa la del negocio.
 * Se hacen 3 queries totales (no N+1).
 */
export async function getStaffWithService(
  businessId: string,
  serviceId: string,
): Promise<{ id: string; name: string }[]> {
  const [activeStaff, allAvail, bizServices] = await Promise.all([
    db.select({ id: staff.id, name: staff.name })
      .from(staff)
      .where(and(eq(staff.businessId, businessId), eq(staff.isActive, true), isNull(staff.deletedAt)))
      .orderBy(staff.createdAt),
    db.select({ id: availability.id, staffId: availability.staffId })
      .from(availability)
      .where(and(eq(availability.businessId, businessId), eq(availability.isActive, true))),
    db.select({ id: services.id })
      .from(services)
      .where(and(eq(services.businessId, businessId), eq(services.isActive, true), isNull(services.deletedAt))),
  ])

  if (activeStaff.length === 0 || allAvail.length === 0) return []

  const bizServiceIds = new Set(bizServices.map(s => s.id))
  const allAvailIds   = allAvail.map(r => r.id)

  const rawAssignments = await db
    .select({ availabilityId: availabilityServices.availabilityId, serviceId: availabilityServices.serviceId, isEnabled: availabilityServices.isEnabled })
    .from(availabilityServices)
    .where(inArray(availabilityServices.availabilityId, allAvailIds))

  // Ignorar restricciones que apuntan a servicios de otro negocio (datos obsoletos)
  const validAssignments = rawAssignments.filter(r => bizServiceIds.has(r.serviceId))

  const slotsWithRestrictions = new Set(validAssignments.map(r => r.availabilityId))
  const slotsWithThisService  = new Set(
    validAssignments.filter(r => r.serviceId === serviceId && r.isEnabled).map(r => r.availabilityId),
  )

  const bizSlots = allAvail.filter(a => a.staffId === null)

  function hasServiceInSlots(slots: { id: string }[]): boolean {
    return slots.some(a =>
      !slotsWithRestrictions.has(a.id) ||  // sin restricción válida → todo permitido
      slotsWithThisService.has(a.id),       // o tiene este servicio habilitado
    )
  }

  return activeStaff.filter(member => {
    const personal = allAvail.filter(a => a.staffId === member.id)
    const check    = personal.length > 0 ? personal : bizSlots
    return check.length > 0 && hasServiceInSlots(check)
  })
}

/**
 * Calcula los slots disponibles para UN colaborador específico en una fecha.
 * Usa su disponibilidad propia; si no tiene, usa la del negocio (staffId = NULL).
 *
 * Aplica tres capas de filtrado:
 *   1. availabilityServices — si el servicio no está habilitado ese día, devuelve []
 *   2. maxPerDay            — si el servicio ya alcanzó el límite diario, devuelve []
 *   3. availabilityBlocks   — excluye slots que se superpongan con un bloque puntual
 */
async function computeSlotsForOneStaff(
  staffMemberId: string,
  businessId: string,
  svc: { id: string; durationMinutes: number; bufferMinutes: number; maxPerDay: number | null },
  dateStr: string,
): Promise<string[]> {
  const parts = dateStr.split("-").map(Number)
  const [dy, dm, dd] = parts as [number, number, number]
  const dowIndex = new Date(dy, (dm ?? 1) - 1, dd ?? 1).getDay()
  const dayOfWeek = DAY_MAP[dowIndex] as typeof availability.$inferSelect["dayOfWeek"]

  // Disponibilidad del colaborador → fallback al negocio
  let avail = (await db.select().from(availability).where(and(
    eq(availability.businessId, businessId),
    eq(availability.staffId,    staffMemberId),
    eq(availability.dayOfWeek,  dayOfWeek),
    eq(availability.isActive,   true),
  )).limit(1))[0]

  if (!avail) {
    avail = (await db.select().from(availability).where(and(
      eq(availability.businessId, businessId),
      isNull(availability.staffId),
      eq(availability.dayOfWeek, dayOfWeek),
      eq(availability.isActive,  true),
    )).limit(1))[0]
  }

  if (!avail) return []

  // 1. Filtro por servicio habilitado en este día
  const svcAssignments = await db
    .select({ serviceId: availabilityServices.serviceId, isEnabled: availabilityServices.isEnabled })
    .from(availabilityServices)
    .where(eq(availabilityServices.availabilityId, avail.id))

  if (svcAssignments.length > 0) {
    const enabled = svcAssignments.some(r => r.serviceId === svc.id && r.isEnabled)
    if (!enabled) return []
  }

  const dayStart = new Date(`${dateStr}T00:00:00Z`)
  const dayEnd   = new Date(`${dateStr}T23:59:59Z`)

  // 2. Límite diario del servicio (cuenta todos los staff del negocio)
  if (svc.maxPerDay !== null && svc.maxPerDay > 0) {
    const result = await db
      .select({ total: count() })
      .from(appointments)
      .where(and(
        eq(appointments.businessId, businessId),
        eq(appointments.serviceId,  svc.id),
        gte(appointments.startAt, dayStart),
        lt(appointments.startAt,  dayEnd),
        ne(appointments.status, "cancelled"),
      ))
    const total = result[0]?.total ?? 0
    if (total >= svc.maxPerDay) return []
  }

  // 3. Bloques puntuales (vacaciones, reuniones, etc.) del staff o del negocio entero
  const blocks = await db
    .select({ startsAt: availabilityBlocks.startsAt, endsAt: availabilityBlocks.endsAt })
    .from(availabilityBlocks)
    .where(and(
      eq(availabilityBlocks.businessId, businessId),
      or(
        isNull(availabilityBlocks.staffId),
        eq(availabilityBlocks.staffId, staffMemberId),
      ),
      lt(availabilityBlocks.startsAt, dayEnd),
      gte(availabilityBlocks.endsAt, dayStart),
    ))

  // Solo los turnos de ESTE colaborador bloquean su agenda
  const booked = await db
    .select({ startAt: appointments.startAt, endAt: appointments.endAt })
    .from(appointments)
    .where(and(
      eq(appointments.businessId, businessId),
      eq(appointments.staffId,    staffMemberId),
      gte(appointments.startAt, dayStart),
      lt(appointments.startAt,  dayEnd),
      ne(appointments.status, "cancelled"),
    ))

  const slotMinutes = svc.durationMinutes + svc.bufferMinutes
  const [sh, sm]    = avail.startTime.split(":").map(Number)
  const [eh, em]    = avail.endTime.split(":").map(Number)
  const startTotal  = (sh ?? 9)  * 60 + (sm ?? 0)
  const endTotal    = (eh ?? 18) * 60 + (em ?? 0)

  const now        = new Date()
  const todayLocal = now.toLocaleDateString("en-CA", { timeZone: TZ })
  const isToday    = dateStr === todayLocal
  const nowMinutes = isToday ? (() => {
    const localNow = new Date(now.toLocaleString("en-US", { timeZone: TZ }))
    return localNow.getHours() * 60 + localNow.getMinutes() + 60
  })() : 0

  const slots: string[] = []
  for (let t = startTotal; t + svc.durationMinutes <= endTotal; t += slotMinutes) {
    if (isToday && t <= nowMinutes) continue
    const slotStart = new Date(`${dateStr}T${pad(Math.floor(t / 60))}:${pad(t % 60)}:00`)
    const slotEnd   = new Date(slotStart.getTime() + svc.durationMinutes * 60000)
    const overlapsBooked = booked.some(b =>
      slotStart < new Date(b.endAt) && slotEnd > new Date(b.startAt),
    )
    const overlapsBlock = blocks.some(b =>
      slotStart < new Date(b.endsAt) && slotEnd > new Date(b.startsAt),
    )
    if (!overlapsBooked && !overlapsBlock) slots.push(`${pad(Math.floor(t / 60))}:${pad(t % 60)}`)
  }
  return slots
}

/**
 * Encuentra el mejor colaborador disponible para un slot concreto.
 * Prioriza al que tenga menos turnos ese día (load balancing).
 */
async function findBestStaffAtSlot(
  businessId: string,
  serviceId: string,
  dateStr: string,
  timeStr: string,
  durationMinutes: number,
): Promise<string | null> {
  const eligible = await getEligibleStaff(businessId, serviceId)
  if (eligible.length === 0) return null

  const slotStart = new Date(`${dateStr}T${timeStr}:00-03:00`)
  const slotEnd   = new Date(slotStart.getTime() + durationMinutes * 60000)
  const dayStart  = new Date(`${dateStr}T00:00:00Z`)
  const dayEnd    = new Date(`${dateStr}T23:59:59Z`)

  const dayAppts = await db
    .select({ staffId: appointments.staffId, startAt: appointments.startAt, endAt: appointments.endAt })
    .from(appointments)
    .where(and(
      eq(appointments.businessId, businessId),
      gte(appointments.startAt, dayStart),
      lt(appointments.startAt,  dayEnd),
      ne(appointments.status, "cancelled"),
      inArray(appointments.staffId, eligible.map(s => s.id)),
    ))

  const candidates: { id: string; count: number }[] = []

  for (const s of eligible) {
    const hasConflict = dayAppts.some(a =>
      a.staffId === s.id &&
      slotStart < new Date(a.endAt) &&
      slotEnd   > new Date(a.startAt),
    )
    if (!hasConflict) {
      candidates.push({ id: s.id, count: dayAppts.filter(a => a.staffId === s.id).length })
    }
  }

  if (candidates.length === 0) return null
  candidates.sort((a, b) => a.count - b.count)
  return candidates[0]!.id
}

// ── Acciones públicas ──────────────────────────────────────────────────────────

export async function getBookingBusiness(slug: string) {
  const [business] = await db
    .select()
    .from(businesses)
    .where(and(eq(businesses.slug, slug), isNull(businesses.deletedAt)))
    .limit(1)

  if (!business) return null

  const [serviceList, staffList] = await Promise.all([
    db.select()
      .from(services)
      .where(and(
        eq(services.businessId, business.id),
        eq(services.isActive,   true),
        isNull(services.deletedAt),
      )),
    db.select({ id: staff.id, name: staff.name })
      .from(staff)
      .where(and(
        eq(staff.businessId, business.id),
        eq(staff.isActive,   true),
        isNull(staff.deletedAt),
      ))
      .orderBy(staff.createdAt),
  ])

  return { business, services: serviceList, staff: staffList }
}

/**
 * Devuelve los slots libres para una fecha.
 *
 * - staffId definido   → solo slots de ese colaborador.
 * - staffId null/undef → UNION de todos los colaboradores elegibles para el servicio.
 *   Cada colaborador bloquea solo sus propios turnos, por eso pueden solaparse.
 */
export async function getAvailableSlots(
  businessId: string,
  serviceId: string,
  dateStr: string,
  staffId?: string | null,
): Promise<string[]> {
  const [svc] = await db.select().from(services).where(eq(services.id, serviceId)).limit(1)
  if (!svc) return []

  const svcInfo = {
    id:              svc.id,
    durationMinutes: svc.durationMinutes,
    bufferMinutes:   svc.bufferMinutes,
    maxPerDay:       svc.maxPerDay,
  }

  if (staffId) {
    return computeSlotsForOneStaff(staffId, businessId, svcInfo, dateStr)
  }

  // Sin preferencia → UNION de slots de todos los elegibles
  const eligible = await getEligibleStaff(businessId, serviceId)
  if (eligible.length === 0) return []

  const allSlots = await Promise.all(
    eligible.map(s => computeSlotsForOneStaff(s.id, businessId, svcInfo, dateStr)),
  )

  const slotSet = new Set<string>()
  for (const slots of allSlots) for (const slot of slots) slotSet.add(slot)
  return Array.from(slotSet).sort()
}

export async function bookAppointment(formData: FormData) {
  const parsed = BookAppointmentSchema.parse({
    businessId: formData.get("businessId"),
    serviceId:  formData.get("serviceId"),
    staffId:    formData.get("staffId") || null,
    date:       formData.get("date"),
    time:       formData.get("time"),
    clientName:  formData.get("clientName"),
    clientPhone: formData.get("clientPhone"),
    clientEmail: formData.get("clientEmail"),
    notes:       formData.get("notes"),
  })

  const { businessId, serviceId, clientName, clientPhone, clientEmail } = parsed
  const dateStr     = parsed.date
  const timeStr     = parsed.time
  const clientNotes = parsed.notes ?? null
  const proofFile   = formData.get("paymentProof") as File | null

  const [svc] = await db.select().from(services).where(eq(services.id, serviceId)).limit(1)
  if (!svc) throw new Error("Servicio no encontrado")

  // ── Resolver colaborador ─────────────────────────────────────────────────
  let assignedStaffId: string | null = parsed.staffId ?? null

  if (!assignedStaffId) {
    // Sin preferencia → elegir el mejor disponible en ese slot
    assignedStaffId = await findBestStaffAtSlot(businessId, serviceId, dateStr, timeStr, svc.durationMinutes)
  }

  // Fallback: primer activo del negocio (si algo falla en la lógica anterior)
  if (!assignedStaffId) {
    const [first] = await db.select({ id: staff.id })
      .from(staff)
      .where(and(eq(staff.businessId, businessId), eq(staff.isActive, true), isNull(staff.deletedAt)))
      .orderBy(staff.createdAt)
      .limit(1)
    if (first) assignedStaffId = first.id
  }

  // Último recurso: crear staff por defecto (mantiene compatibilidad con negocios sin staff)
  if (!assignedStaffId) {
    const [biz] = await db.select({ name: businesses.name }).from(businesses).where(eq(businesses.id, businessId)).limit(1)
    const [created] = await db.insert(staff).values({ businessId, name: biz?.name ?? "Staff" }).returning()
    if (!created) throw new Error("Sin personal disponible")
    assignedStaffId = created.id
  }

  const startAt = new Date(`${dateStr}T${timeStr}:00-03:00`)
  const endAt   = new Date(startAt.getTime() + svc.durationMinutes * 60000)

  // ── Buscar o crear cliente ────────────────────────────────────────────────
  let [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.businessId, businessId), eq(clients.phone, clientPhone)))
    .limit(1)

  if (!client) {
    const [created] = await db.insert(clients).values({
      businessId, name: clientName, phone: clientPhone, email: clientEmail || null,
    }).returning()
    client = created!
  }

  // ── Comprobante de pago ───────────────────────────────────────────────────
  let paymentProofUrl: string | null = null
  if (proofFile && proofFile.size > 0) {
    try {
      const { createClient: createSupabaseClient } = await import("@supabase/supabase-js")
      const adminClient = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      )
      const ext      = proofFile.name.split(".").pop() ?? "jpg"
      const fileName = `${businessId}/${Date.now()}.${ext}`
      const buffer   = new Uint8Array(await proofFile.arrayBuffer())
      const { data: uploadData, error: uploadError } = await adminClient.storage
        .from("payment-proofs")
        .upload(fileName, buffer, { contentType: proofFile.type || "application/octet-stream", upsert: false })
      if (!uploadError && uploadData) {
        paymentProofUrl = adminClient.storage.from("payment-proofs").getPublicUrl(uploadData.path).data.publicUrl
      }
    } catch { /* continuar sin URL */ }
  }

  // ── Crear turno ───────────────────────────────────────────────────────────
  const [inserted] = await db.insert(appointments).values({
    businessId, serviceId,
    staffId:    assignedStaffId,
    clientId:   client.id,
    startAt, endAt,
    status:    "pending",
    notes:     clientNotes?.trim() || null,
    priceSnapshot:    svc.price,
    currencySnapshot: svc.currency,
    paymentProofUrl,
  }).returning()

  const [biz] = await db
    .select({ name: businesses.name, email: businesses.email })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1)

  await Promise.allSettled([
    sendBookingReceivedToClient({
      clientName, clientEmail: clientEmail || null,
      businessName: biz?.name ?? "", businessEmail: biz?.email ?? null,
      serviceName: svc.name, startAt: startAt.toISOString(), endAt: endAt.toISOString(),
      price: svc.price, currency: svc.currency,
    }),
    sendNewBookingToProfessional({
      clientName, clientEmail: clientEmail || null,
      businessName: biz?.name ?? "", businessEmail: biz?.email ?? null,
      serviceName: svc.name, startAt: startAt.toISOString(), endAt: endAt.toISOString(),
      price: svc.price, currency: svc.currency,
    }),
  ])

  return inserted?.id ?? ""
}

export async function getAppointmentPublic(id: string) {
  if (!id) return null

  const [row] = await db
    .select({
      id:              appointments.id,
      status:          appointments.status,
      startAt:         appointments.startAt,
      endAt:           appointments.endAt,
      priceSnapshot:   appointments.priceSnapshot,
      paymentProofUrl: appointments.paymentProofUrl,
      serviceName:     services.name,
      clientName:      clients.name,
      businessName:    businesses.name,
    })
    .from(appointments)
    .innerJoin(services,   eq(appointments.serviceId,  services.id))
    .innerJoin(clients,    eq(appointments.clientId,   clients.id))
    .innerJoin(businesses, eq(appointments.businessId, businesses.id))
    .where(eq(appointments.id, id))
    .limit(1)

  return row ?? null
}
