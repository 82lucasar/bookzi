"use server"

import { z } from "zod"
import { db } from "@bookzi/db"
import { businesses, services, staff, clients, appointments, availability } from "@bookzi/db/schema"
import { eq, and, gte, lt, isNull, ne } from "drizzle-orm"
import { createClient } from "@/lib/supabase/server"
import { sendBookingReceivedToClient, sendNewBookingToProfessional } from "@/lib/email"

const BookAppointmentSchema = z.object({
  businessId: z.string().uuid(),
  serviceId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  clientName: z.string().min(1).max(255),
  clientPhone: z.string().min(6).max(30),
  clientEmail: z.string().email().optional().or(z.literal("")).or(z.literal(null)),
  notes: z.string().max(1000).optional().nullable(),
})

const DAY_MAP: Record<number, string> = {
  0: "sunday", 1: "monday", 2: "tuesday", 3: "wednesday",
  4: "thursday", 5: "friday", 6: "saturday",
}

export async function getBookingBusiness(slug: string) {
  const [business] = await db
    .select()
    .from(businesses)
    .where(and(eq(businesses.slug, slug), isNull(businesses.deletedAt)))
    .limit(1)

  if (!business) return null

  const serviceList = await db
    .select()
    .from(services)
    .where(and(
      eq(services.businessId, business.id),
      eq(services.isActive, true),
      isNull(services.deletedAt),
    ))

  return { business, services: serviceList }
}

export async function getAvailableSlots(
  businessId: string,
  serviceId: string,
  dateStr: string, // YYYY-MM-DD
): Promise<string[]> {
  // Usar mediodía local para evitar problemas de cruce de día con UTC
  const date = new Date(`${dateStr}T12:00:00-03:00`)
  const dayOfWeek = DAY_MAP[date.getDay()]

  // Disponibilidad del negocio para ese día
  const [avail] = await db
    .select()
    .from(availability)
    .where(and(
      eq(availability.businessId, businessId),
      isNull(availability.staffId),
      eq(availability.dayOfWeek, dayOfWeek as typeof availability.$inferSelect["dayOfWeek"]),
      eq(availability.isActive, true),
    ))
    .limit(1)

  if (!avail) return []

  // Servicio (duración + buffer)
  const [service] = await db
    .select()
    .from(services)
    .where(eq(services.id, serviceId))
    .limit(1)

  if (!service) return []

  const slotMinutes = service.durationMinutes + service.bufferMinutes

  // Turnos ya reservados ese día (no cancelados)
  const dayStart = new Date(`${dateStr}T00:00:00Z`)
  const dayEnd = new Date(`${dateStr}T23:59:59Z`)

  const booked = await db
    .select({ startAt: appointments.startAt, endAt: appointments.endAt })
    .from(appointments)
    .where(and(
      eq(appointments.businessId, businessId),
      gte(appointments.startAt, dayStart),
      lt(appointments.startAt, dayEnd),
      ne(appointments.status, "cancelled"),
    ))

  // Generar todos los slots posibles
  const startParts = avail.startTime.split(":").map(Number)
  const endParts = avail.endTime.split(":").map(Number)
  const startTotal = (startParts[0] ?? 9) * 60 + (startParts[1] ?? 0)
  const endTotal = (endParts[0] ?? 18) * 60 + (endParts[1] ?? 0)

  // Usar zona horaria de Argentina (UTC-3, sin DST) para comparar "hoy" y hora actual
  const TZ = "America/Argentina/Buenos_Aires"
  const now = new Date()
  const todayLocal = now.toLocaleDateString("en-CA", { timeZone: TZ }) // "YYYY-MM-DD"
  const isToday = dateStr === todayLocal
  const nowMinutes = isToday ? (() => {
    // Hora local Argentina para filtrar slots ya pasados
    const localStr = now.toLocaleString("en-US", { timeZone: TZ })
    const localNow = new Date(localStr)
    return localNow.getHours() * 60 + localNow.getMinutes() + 60 // +60 min buffer
  })() : 0

  const slots: string[] = []

  for (let t = startTotal; t + service.durationMinutes <= endTotal; t += slotMinutes) {
    if (isToday && t <= nowMinutes) continue

    const slotStart = new Date(`${dateStr}T${pad(Math.floor(t / 60))}:${pad(t % 60)}:00`)
    const slotEnd = new Date(slotStart.getTime() + service.durationMinutes * 60000)

    const overlaps = booked.some((b) => {
      const bStart = new Date(b.startAt)
      const bEnd = new Date(b.endAt)
      return slotStart < bEnd && slotEnd > bStart
    })

    if (!overlaps) {
      slots.push(`${pad(Math.floor(t / 60))}:${pad(t % 60)}`)
    }
  }

  return slots
}

export async function bookAppointment(formData: FormData) {
  const parsed = BookAppointmentSchema.parse({
    businessId: formData.get("businessId"),
    serviceId: formData.get("serviceId"),
    date: formData.get("date"),
    time: formData.get("time"),
    clientName: formData.get("clientName"),
    clientPhone: formData.get("clientPhone"),
    clientEmail: formData.get("clientEmail"),
    notes: formData.get("notes"),
  })

  const { businessId, serviceId, clientName, clientPhone, clientEmail } = parsed
  const dateStr = parsed.date
  const timeStr = parsed.time
  const clientNotes = parsed.notes ?? null
  const paymentProofFile = formData.get("paymentProof") as File | null

  // Obtener servicio para calcular endAt
  const [service] = await db
    .select()
    .from(services)
    .where(eq(services.id, serviceId))
    .limit(1)

  if (!service) throw new Error("Servicio no encontrado")

  // Obtener staff por defecto del negocio (auto-crear si no existe)
  let defaultStaff = (await db
    .select()
    .from(staff)
    .where(and(eq(staff.businessId, businessId), isNull(staff.deletedAt)))
    .orderBy(staff.createdAt)
    .limit(1))[0]

  if (!defaultStaff) {
    const [biz] = await db.select({ name: businesses.name }).from(businesses).where(eq(businesses.id, businessId)).limit(1)
    const [created] = await db.insert(staff).values({ businessId, name: biz?.name ?? "Staff" }).returning()
    if (!created) throw new Error("Sin personal disponible")
    defaultStaff = created
  }

  const startAt = new Date(`${dateStr}T${timeStr}:00-03:00`)
  const endAt = new Date(startAt.getTime() + service.durationMinutes * 60000)

  // Buscar o crear cliente por teléfono
  let [client] = await db
    .select()
    .from(clients)
    .where(and(
      eq(clients.businessId, businessId),
      eq(clients.phone, clientPhone),
    ))
    .limit(1)

  if (!client) {
    const inserted = await db.insert(clients).values({
      businessId,
      name: clientName,
      phone: clientPhone,
      email: clientEmail || null,
    }).returning()
    client = inserted[0]!
  }

  // Intentar subir comprobante a Supabase Storage (si existe y tiene contenido)
  let paymentProofUrl: string | null = null

  if (paymentProofFile && paymentProofFile.size > 0) {
    try {
      const { createClient: createSupabaseClient } = await import("@supabase/supabase-js")
      const adminClient = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      )
      const ext = paymentProofFile.name.split(".").pop() ?? "jpg"
      const fileName = `${businessId}/${Date.now()}.${ext}`
      const arrayBuffer = await paymentProofFile.arrayBuffer()
      const buffer = new Uint8Array(arrayBuffer)

      const { data: uploadData, error: uploadError } = await adminClient
        .storage
        .from("payment-proofs")
        .upload(fileName, buffer, {
          contentType: paymentProofFile.type || "application/octet-stream",
          upsert: false,
        })

      if (!uploadError && uploadData) {
        const { data: urlData } = adminClient
          .storage
          .from("payment-proofs")
          .getPublicUrl(uploadData.path)
        paymentProofUrl = urlData.publicUrl
      }
    } catch {
      // Continuamos sin URL si falla el upload
    }
  }

  // Crear el turno
  const inserted = await db.insert(appointments).values({
    businessId,
    serviceId,
    staffId: defaultStaff.id,
    clientId: client.id,
    startAt,
    endAt,
    status: "pending",
    notes: clientNotes?.trim() || null,
    priceSnapshot: service.price,
    currencySnapshot: service.currency,
    paymentProofUrl,
  }).returning()

  // Obtener email del negocio para notificación al profesional
  const [biz] = await db
    .select({ name: businesses.name, email: businesses.email })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1)

  const emailData = {
    clientName,
    clientEmail: clientEmail || null,
    businessName: biz?.name ?? "",
    businessEmail: biz?.email ?? null,
    serviceName: service.name,
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
    price: service.price,
    currency: service.currency,
  }

  await Promise.allSettled([
    sendBookingReceivedToClient(emailData),
    sendNewBookingToProfessional(emailData),
  ])

  return inserted[0]?.id ?? ""
}

export async function getAppointmentPublic(id: string) {
  if (!id) return null

  const [row] = await db
    .select({
      id: appointments.id,
      status: appointments.status,
      startAt: appointments.startAt,
      endAt: appointments.endAt,
      priceSnapshot: appointments.priceSnapshot,
      paymentProofUrl: appointments.paymentProofUrl,
      serviceName: services.name,
      clientName: clients.name,
      businessName: businesses.name,
    })
    .from(appointments)
    .innerJoin(services, eq(appointments.serviceId, services.id))
    .innerJoin(clients, eq(appointments.clientId, clients.id))
    .innerJoin(businesses, eq(appointments.businessId, businesses.id))
    .where(eq(appointments.id, id))
    .limit(1)

  return row ?? null
}

function pad(n: number) {
  return n.toString().padStart(2, "0")
}
