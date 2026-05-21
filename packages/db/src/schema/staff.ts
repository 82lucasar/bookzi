import { pgTable, uuid, varchar, boolean, timestamp } from "drizzle-orm/pg-core"
import { businesses } from "./businesses.js"

export const staff = pgTable("staff", {
  id:         uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id),
  name:       varchar("name", { length: 255 }).notNull(),
  email:      varchar("email", { length: 255 }),
  phone:      varchar("phone", { length: 30 }),
  avatarUrl:  varchar("avatar_url", { length: 500 }),
  isActive:   boolean("is_active").notNull().default(true),
  createdAt:  timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:  timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt:  timestamp("deleted_at", { withTimezone: true }),
})
