import type { FastifyInstance } from "fastify"
import { db, appointments, services, clients, staff, businesses } from "@bookzi/db"
import { eq, and, gte, lte, isNull } from "drizzle-orm"
import { z } from "zod"
import { getBusinessForUser } from "./businesses.js"

const VALID_STATUSES = ["pending", "confirmed", "completed", "cancelled", "rescheduled"] as const

const FilterSchema = z.object({
  date:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(VALID_STATUSES).optional(),
  from:   z.string().datetime().optional(),
  to:     z.string().datetime().optional(),
})

const CreateSchema = z.object({
  clientName:  z.string().min(1).max(255),
  clientPhone: z.string().min(6).max(30),
  clientEmail: z.string().email().optional().or(z.literal("")).nullable(),
  serviceId:   z.string().uuid(),
  staffId:     z.string().uuid().optional().nullable(),
  date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time:        z.string().regex(/^\d{2}:\d{2}$/),
  notes:       z.string().max(1000).optional().nullable(),
})

const StatusSchema = z.object({
  status:       z.enum(["confirmed", "completed", "cancelled"]),
  cancelReason: z.string().max(500).optional().nullable(),
})

export default async function appointmentRoutes(fastify: FastifyInstance) {
  fastify.get("/api/v1/appointments", {
    preHandler: [fastify.verifyToken],
  }, async (request) => {
    const biz = await getBusinessForUser(request.userId)
    if (!biz) throw fastify.httpErrors.notFound("Negocio no encontrado")

    const filters = FilterSchema.parse(request.query)
    const conds = [eq(appointments.businessId, biz.id), isNull(appointments.deletedAt)]

    if (filters.date) {
      conds.push(gte(appointments.startAt, new Date(`${filters.date}T00:00:00-03:00`)))
      conds.push(lte(appointments.startAt, new Date(`${filters.date}T23:59:59-03:00`)))
    } else {
      if (filters.from) conds.push(gte(appointments.startAt, new Date(filters.from)))
      if (filters.to)   conds.push(lte(appointments.startAt, new Date(filters.to)))
    }

    if (filters.status) conds.push(eq(appointments.status, filters.status))

    return db
      .select({
        id:              appointments.id,
        startAt:         appointments.startAt,
        endAt:           appointments.endAt,
        status:          appointments.status,
        notes:           appointments.notes,
        priceSnapshot:   appointments.priceSnapshot,
        paymentProofUrl: appointments.paymentProofUrl,
        serviceId:       appointments.serviceId,
        serviceName:     services.name,
        durationMinutes: services.durationMinutes,
        staffId:         appointments.staffId,
        staffName:       staff.name,
        clientId:        appointments.clientId,
        clientName:      clients.name,
        clientPhone:     clients.phone,
        clientEmail:     clients.email,
        cancelReason:    appointments.cancelReason,
        cancelledAt:     appointments.cancelledAt,
      })
      .from(appointments)
      .innerJoin(services, eq(appointments.serviceId, services.id))
      .innerJoin(staff,    eq(appointments.staffId,   staff.id))
      .innerJoin(clients,  eq(appointments.clientId,  clients.id))
      .where(and(...conds))
      .orderBy(appointments.startAt)
  })

  fastify.get("/api/v1/appointments/:id", {
    preHandler: [fastify.verifyToken],
  }, async (request) => {
    const { id } = request.params as { id: string }
    const biz = await getBusinessForUser(request.userId)
    if (!biz) throw fastify.httpErrors.notFound("Negocio no encontrado")

    const [row] = await db
      .select({
        id:              appointments.id,
        startAt:         appointments.startAt,
        endAt:           appointments.endAt,
        status:          appointments.status,
        notes:           appointments.notes,
        priceSnapshot:   appointments.priceSnapshot,
        paymentProofUrl: appointments.paymentProofUrl,
        serviceId:       appointments.serviceId,
        serviceName:     services.name,
        durationMinutes: services.durationMinutes,
        staffId:         appointments.staffId,
        staffName:       staff.name,
        clientId:        appointments.clientId,
        clientName:      clients.name,
        clientPhone:     clients.phone,
        clientEmail:     clients.email,
        cancelReason:    appointments.cancelReason,
        cancelledAt:     appointments.cancelledAt,
        cancelledBy:     appointments.cancelledBy,
      })
      .from(appointments)
      .innerJoin(services, eq(appointments.serviceId, services.id))
      .innerJoin(staff,    eq(appointments.staffId,   staff.id))
      .innerJoin(clients,  eq(appointments.clientId,  clients.id))
      .where(and(eq(appointments.id, id), eq(appointments.businessId, biz.id), isNull(appointments.deletedAt)))
      .limit(1)

    if (!row) throw fastify.httpErrors.notFound("Turno no encontrado")
    return row
  })

  // Crear turno desde el panel del profesional
  fastify.post("/api/v1/appointments", {
    preHandler: [fastify.verifyToken],
  }, async (request, reply) => {
    const biz = await getBusinessForUser(request.userId)
    if (!biz) throw fastify.httpErrors.notFound("Negocio no encontrado")

    const data = CreateSchema.parse(request.body)
    const appt = await createAppointment(biz.id, data, "confirmed")

    reply.status(201)
    return appt
  })

  fastify.patch("/api/v1/appointments/:id/status", {
    preHandler: [fastify.verifyToken],
  }, async (request) => {
    const { id } = request.params as { id: string }
    const biz = await getBusinessForUser(request.userId)
    if (!biz) throw fastify.httpErrors.notFound("Negocio no encontrado")

    const [existing] = await db
      .select({ id: appointments.id })
      .from(appointments)
      .where(and(eq(appointments.id, id), eq(appointments.businessId, biz.id), isNull(appointments.deletedAt)))
      .limit(1)
    if (!existing) throw fastify.httpErrors.notFound("Turno no encontrado")

    const { status, cancelReason } = StatusSchema.parse(request.body)
    const extra: Record<string, unknown> = { status, updatedAt: new Date() }
    if (status === "cancelled") {
      extra.cancelledAt  = new Date()
      extra.cancelledBy  = "professional"
      extra.cancelReason = cancelReason ?? null
    }

    const [updated] = await db
      .update(appointments)
      .set(extra)
      .where(eq(appointments.id, id))
      .returning()

    return updated
  })
}

export async function createAppointment(
  businessId: string,
  data: z.infer<typeof CreateSchema>,
  initialStatus: "pending" | "confirmed",
) {
  const [svc] = await db.select().from(services).where(eq(services.id, data.serviceId)).limit(1)
  if (!svc) throw new Error("Servicio no encontrado")

  let staffId = data.staffId ?? null
  if (!staffId) {
    const [first] = await db
      .select({ id: staff.id })
      .from(staff)
      .where(and(eq(staff.businessId, businessId), eq(staff.isActive, true), isNull(staff.deletedAt)))
      .orderBy(staff.createdAt)
      .limit(1)
    staffId = first?.id ?? null
  }

  // Último recurso: crear colaborador por defecto
  if (!staffId) {
    const [biz] = await db.select({ name: businesses.name }).from(businesses)
      .where(eq(businesses.id, businessId)).limit(1)
    const [created] = await db.insert(staff).values({ businessId, name: biz?.name ?? "Staff" }).returning()
    if (!created) throw new Error("Sin personal disponible")
    staffId = created.id
  }

  const startAt = new Date(`${data.date}T${data.time}:00-03:00`)
  const endAt   = new Date(startAt.getTime() + svc.durationMinutes * 60000)

  let [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.businessId, businessId), eq(clients.phone, data.clientPhone)))
    .limit(1)

  if (!client) {
    const [created] = await db.insert(clients).values({
      businessId,
      name:  data.clientName,
      phone: data.clientPhone,
      email: data.clientEmail || null,
    }).returning()
    client = created!
  }

  const [inserted] = await db.insert(appointments).values({
    businessId,
    serviceId:        svc.id,
    staffId,
    clientId:         client.id,
    startAt,
    endAt,
    status:           initialStatus,
    notes:            data.notes?.trim() || null,
    priceSnapshot:    svc.price,
    currencySnapshot: svc.currency,
  }).returning()

  return inserted
}
