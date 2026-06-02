import type { FastifyInstance } from "fastify"
import { db, availability, availabilityBlocks, availabilityServices } from "@bookzi/db"
import { eq, and, gte } from "drizzle-orm"
import { z } from "zod"
import { getBusinessForUser } from "./businesses.js"

const DAY_OF_WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const

const RuleSchema = z.object({
  staffId:    z.string().uuid().optional().nullable(),
  dayOfWeek:  z.enum(DAY_OF_WEEK),
  startTime:  z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM requerido"),
  endTime:    z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM requerido"),
  isActive:   z.boolean().default(true),
  serviceIds: z.array(z.string().uuid()).optional(),
})

const BlockSchema = z.object({
  staffId:  z.string().uuid().optional().nullable(),
  startsAt: z.string().datetime(),
  endsAt:   z.string().datetime(),
  reason:   z.string().max(500).optional().nullable(),
})

export default async function availabilityRoutes(fastify: FastifyInstance) {
  fastify.get("/api/v1/availability", {
    preHandler: [fastify.verifyToken],
  }, async (request) => {
    const biz = await getBusinessForUser(request.userId)
    if (!biz) throw fastify.httpErrors.notFound("Negocio no encontrado")

    const [rules, blocks] = await Promise.all([
      db.select().from(availability)
        .where(eq(availability.businessId, biz.id))
        .orderBy(availability.dayOfWeek),
      db.select().from(availabilityBlocks)
        .where(and(
          eq(availabilityBlocks.businessId, biz.id),
          gte(availabilityBlocks.endsAt, new Date()),
        ))
        .orderBy(availabilityBlocks.startsAt),
    ])

    return { rules, blocks }
  })

  // Reemplaza todas las reglas de un negocio (operación de upsert completo)
  fastify.put("/api/v1/availability", {
    preHandler: [fastify.verifyToken],
  }, async (request) => {
    const biz = await getBusinessForUser(request.userId)
    if (!biz) throw fastify.httpErrors.notFound("Negocio no encontrado")

    const { rules } = z.object({ rules: z.array(RuleSchema) }).parse(request.body)

    await db.delete(availability).where(eq(availability.businessId, biz.id))

    if (rules.length === 0) return { rules: [], blocks: [] }

    const inserted = await db.insert(availability).values(
      rules.map(({ serviceIds: _sids, ...rule }) => ({
        ...rule,
        businessId: biz.id,
      })),
    ).returning()

    const serviceAssocs = rules.flatMap((rule, i) => {
      const id = inserted[i]?.id
      return (rule.serviceIds ?? []).map(serviceId => ({ availabilityId: id!, serviceId }))
    }).filter(a => a.availabilityId)

    if (serviceAssocs.length > 0) {
      await db.insert(availabilityServices).values(serviceAssocs).onConflictDoNothing()
    }

    return { rules: inserted }
  })

  fastify.post("/api/v1/availability/blocks", {
    preHandler: [fastify.verifyToken],
  }, async (request, reply) => {
    const biz = await getBusinessForUser(request.userId)
    if (!biz) throw fastify.httpErrors.notFound("Negocio no encontrado")

    const data = BlockSchema.parse(request.body)
    const startsAt = new Date(data.startsAt)
    const endsAt   = new Date(data.endsAt)

    if (endsAt <= startsAt) throw fastify.httpErrors.badRequest("endsAt debe ser posterior a startsAt")

    const [created] = await db.insert(availabilityBlocks).values({
      ...data,
      startsAt,
      endsAt,
      businessId: biz.id,
    }).returning()

    reply.status(201)
    return created
  })

  fastify.delete("/api/v1/availability/blocks/:id", {
    preHandler: [fastify.verifyToken],
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const biz = await getBusinessForUser(request.userId)
    if (!biz) throw fastify.httpErrors.notFound("Negocio no encontrado")

    await db.delete(availabilityBlocks).where(
      and(
        eq(availabilityBlocks.id, id),
        eq(availabilityBlocks.businessId, biz.id),
      ),
    )

    reply.status(204)
    return
  })
}
