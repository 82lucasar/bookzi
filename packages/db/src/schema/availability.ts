import { pgTable, uuid, boolean, time, timestamp } from "drizzle-orm/pg-core"
import { dayOfWeekEnum } from "./enums"
import { businesses } from "./businesses"
import { staff } from "./staff"

export const availability = pgTable("availability", {
  id:          uuid("id").primaryKey().defaultRandom(),
  businessId:  uuid("business_id").notNull().references(() => businesses.id),
  staffId:     uuid("staff_id").references(() => staff.id), // NULL = todo el negocio
  dayOfWeek:   dayOfWeekEnum("day_of_week").notNull(),
  startTime:   time("start_time").notNull(),
  endTime:     time("end_time").notNull(),
  isActive:    boolean("is_active").notNull().default(true),
  createdAt:   timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const availabilityBlocks = pgTable("availability_blocks", {
  id:         uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id),
  staffId:    uuid("staff_id").references(() => staff.id),
  startsAt:   timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt:     timestamp("ends_at", { withTimezone: true }).notNull(),
  reason:     uuid("reason"),
  createdAt:  timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
