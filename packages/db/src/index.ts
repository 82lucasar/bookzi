import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "./schema/index"

type Db = ReturnType<typeof drizzle<typeof schema>>
let _db: Db | undefined

function getDb(): Db {
  if (!_db) {
    const sql = neon(process.env.DATABASE_URL!)
    _db = drizzle(sql, { schema })
  }
  return _db
}

export const db = new Proxy({} as Db, {
  get(_, prop) {
    return (getDb() as any)[prop]
  },
})

export * from "./schema/index"
export type { NeonQueryFunction } from "@neondatabase/serverless"
