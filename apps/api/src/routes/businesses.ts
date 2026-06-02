import type { FastifyInstance } from "fastify"
import { db, businesses } from "@bookzi/db"
import { eq, and, isNull } from "drizzle-orm"
import { z } from "zod"

export async function getBusinessForUser(userId: string) {
  const [biz] = await db
    .select()
    .from(businesses)
    .where(and(eq(businesses.ownerId, userId), isNull(businesses.deletedAt)))
    .limit(1)
  return biz ?? null
}

const CreateBusinessSchema = z.object({
  name:     z.string().min(1).max(255),
  slug:     z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  category: z.string().max(100).optional().nullable(),
  timezone: z.string().max(100).default("America/Argentina/Buenos_Aires"),
  phone:    z.string().max(30).optional().nullable(),
  email:    z.string().email().optional().nullable(),
  address:  z.string().max(500).optional().nullable(),
})

const UpdateBusinessSchema = CreateBusinessSchema.partial().extend({
  cancellationPolicyHours: z.number().int().min(0).optional(),
  bookingAdvanceMinHours:  z.number().int().min(0).optional(),
  transferAlias:           z.string().max(100).optional().nullable(),
  transferCbu:             z.string().max(22).optional().nullable(),
  transferTitular:         z.string().max(255).optional().nullable(),
})

export default async function businessRoutes(fastify: FastifyInstance) {
  fastify.get("/api/v1/me/business", {
    preHandler: [fastify.verifyToken],
  }, async (request) => {
    const biz = await getBusinessForUser(request.userId)
    if (!biz) throw fastify.httpErrors.notFound("Negocio no encontrado")
    return biz
  })

  fastify.post("/api/v1/businesses", {
    preHandler: [fastify.verifyToken],
  }, async (request, reply) => {
    const existing = await getBusinessForUser(request.userId)
    if (existing) throw fastify.httpErrors.conflict("Ya tenés un negocio registrado")

    const data = CreateBusinessSchema.parse(request.body)

    const slugTaken = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(eq(businesses.slug, data.slug))
      .limit(1)
    if (slugTaken.length > 0) throw fastify.httpErrors.conflict("El slug ya está en uso")

    const [created] = await db.insert(businesses).values({
      ...data,
      ownerId: request.userId,
    }).returning()

    reply.status(201)
    return created
  })

  fastify.put("/api/v1/businesses/:id", {
    preHandler: [fastify.verifyToken],
  }, async (request) => {
    const { id } = request.params as { id: string }

    const biz = await getBusinessForUser(request.userId)
    if (!biz || biz.id !== id) throw fastify.httpErrors.forbidden("Sin acceso")

    const data = UpdateBusinessSchema.parse(request.body)

    if (data.slug && data.slug !== biz.slug) {
      const taken = await db
        .select({ id: businesses.id })
        .from(businesses)
        .where(eq(businesses.slug, data.slug))
        .limit(1)
      if (taken.length > 0) throw fastify.httpErrors.conflict("El slug ya está en uso")
    }

    const [updated] = await db
      .update(businesses)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(businesses.id, id))
      .returning()

    return updated
  })
}
