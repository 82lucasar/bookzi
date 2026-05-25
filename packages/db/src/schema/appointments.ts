import { pgTable, uuid, varchar, text, numeric, timestamp } from "drizzle-orm/pg-core"
import { appointmentStatusEnum } from "./enums"
import { businesses } from "./businesses"
import { services } from "./services"
import { staff } from "./staff"
import { clients } from "./clients"

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

  // Comprobante de pago subido por el cliente
  paymentProofUrl: varchar("payment_proof_url", { length: 1000 }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
})
