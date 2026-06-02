import Fastify from "fastify"
import cors from "@fastify/cors"
import helmet from "@fastify/helmet"
import rateLimit from "@fastify/rate-limit"
import sensible from "@fastify/sensible"
import { ZodError } from "zod"
import sentryPlugin, { Sentry } from "./plugins/sentry.js"
import authPlugin from "./plugins/auth.js"
import businessRoutes from "./routes/businesses.js"
import serviceRoutes from "./routes/services.js"
import staffRoutes from "./routes/staff.js"
import availabilityRoutes from "./routes/availability.js"
import appointmentRoutes from "./routes/appointments.js"
import publicRoutes from "./routes/public.js"
import webhookRoutes from "./routes/webhooks.js"

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === "production" ? "warn" : "info",
    },
  })

  await app.register(sentryPlugin)
  await app.register(sensible)
  await app.register(helmet)

  await app.register(cors, {
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://bookzi.app", "https://www.bookzi.app"]
        : true,
    credentials: true,
  })

  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  })

  await app.register(authPlugin)

  await app.register(businessRoutes)
  await app.register(serviceRoutes)
  await app.register(staffRoutes)
  await app.register(availabilityRoutes)
  await app.register(appointmentRoutes)
  await app.register(publicRoutes)
  await app.register(webhookRoutes)

  // Convierte ZodError en 400 antes de que llegue al handler de Fastify (que lo devolvería como 500)
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        statusCode: 400,
        error: "Validation Error",
        message: error.errors[0]?.message ?? "Datos inválidos",
        details: error.errors.map(e => ({ path: e.path.join("."), message: e.message })),
      })
    }
    const status = (error as { statusCode?: number }).statusCode ?? 500
    if (status >= 500) Sentry.captureException(error)
    reply.send(error)
  })

  app.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }))

  app.get("/api/v1", async () => ({
    name: "Bookzi API",
    version: "1.0.0",
  }))

  return app
}
