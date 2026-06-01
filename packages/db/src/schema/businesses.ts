import { pgTable, uuid, varchar, integer, jsonb, timestamp } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const businesses = pgTable("businesses", {
  id:                       uuid("id").primaryKey().defaultRandom(),
  ownerId:                  uuid("owner_id").notNull(),
  name:                     varchar("name", { length: 255 }).notNull(),
  slug:                     varchar("slug", { length: 100 }).notNull().unique(),
  category:                 varchar("category", { length: 100 }),
  timezone:                 varchar("timezone", { length: 100 }).notNull().default("America/Argentina/Buenos_Aires"),
  phone:                    varchar("phone", { length: 30 }),
  email:                    varchar("email", { length: 255 }),
  address:                  varchar("address", { length: 500 }),
  cancellationPolicyHours:  integer("cancellation_policy_hours").notNull().default(24),
  bookingAdvanceMinHours:   integer("booking_advance_min_hours").notNull().default(1),
  // Transferencia bancaria
  transferAlias:            varchar("transfer_alias",   { length: 100 }),
  transferCbu:              varchar("transfer_cbu",     { length: 22 }),
  transferTitular:          varchar("transfer_titular", { length: 255 }),
  // WhatsApp Business (Fase 2 — Embedded Signup)
  whatsappPhoneNumberId:    varchar("whatsapp_phone_number_id", { length: 100 }),
  whatsappWabaId:           varchar("whatsapp_waba_id", { length: 100 }),
  whatsappAccessToken:      varchar("whatsapp_access_token", { length: 500 }), // encriptado en reposo
  whatsappConnectedAt:      timestamp("whatsapp_connected_at", { withTimezone: true }),
  config:                   jsonb("config").notNull().default(sql`'{}'::jsonb`),
  createdAt:                timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:                timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt:                timestamp("deleted_at", { withTimezone: true }),
})
