import { pgTable, uuid, varchar, date, timestamp } from "drizzle-orm/pg-core"
import { businesses } from "./businesses"
import { services } from "./services"
import { staff } from "./staff"
import { clients } from "./clients"

export const waitlist = pgTable("waitlist", {
  id:            uuid("id").primaryKey().defaultRandom(),
  businessId:    uuid("business_id").notNull().references(() => businesses.id),
  serviceId:     uuid("service_id").notNull().references(() => services.id),
  staffId:       uuid("staff_id").references(() => staff.id),
  clientId:      uuid("client_id").notNull().references(() => clients.id),
  requestedDate: date("requested_date").notNull(),
  status:        varchar("status", { length: 20 }).notNull().default("waiting"), // waiting | notified | booked | expired
  notifiedAt:    timestamp("notified_at", { withTimezone: true }),
  expiresAt:     timestamp("expires_at", { withTimezone: true }), // ventana de 30 min para confirmar
  createdAt:     timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
