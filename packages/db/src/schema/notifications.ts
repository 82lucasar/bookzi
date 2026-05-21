import { pgTable, uuid, varchar, integer, text, timestamp } from "drizzle-orm/pg-core"
import {
  notificationChannelEnum,
  notificationEventEnum,
  notificationStatusEnum,
} from "./enums.js"
import { appointments } from "./appointments.js"

export const notifications = pgTable("notifications", {
  id:            uuid("id").primaryKey().defaultRandom(),
  appointmentId: uuid("appointment_id").notNull().references(() => appointments.id),
  channel:       notificationChannelEnum("channel").notNull(),
  event:         notificationEventEnum("event").notNull(),
  recipientType: varchar("recipient_type", { length: 20 }).notNull(), // 'client' | 'professional'
  recipientId:   uuid("recipient_id").notNull(),
  status:        notificationStatusEnum("status").notNull().default("pending"),
  externalId:    varchar("external_id", { length: 255 }), // message_id de Meta / email ID de Resend
  errorMessage:  text("error_message"),
  attemptCount:  integer("attempt_count").notNull().default(0),
  scheduledAt:   timestamp("scheduled_at", { withTimezone: true }),
  sentAt:        timestamp("sent_at", { withTimezone: true }),
  createdAt:     timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
