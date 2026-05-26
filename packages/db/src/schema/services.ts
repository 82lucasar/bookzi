import { pgTable, uuid, varchar, integer, numeric, boolean, timestamp, primaryKey } from "drizzle-orm/pg-core"
import { businesses } from "./businesses"
import { staff } from "./staff"

export const services = pgTable("services", {
  id:              uuid("id").primaryKey().defaultRandom(),
  businessId:      uuid("business_id").notNull().references(() => businesses.id),
  name:            varchar("name", { length: 255 }).notNull(),
  description:     varchar("description", { length: 1000 }),
  durationMinutes: integer("duration_minutes").notNull(),
  bufferMinutes:   integer("buffer_minutes").notNull().default(0),
  price:           numeric("price", { precision: 10, scale: 2 }),
  currency:        varchar("currency", { length: 3 }).default("ARS"),
  maxPerDay:       integer("max_per_day"),
  isActive:        boolean("is_active").notNull().default(true),
  createdAt:       timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt:       timestamp("deleted_at", { withTimezone: true }),
})

// Qué servicios puede ofrecer cada staff
export const staffServices = pgTable(
  "staff_services",
  {
    staffId:   uuid("staff_id").notNull().references(() => staff.id),
    serviceId: uuid("service_id").notNull().references(() => services.id),
  },
  (table) => [primaryKey({ columns: [table.staffId, table.serviceId] })],
)
