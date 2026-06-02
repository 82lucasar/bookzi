import type { FastifyInstance } from "fastify"
import { db, services, staffServices } from "@bookzi/db"
import { eq, and, isNull } from "drizzle-orm"
import { z } from "zod"
import { getBusinessForUser } from "./businesses.js"

const ServiceSchema = z.object({
  name:            z.string().min(1).max(255),
  description:     z.string().max(1000).optional().nullable(),
  durationMinutes: z.number().int().min(1),
  bufferMinutes:   z.number().int().min(0).default(0),
  price:           z.string().regex(/^\d+(\.\d{1,2})?$/).optional().nullable(),
  currency:        z.string().length(3).default("ARS"),
  maxPerDay:       z.number().int().positive().optional().nullable(),
  isActive:        z.boolean().default(true),
})

export default async function serviceRoutes(fastify: FastifyInstance) {
  fastify.get("/api/v1/services", {
    preHandler: [fastify.verifyToken],
  }, async (request) => {
    const biz = await getBusinessForUser(request.userId)
    if (!biz) throw fastify.httpErrors.notFound("Negocio no encontrado")

    return db
      .select()
      .from(services)
      .where(and(eq(services.businessId, biz.id), isNull(services.deletedAt)))
      .orderBy(services.createdAt)
  })

  fastify.get("/api/v1/services/:id", {
    preHandler: [fastify.verifyToken],
  }, async (request) => {
    const { id } = request.params as { id: string }
    const biz = await getBusinessForUser(request.userId)
    if (!biz) throw fastify.httpErrors.notFound("Negocio no encontrado")

    const [svc] = await db
      .select()
      .from(services)
      .where(and(eq(services.id, id), eq(services.businessId, biz.id), isNull(services.deletedAt)))
      .limit(1)

    if (!svc) throw fastify.httpErrors.notFound("Servicio no encontrado")
    return svc
  })

  fastify.post("/api/v1/services", {
    preHandler: [fastify.verifyToken],
  }, async (request, reply) => {
    const biz = await getBusinessForUser(request.userId)
    if (!biz) throw fastify.httpErrors.notFound("Negocio no encontrado")

    const data = ServiceSchema.parse(request.body)
    const [created] = await db.insert(services).values({
      ...data,
      businessId: biz.id,
    }).returning()

    reply.status(201)
    return created
  })

  fastify.put("/api/v1/services/:id", {
    preHandler: [fastify.verifyToken],
  }, async (request) => {
    const { id } = request.params as { id: string }
    const biz = await getBusinessForUser(request.userId)
    if (!biz) throw fastify.httpErrors.notFound("Negocio no encontrado")

    const [existing] = await db
      .select({ id: services.id })
      .from(services)
      .where(and(eq(services.id, id), eq(services.businessId, biz.id), isNull(services.deletedAt)))
      .limit(1)
    if (!existing) throw fastify.httpErrors.notFound("Servicio no encontrado")

    const data = ServiceSchema.partial().parse(request.body)
    const [updated] = await db
      .update(services)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(services.id, id))
      .returning()

    return updated
  })

  fastify.delete("/api/v1/services/:id", {
    preHandler: [fastify.verifyToken],
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const biz = await getBusinessForUser(request.userId)
    if (!biz) throw fastify.httpErrors.notFound("Negocio no encontrado")

    await db
      .update(services)
      .set({ deletedAt: new Date() })
      .where(and(eq(services.id, id), eq(services.businessId, biz.id), isNull(services.deletedAt)))

    reply.status(204)
    return
  })

  // Asignaciones staff ↔ servicio
  fastify.get("/api/v1/services/:id/staff", {
    preHandler: [fastify.verifyToken],
  }, async (request) => {
    const { id } = request.params as { id: string }
    const biz = await getBusinessForUser(request.userId)
    if (!biz) throw fastify.httpErrors.notFound("Negocio no encontrado")

    return db
      .select({ staffId: staffServices.staffId })
      .from(staffServices)
      .where(eq(staffServices.serviceId, id))
  })

  fastify.put("/api/v1/services/:id/staff", {
    preHandler: [fastify.verifyToken],
  }, async (request) => {
    const { id } = request.params as { id: string }
    const biz = await getBusinessForUser(request.userId)
    if (!biz) throw fastify.httpErrors.notFound("Negocio no encontrado")

    const { staffIds } = z.object({ staffIds: z.array(z.string().uuid()) }).parse(request.body)

    await db.delete(staffServices).where(eq(staffServices.serviceId, id))
    if (staffIds.length > 0) {
      await db.insert(staffServices).values(
        staffIds.map(staffId => ({ staffId, serviceId: id })),
      )
    }

    return { ok: true }
  })
}
