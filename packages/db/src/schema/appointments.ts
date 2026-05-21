import { pgTable, uuid, varchar, text, numeric, timestamp } from "drizzle-orm/pg-core"
import { appointmentStatusEnum } from "./enums.js"
import { businesses } from "./businesses.js"
import { services } from "./services.js"
import { staff } from "./staff.js"
import { clients } from "./clients.js"

export const appointments = pgTable("appointments", {
  id:         uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id),
  serviceId:  uuid("service_id").notNull().references(() => services.id),
  staffId:    uuid("staff_id").notNull().references(() => staff.id),
  clientId:   uuid("client_id").notNull().references(() => clients.id),

  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt:   timestamp("end_at", { withTimezone: true }).notNull(),

  status: appointmentStatusEnum("status").notNull().default("pending"),
  notes:  text("notes"),

  // Snapshot del precio al momento de la reserva
  priceSnapshot:    numeric("price_snapshot", { precision: 10, scale: 2 }),
  currencySnapshot: varchar("currency_snapshot", { length: 3 }),

  // Para el flujo de reprogramación
  rescheduledFromId: uuid("rescheduled_from_id"),

  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  cancelledBy: varchar("cancelled_by", { length: 20 }), // 'client' | 'professional' | 'system'
  cancelReason: text("cancel_reason"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
})
