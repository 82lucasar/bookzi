import type { FastifyInstance } from "fastify"
import {
  db, businesses, services, staff, staffServices,
  appointments, availability, availabilityBlocks, availabilityServices, clients,
} from "@bookzi/db"
import { eq, and, gte, lt, ne, or, isNull, inArray, count } from "drizzle-orm"
import { z } from "zod"
import { createAppointment } from "./appointments.js"

const DAY_MAP: Record<number, string> = {
  0: "sunday", 1: "monday", 2: "tuesday", 3: "wednesday",
  4: "thursday", 5: "friday", 6: "saturday",
}
const TZ = "America/Argentina/Buenos_Aires"

function pad(n: number) { return n.toString().padStart(2, "0") }

const BookSchema = z.object({
  businessId:  z.string().uuid(),
  serviceId:   z.string().uuid(),
  staffId:     z.string().uuid().optional().nullable(),
  date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time:        z.string().regex(/^\d{2}:\d{2}$/),
  clientName:  z.string().min(1).max(255),
  clientPhone: z.string().min(6).max(30),
  clientEmail: z.string().email().optional().or(z.literal("")).nullable(),
  notes:       z.string().max(1000).optional().nullable(),
})

export default async function publicRoutes(fastify: FastifyInstance) {
  // Perfil público del negocio
  fastify.get("/api/v1/public/businesses/:slug", async (request) => {
    const { slug } = request.params as { slug: string }

    const [biz] = await db
      .select({
        id:       businesses.id,
        name:     businesses.name,
        slug:     businesses.slug,
        category: businesses.category,
        phone:    businesses.phone,
        address:  businesses.address,
        transferAlias:   businesses.transferAlias,
        transferCbu:     businesses.transferCbu,
        transferTitular: businesses.transferTitular,
      })
      .from(businesses)
      .where(and(eq(businesses.slug, slug), isNull(businesses.deletedAt)))
      .limit(1)

    if (!biz) throw fastify.httpErrors.notFound("Negocio no encontrado")

    const serviceList = await db
      .select()
      .from(services)
      .where(and(
        eq(services.businessId, biz.id),
        eq(services.isActive, true),
        isNull(services.deletedAt),
      ))
      .orderBy(services.createdAt)

    const staffList = await db
      .select({ id: staff.id, name: staff.name })
      .from(staff)
      .where(and(eq(staff.businessId, biz.id), eq(staff.isActive, true), isNull(staff.deletedAt)))
      .orderBy(staff.createdAt)

    return { business: biz, services: serviceList, staff: staffList }
  })

  // Slots disponibles
  fastify.get("/api/v1/public/slots", async (request) => {
    const { businessId, serviceId, date, staffId } = z.object({
      businessId: z.string().uuid(),
      serviceId:  z.string().uuid(),
      date:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      staffId:    z.string().uuid().optional(),
    }).parse(request.query)

    const slots = await getAvailableSlots(businessId, serviceId, date, staffId)
    return { slots }
  })

  // Booking público (cliente reserva)
  fastify.post("/api/v1/public/appointments", async (request, reply) => {
    const data = BookSchema.parse(request.body)
    const appt = await createAppointment(data.businessId, data, "pending")
    reply.status(201)
    return { appointmentId: appt?.id }
  })

  // Detalle público de un turno (para la pantalla de confirmación)
  fastify.get("/api/v1/public/appointments/:id", async (request) => {
    const { id } = request.params as { id: string }

    const [row] = await db
      .select({
        id:            appointments.id,
        status:        appointments.status,
        startAt:       appointments.startAt,
        endAt:         appointments.endAt,
        priceSnapshot: appointments.priceSnapshot,
        serviceName:   services.name,
        clientName:    clients.name,
        businessName:  businesses.name,
      })
      .from(appointments)
      .innerJoin(services,   eq(appointments.serviceId,  services.id))
      .innerJoin(clients,    eq(appointments.clientId,   clients.id))
      .innerJoin(businesses, eq(appointments.businessId, businesses.id))
      .where(eq(appointments.id, id))
      .limit(1)

    if (!row) throw fastify.httpErrors.notFound("Turno no encontrado")
    return row
  })
}

// ── Slot calculation ─────────────────────────────────────────────────────────

async function getEligibleStaff(businessId: string, serviceId: string) {
  const activeStaff = await db
    .select({ id: staff.id, name: staff.name })
    .from(staff)
    .where(and(eq(staff.businessId, businessId), eq(staff.isActive, true), isNull(staff.deletedAt)))
    .orderBy(staff.createdAt)

  if (activeStaff.length === 0) return []

  const allAssignments = await db
    .select({ staffId: staffServices.staffId, serviceId: staffServices.serviceId })
    .from(staffServices)
    .where(inArray(staffServices.staffId, activeStaff.map(s => s.id)))

  if (allAssignments.length === 0) return activeStaff

  const withServiceRestriction = new Set(allAssignments.map(a => a.staffId))
  const allowedForService = new Set(
    allAssignments.filter(a => a.serviceId === serviceId).map(a => a.staffId),
  )

  return activeStaff.filter(member =>
    !withServiceRestriction.has(member.id) || allowedForService.has(member.id),
  )
}

async function getAvailableSlots(
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

  if (staffId) return computeSlotsForStaff(staffId, businessId, svcInfo, dateStr)

  const eligible = await getEligibleStaff(businessId, serviceId)
  if (eligible.length === 0) return []

  const allSlots = await Promise.all(
    eligible.map(s => computeSlotsForStaff(s.id, businessId, svcInfo, dateStr)),
  )

  const slotSet = new Set<string>()
  for (const slots of allSlots) for (const slot of slots) slotSet.add(slot)
  return Array.from(slotSet).sort()
}

async function computeSlotsForStaff(
  staffId: string,
  businessId: string,
  svc: { id: string; durationMinutes: number; bufferMinutes: number; maxPerDay: number | null },
  dateStr: string,
): Promise<string[]> {
  const [y, m, d] = dateStr.split("-").map(Number) as [number, number, number]
  const dowIndex  = new Date(y, m - 1, d).getDay()
  const dayOfWeek = DAY_MAP[dowIndex] as (typeof availability.$inferSelect)["dayOfWeek"]

  let avail = (await db.select().from(availability).where(and(
    eq(availability.businessId, businessId),
    eq(availability.staffId,    staffId),
    eq(availability.dayOfWeek,  dayOfWeek),
    eq(availability.isActive,   true),
  )).limit(1))[0]

  if (!avail) {
    avail = (await db.select().from(availability).where(and(
      eq(availability.businessId, businessId),
      isNull(availability.staffId),
      eq(availability.dayOfWeek,  dayOfWeek),
      eq(availability.isActive,   true),
    )).limit(1))[0]
  }

  if (!avail) return []

  const svcLinks = await db
    .select({ serviceId: availabilityServices.serviceId, isEnabled: availabilityServices.isEnabled })
    .from(availabilityServices)
    .where(eq(availabilityServices.availabilityId, avail.id))

  if (svcLinks.length > 0 && !svcLinks.some(r => r.serviceId === svc.id && r.isEnabled)) return []

  const dayStart = new Date(`${dateStr}T00:00:00Z`)
  const dayEnd   = new Date(`${dateStr}T23:59:59Z`)

  if (svc.maxPerDay !== null && svc.maxPerDay > 0) {
    const rows = await db
      .select({ total: count() })
      .from(appointments)
      .where(and(
        eq(appointments.businessId, businessId),
        eq(appointments.serviceId,  svc.id),
        gte(appointments.startAt, dayStart),
        lt(appointments.startAt,  dayEnd),
        ne(appointments.status, "cancelled"),
      ))
    if ((rows[0]?.total ?? 0) >= svc.maxPerDay) return []
  }

  const [blocks, booked] = await Promise.all([
    db.select({ startsAt: availabilityBlocks.startsAt, endsAt: availabilityBlocks.endsAt })
      .from(availabilityBlocks)
      .where(and(
        eq(availabilityBlocks.businessId, businessId),
        or(isNull(availabilityBlocks.staffId), eq(availabilityBlocks.staffId, staffId)),
        lt(availabilityBlocks.startsAt,  dayEnd),
        gte(availabilityBlocks.endsAt,   dayStart),
      )),
    db.select({ startAt: appointments.startAt, endAt: appointments.endAt })
      .from(appointments)
      .where(and(
        eq(appointments.businessId, businessId),
        eq(appointments.staffId,    staffId),
        gte(appointments.startAt, dayStart),
        lt(appointments.startAt,  dayEnd),
        ne(appointments.status, "cancelled"),
      )),
  ])

  const slotMin   = svc.durationMinutes + svc.bufferMinutes
  const [sh, sm]  = avail.startTime.split(":").map(Number) as [number, number]
  const [eh, em]  = avail.endTime.split(":").map(Number) as [number, number]
  const startMins = sh * 60 + sm
  const endMins   = eh * 60 + em

  const now        = new Date()
  const todayLocal = now.toLocaleDateString("en-CA", { timeZone: TZ })
  const isToday    = dateStr === todayLocal
  const nowMins    = isToday
    ? (() => { const l = new Date(now.toLocaleString("en-US", { timeZone: TZ })); return l.getHours() * 60 + l.getMinutes() + 60 })()
    : 0

  const slots: string[] = []
  for (let t = startMins; t + svc.durationMinutes <= endMins; t += slotMin) {
    if (isToday && t <= nowMins) continue
    const slotStart = new Date(`${dateStr}T${pad(Math.floor(t / 60))}:${pad(t % 60)}:00`)
    const slotEnd   = new Date(slotStart.getTime() + svc.durationMinutes * 60000)
    const blocked   = booked.some(b => slotStart < new Date(b.endAt)    && slotEnd > new Date(b.startAt))
    const blocked2  = blocks.some(b => slotStart < new Date(b.endsAt)   && slotEnd > new Date(b.startsAt))
    if (!blocked && !blocked2) slots.push(`${pad(Math.floor(t / 60))}:${pad(t % 60)}`)
  }
  return slots
}
