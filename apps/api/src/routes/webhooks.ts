import type { FastifyInstance, FastifyRequest } from "fastify"
import { createHmac } from "crypto"
import { enqueueReminders } from "../workers/notifications.js"

function verifyMetaSignature(rawBody: string, signature: string | undefined): boolean {
  const secret = process.env.WHATSAPP_WEBHOOK_SECRET
  if (!secret || !signature) return !secret  // sin secret configurado → permitir en dev
  const expected = `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`
  return signature === expected
}

export default async function webhookRoutes(fastify: FastifyInstance) {
  // Captura el raw body para verificación de firma HMAC de Meta
  fastify.addContentTypeParser(
    "application/json",
    { parseAs: "string" },
    (req, body, done) => {
      ;(req as FastifyRequest & { rawBody: string }).rawBody = body as string
      try { done(null, JSON.parse(body as string)) }
      catch (err) { done(err as Error) }
    },
  )

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
    const rawBody = (request as FastifyRequest & { rawBody?: string }).rawBody ?? ""
    const signature = request.headers["x-hub-signature-256"] as string | undefined

    if (!verifyMetaSignature(rawBody, signature)) {
      fastify.log.warn("[webhook] Firma Meta inválida — descartando")
      return reply.status(401).send("Invalid signature")
    }

    const body = request.body as Record<string, unknown>
    if (body.object === "whatsapp_business_account") {
      fastify.log.info({ event: body.entry }, "[webhook] WhatsApp event received")
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
