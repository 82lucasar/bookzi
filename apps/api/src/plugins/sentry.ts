import * as Sentry from "@sentry/node"
import fp from "fastify-plugin"
import type { FastifyPluginAsync } from "fastify"

const sentryPlugin: FastifyPluginAsync = async (fastify) => {
  if (!process.env.SENTRY_DSN) return

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV ?? "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    integrations: [Sentry.nativeNodeFetchIntegration()],
  })

  // Captura requests y usuarios en el contexto de cada error
  fastify.addHook("onRequest", async (request) => {
    Sentry.setContext("request", {
      method: request.method,
      url:    request.url,
      ip:     request.ip,
    })
  })

  // Captura errores no manejados antes de que Fastify responda
  fastify.addHook("onError", async (_request, _reply, error) => {
    if ((error as { statusCode?: number }).statusCode && (error as { statusCode: number }).statusCode < 500) return
    Sentry.captureException(error)
  })

  fastify.log.info("[sentry] inicializado")
}

export default fp(sentryPlugin, { name: "sentry" })

export { Sentry }
