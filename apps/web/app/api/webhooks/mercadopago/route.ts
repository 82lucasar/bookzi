import { NextRequest, NextResponse } from "next/server"
import { db } from "@bookzi/db"
import { subscriptions } from "@bookzi/db/schema"
import { eq } from "drizzle-orm"
import { getSubscription } from "@/lib/services/mercadopago"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // MP envía topic=preapproval para eventos de suscripción
    if (body.type !== "preapproval") {
      return NextResponse.json({ received: true })
    }

    const mpId = body.data?.id as string
    if (!mpId) return NextResponse.json({ received: true })

    // Obtener estado actual de la suscripción en MP
    const mpSub = await getSubscription(mpId)

    const businessId = mpSub.external_reference
    if (!businessId) return NextResponse.json({ received: true })

    const mpStatus = mpSub.status // "authorized", "paused", "cancelled", "pending"

    // Mapear estado MP → estado interno
    const statusMap: Record<string, string> = {
      authorized: "active",
      paused: "paused",
      cancelled: "cancelled",
      pending: "pending",
    }
    const internalStatus = statusMap[mpStatus ?? ""] ?? "pending"

    // Calcular currentPeriodEnd: próxima fecha de cobro
    const nextPaymentDate = mpSub.next_payment_date
      ? new Date(mpSub.next_payment_date)
      : null

    // Determinar el plan por el monto de la suscripción
    const mpSubRaw = mpSub as unknown as Record<string, unknown>
    const amount = (mpSubRaw?.auto_recurring as Record<string, unknown> | undefined)?.transaction_amount
    const plan: "pro" | "business" = Number(amount) >= 32900 ? "business" : "pro"

    await db
      .update(subscriptions)
      .set({
        plan,
        status: internalStatus,
        currentPeriodEnd: nextPaymentDate,
        updatedAt: new Date(),
        ...(internalStatus === "cancelled" ? { cancelledAt: new Date() } : {}),
      })
      .where(eq(subscriptions.businessId, businessId))

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error("MP webhook error:", err)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
