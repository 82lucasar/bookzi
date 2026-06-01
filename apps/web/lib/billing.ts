import { db } from "@bookzi/db"
import { subscriptions } from "@bookzi/db/schema"
import { eq } from "drizzle-orm"

export type Plan = "free" | "pro" | "business"

const PLAN_LIMITS: Record<Plan, {
  maxServicesMonthly: number  // -1 = ilimitado
  maxAppointmentsMonthly: number
  whatsapp: boolean
  analytics: boolean
  multiStaff: boolean
  onlinePayments: boolean
  waitlist: boolean
}> = {
  free: {
    maxServicesMonthly: 3,
    maxAppointmentsMonthly: 30,
    whatsapp: false,
    analytics: false,
    multiStaff: false,
    onlinePayments: false,
    waitlist: false,
  },
  pro: {
    maxServicesMonthly: -1,
    maxAppointmentsMonthly: -1,
    whatsapp: true,
    analytics: true,
    multiStaff: false,
    onlinePayments: false,
    waitlist: false,
  },
  business: {
    maxServicesMonthly: -1,
    maxAppointmentsMonthly: -1,
    whatsapp: true,
    analytics: true,
    multiStaff: true,
    onlinePayments: true,
    waitlist: true,
  },
}

export async function getBusinessPlan(businessId: string): Promise<Plan> {
  const [sub] = await db
    .select({ plan: subscriptions.plan, status: subscriptions.status, trialEndsAt: subscriptions.trialEndsAt, currentPeriodEnd: subscriptions.currentPeriodEnd })
    .from(subscriptions)
    .where(eq(subscriptions.businessId, businessId))
    .limit(1)

  if (!sub) return "free"
  if (sub.status === "cancelled" || sub.status === "past_due") return "free"
  if (sub.trialEndsAt && new Date(sub.trialEndsAt) > new Date()) return sub.plan as Plan
  if (sub.currentPeriodEnd && new Date(sub.currentPeriodEnd) < new Date()) return "free"
  return sub.plan as Plan
}

export async function getPlanLimits(businessId: string) {
  const plan = await getBusinessPlan(businessId)
  return { plan, limits: PLAN_LIMITS[plan] }
}

export async function canUseFeature(businessId: string, feature: keyof typeof PLAN_LIMITS["free"]): Promise<boolean> {
  const plan = await getBusinessPlan(businessId)
  const val = PLAN_LIMITS[plan][feature]
  return val === true || val === -1
}
