import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core"
import { businesses } from "./businesses"

export const subscriptions = pgTable("subscriptions", {
  id:               uuid("id").primaryKey().defaultRandom(),
  businessId:       uuid("business_id").notNull().references(() => businesses.id),
  plan:             varchar("plan", { length: 20 }).notNull().default("free"),
  status:           varchar("status", { length: 20 }).notNull().default("active"),
  mpSubscriptionId: varchar("mp_subscription_id", { length: 255 }),
  mpPlanId:         varchar("mp_plan_id", { length: 255 }),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  trialEndsAt:      timestamp("trial_ends_at", { withTimezone: true }),
  cancelledAt:      timestamp("cancelled_at", { withTimezone: true }),
  createdAt:        timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})
