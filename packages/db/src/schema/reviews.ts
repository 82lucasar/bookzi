import { pgTable, uuid, integer, text, varchar, timestamp } from "drizzle-orm/pg-core"
import { appointments } from "./appointments"
import { businesses } from "./businesses"
import { clients } from "./clients"

export const reviews = pgTable("reviews", {
  id:            uuid("id").primaryKey().defaultRandom(),
  appointmentId: uuid("appointment_id").notNull().references(() => appointments.id),
  businessId:    uuid("business_id").notNull().references(() => businesses.id),
  clientId:      uuid("client_id").notNull().references(() => clients.id),
  token:         varchar("token", { length: 64 }).notNull().unique(),
  rating:        integer("rating"),         // 1-5, null si no fue enviada aún
  comment:       text("comment"),
  submittedAt:   timestamp("submitted_at",  { withTimezone: true }),
  requestedAt:   timestamp("requested_at",  { withTimezone: true }).notNull().defaultNow(),
})
