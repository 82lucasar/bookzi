import type { FastifyInstance } from "fastify"
import { db, staff, staffServices } from "@bookzi/db"
import { eq, and, isNull } from "drizzle-orm"
import { z } from "zod"
import { getBusinessForUser } from "./businesses.js"

const StaffSchema = z.object({
  name:      z.string().min(1).max(255),
  email:     z.string().email().optional().nullable(),
  phone:     z.string().max(30).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
  isActive:  z.boolean().default(true),
  serviceIds: z.array(z.string().uuid()).optional(),
})

export default async function staffRoutes(fastify: FastifyInstance) {
  fastify.get("/api/v1/staff", {
    preHandler: [fastify.verifyToken],
  }, async (request) => {
    const biz = await getBusinessForUser(request.userId)
    if (!biz) throw fastify.httpErrors.notFound("Negocio no encontrado")

    return db
      .select()
      .from(staff)
      .where(and(eq(staff.businessId, biz.id), isNull(staff.deletedAt)))
      .orderBy(staff.createdAt)
  })

  fastify.get("/api/v1/staff/:id", {
    preHandler: [fastify.verifyToken],
  }, async (request) => {
    const { id } = request.params as { id: string }
    const biz = await getBusinessForUser(request.userId)
    if (!biz) throw fastify.httpErrors.notFound("Negocio no encontrado")

    const [member] = await db
      .select()
      .from(staff)
      .where(and(eq(staff.id, id), eq(staff.businessId, biz.id), isNull(staff.deletedAt)))
      .limit(1)

    if (!member) throw fastify.httpErrors.notFound("Colaborador no encontrado")

    const services = await db
      .select({ serviceId: staffServices.serviceId })
      .from(staffServices)
      .where(eq(staffServices.staffId, id))

    return { ...member, serviceIds: services.map(s => s.serviceId) }
  })

  fastify.post("/api/v1/staff", {
    preHandler: [fastify.verifyToken],
  }, async (request, reply) => {
    const biz = await getBusinessForUser(request.userId)
    if (!biz) throw fastify.httpErrors.notFound("Negocio no encontrado")

    const { serviceIds, ...rest } = StaffSchema.parse(request.body)
    const [created] = await db.insert(staff).values({
      ...rest,
      businessId: biz.id,
    }).returning()

    if (created && serviceIds && serviceIds.length > 0) {
      await db.insert(staffServices).values(
        serviceIds.map(serviceId => ({ staffId: created.id, serviceId })),
      ).onConflictDoNothing()
    }

    reply.status(201)
    return created
  })

  fastify.put("/api/v1/staff/:id", {
    preHandler: [fastify.verifyToken],
  }, async (request) => {
    const { id } = request.params as { id: string }
    const biz = await getBusinessForUser(request.userId)
    if (!biz) throw fastify.httpErrors.notFound("Negocio no encontrado")

    const [existing] = await db
      .select({ id: staff.id })
      .from(staff)
      .where(and(eq(staff.id, id), eq(staff.businessId, biz.id), isNull(staff.deletedAt)))
      .limit(1)
    if (!existing) throw fastify.httpErrors.notFound("Colaborador no encontrado")

    const { serviceIds, ...rest } = StaffSchema.partial().parse(request.body)

    const [updated] = await db
      .update(staff)
      .set({ ...rest, updatedAt: new Date() })
      .where(eq(staff.id, id))
      .returning()

    if (serviceIds !== undefined) {
      await db.delete(staffServices).where(eq(staffServices.staffId, id))
      if (serviceIds.length > 0) {
        await db.insert(staffServices).values(
          serviceIds.map(serviceId => ({ staffId: id, serviceId })),
        )
      }
    }

    return updated
  })

  fastify.delete("/api/v1/staff/:id", {
    preHandler: [fastify.verifyToken],
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const biz = await getBusinessForUser(request.userId)
    if (!biz) throw fastify.httpErrors.notFound("Negocio no encontrado")

    await db
      .update(staff)
      .set({ deletedAt: new Date(), isActive: false, updatedAt: new Date() })
      .where(and(eq(staff.id, id), eq(staff.businessId, biz.id), isNull(staff.deletedAt)))

    reply.status(204)
    return
  })
}
