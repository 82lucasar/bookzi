import { pgTable, uuid, varchar, jsonb, inet, timestamp } from "drizzle-orm/pg-core"

export const auditLogs = pgTable("audit_logs", {
  id:         uuid("id").primaryKey().defaultRandom(),
  actorId:    uuid("actor_id"),
  actorType:  varchar("actor_type", { length: 30 }), // 'client' | 'professional' | 'system'
  action:     varchar("action", { length: 100 }).notNull(),
  entity:     varchar("entity", { length: 100 }).notNull(),
  entityId:   uuid("entity_id").notNull(),
  payload:    jsonb("payload").notNull().default({}),
  ipAddress:  inet("ip_address"),
  createdAt:  timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
