"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getMyBusiness } from "./business"
import { db } from "@bookzi/db"
import { subscriptions } from "@bookzi/db/schema"
import { eq } from "drizzle-orm"
import { createSubscription, cancelSubscription, MPPlanKey } from "@/lib/services/mercadopago"

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://bookzi-three.vercel.app").replace(/\/$/, "")

export async function startCheckout(planKey: MPPlanKey) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const business = await getMyBusiness()
  if (!business) redirect("/dashboard/setup")

  const { subscriptionId, approvalUrl } = await createSubscription({
    planKey,
    businessId: business.id,
    userEmail: user.email!,
    backUrl: `${APP_URL}/dashboard/billing?status=pending`,
  })

  // Guardar el MP subscription ID en nuestra DB (status pending hasta que MP confirme)
  await db
    .insert(subscriptions)
    .values({
      businessId: business.id,
      plan: planKey.startsWith("pro") ? "pro" : "business",
      status: "pending",
      mpSubscriptionId: subscriptionId,
    })
    .onConflictDoUpdate({
      target: subscriptions.businessId,
      set: {
        plan: planKey.startsWith("pro") ? "pro" : "business",
        status: "pending",
        mpSubscriptionId: subscriptionId,
        updatedAt: new Date(),
      },
    })

  redirect(approvalUrl)
}

export async function cancelPlan() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const business = await getMyBusiness()
  if (!business) return

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.businessId, business.id))
    .limit(1)

  if (!sub?.mpSubscriptionId) return

  await cancelSubscription(sub.mpSubscriptionId)

  await db
    .update(subscriptions)
    .set({ status: "cancelled", cancelledAt: new Date(), updatedAt: new Date() })
    .where(eq(subscriptions.businessId, business.id))
}

export async function getMySubscription() {
  const business = await getMyBusiness()
  if (!business) return null

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.businessId, business.id))
    .limit(1)

  return sub ?? null
}
