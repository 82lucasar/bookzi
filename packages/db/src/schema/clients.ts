import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core"
import { businesses } from "./businesses.js"

export const clients = pgTable("clients", {
  id:         uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id),
  name:       varchar("name", { length: 255 }).notNull(),
  email:      varchar("email", { length: 255 }),
  phone:      varchar("phone", { length: 30 }),
  notes:      text("notes"),
  createdAt:  timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:  timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt:  timestamp("deleted_at", { withTimezone: true }),
})
