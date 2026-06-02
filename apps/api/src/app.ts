import Fastify from "fastify"
import cors from "@fastify/cors"
import helmet from "@fastify/helmet"
import rateLimit from "@fastify/rate-limit"
import sensible from "@fastify/sensible"
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
