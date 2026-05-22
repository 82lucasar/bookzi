import fp from "fastify-plugin"
import { createClient } from "@supabase/supabase-js"
import type { FastifyPluginAsync, FastifyRequest } from "fastify"

declare module "fastify" {
  interface FastifyRequest {
    userId: string
  }
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  fastify.decorate("verifyToken", async (request: FastifyRequest) => {
    const authHeader = request.headers.authorization
    if (!authHeader?.startsWith("Bearer ")) {
      throw fastify.httpErrors.unauthorized("Token requerido")
    }

    const token = authHeader.slice(7)
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      throw fastify.httpErrors.unauthorized("Token inválido")
    }

    request.userId = user.id
  })
}

export default fp(authPlugin, { name: "auth" })
