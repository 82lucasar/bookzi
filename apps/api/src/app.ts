import Fastify from "fastify"
import cors from "@fastify/cors"
import helmet from "@fastify/helmet"
import rateLimit from "@fastify/rate-limit"

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === "production" ? "warn" : "info",
    },
  })

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
