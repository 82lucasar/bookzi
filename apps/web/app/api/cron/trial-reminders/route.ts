import { NextRequest, NextResponse } from "next/server"
import { db } from "@bookzi/db"
import { subscriptions, businesses } from "@bookzi/db/schema"
import { eq, and, gte, lt, isNull } from "drizzle-orm"
import { sendTrialReminder } from "@/lib/email"

// Verifica que la llamada viene de Vercel Cron (o es un test manual)
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true // sin secret configurado, permitir (solo dev)
  return req.headers.get("authorization") === `Bearer ${secret}`
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://bookzi.com"

  // Ventana D-7: trials que vencen entre 6.5 y 7.5 días desde ahora
  const trial7Start = new Date(now.getTime() + 6.5 * 24 * 60 * 60 * 1000)
  const trial7End   = new Date(now.getTime() + 7.5 * 24 * 60 * 60 * 1000)

  // Ventana D-1: trials que vencen entre 0.5 y 1.5 días desde ahora
  const trial1Start = new Date(now.getTime() + 0.5 * 24 * 60 * 60 * 1000)
  const trial1End   = new Date(now.getTime() + 1.5 * 24 * 60 * 60 * 1000)

  let sent7d = 0, sent1d = 0, errors = 0

  // ── Obtener subscriptions activas con trial en la ventana dada ────────────
  async function getTrialsInWindow(start: Date, end: Date) {
    return db
      .select({
        subId: subscriptions.id,
        businessId: subscriptions.businessId,
        trialEndsAt: subscriptions.trialEndsAt,
        businessName: businesses.name,
        businessEmail: businesses.email,
      })
      .from(subscriptions)
      .innerJoin(businesses, eq(subscriptions.businessId, businesses.id))
      .where(and(
        eq(subscriptions.status, "active"),
        isNull(businesses.deletedAt),
        gte(subscriptions.trialEndsAt, start),
        lt(subscriptions.trialEndsAt, end),
      ))
  }

  // ── Procesar D-7 ──────────────────────────────────────────────────────────
  const trials7d = await getTrialsInWindow(trial7Start, trial7End)
  for (const trial of trials7d) {
    if (!trial.businessEmail) continue
    try {
      const daysLeft = Math.ceil(
        (new Date(trial.trialEndsAt!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
      await sendTrialReminder({
        businessEmail: trial.businessEmail,
        businessName: trial.businessName,
        daysLeft,
        billingUrl: `${appUrl}/dashboard/billing`,
      })
      sent7d++
    } catch (err) {
      console.error(`[trial-reminders] D-7 error for business ${trial.businessId}:`, err)
      errors++
    }
  }

  // ── Procesar D-1 ──────────────────────────────────────────────────────────
  const trials1d = await getTrialsInWindow(trial1Start, trial1End)
  for (const trial of trials1d) {
    if (!trial.businessEmail) continue
    try {
      const daysLeft = Math.ceil(
        (new Date(trial.trialEndsAt!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
      await sendTrialReminder({
        businessEmail: trial.businessEmail,
        businessName: trial.businessName,
        daysLeft,
        billingUrl: `${appUrl}/dashboard/billing`,
      })
      sent1d++
    } catch (err) {
      console.error(`[trial-reminders] D-1 error for business ${trial.businessId}:`, err)
      errors++
    }
  }

  return NextResponse.json({
    ok: true,
    sent7d,
    sent1d,
    errors,
    processedAt: now.toISOString(),
  })
}
