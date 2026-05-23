"use server"

import { redirect } from "next/navigation"
import { db } from "@bookzi/db"
import { businesses, services, staff, clients, appointments, availability } from "@bookzi/db/schema"
import { eq, and, gte, lt, isNull, ne } from "drizzle-orm"

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
  const businessId = formData.get("businessId") as string
  const serviceId = formData.get("serviceId") as string
  const dateStr = formData.get("date") as string
  const timeStr = formData.get("time") as string
  const clientName = formData.get("clientName") as string
  const clientPhone = formData.get("clientPhone") as string
  const clientEmail = formData.get("clientEmail") as string

  // Obtener servicio para calcular endAt
  const [service] = await db
    .select()
    .from(services)
    .where(eq(services.id, serviceId))
    .limit(1)

  if (!service) throw new Error("Servicio no encontrado")

  // Obtener staff por defecto del negocio
  const [defaultStaff] = await db
    .select()
    .from(staff)
    .where(and(eq(staff.businessId, businessId), isNull(staff.deletedAt)))
    .orderBy(staff.createdAt)
    .limit(1)

  if (!defaultStaff) throw new Error("Sin personal disponible")

  const startAt = new Date(`${dateStr}T${timeStr}:00`)
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

  // Crear el turno
  const inserted = await db.insert(appointments).values({
    businessId,
    serviceId,
    staffId: defaultStaff.id,
    clientId: client.id,
    startAt,
    endAt,
    status: "pending",
    priceSnapshot: service.price,
    currencySnapshot: service.currency,
  }).returning()

  redirect(`/book/confirmed?id=${inserted[0]?.id ?? ""}`)

}

function pad(n: number) {
  return n.toString().padStart(2, "0")
}
