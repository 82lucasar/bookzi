import type { FastifyInstance } from "fastify"
import { enqueueReminders } from "../workers/notifications.js"

export default async function webhookRoutes(fastify: FastifyInstance) {
  // ── Meta webhook verification (GET) ────────────────────────────────────────
  fastify.get("/api/v1/webhooks/whatsapp", async (request, reply) => {
    const params = request.query as Record<string, string>

    if (
      params["hub.mode"]        === "subscribe" &&
      params["hub.verify_token"] === process.env.WHATSAPP_VERIFY_TOKEN
    ) {
      return reply.status(200).send(params["hub.challenge"])
    }

    return reply.status(403).send("Verification failed")
  })

  // ── Incoming WhatsApp messages (POST) ──────────────────────────────────────
  fastify.post("/api/v1/webhooks/whatsapp", async (request, reply) => {
    // Solo procesamos mensajes entrantes de clientes en Fase 2+.
    // Por ahora solo validamos y confirmamos recepción a Meta.
    const body = request.body as Record<string, unknown>

    if (body.object === "whatsapp_business_account") {
      fastify.log.info({ body }, "[webhook] WhatsApp message received")
    }

    return reply.status(200).send("EVENT_RECEIVED")
  })

  // ── Cron: encolar recordatorios WhatsApp ───────────────────────────────────
  fastify.post("/api/v1/cron/reminders", async (request, reply) => {
    const secret = process.env.CRON_SECRET
    if (secret) {
      const auth = (request.headers.authorization ?? "").replace("Bearer ", "")
      if (auth !== secret) throw fastify.httpErrors.unauthorized("Acceso denegado")
    }

    const result = await enqueueReminders()
    fastify.log.info(result, "[cron] Recordatorios encolados")

    return { ok: true, ...result }
  })
}
