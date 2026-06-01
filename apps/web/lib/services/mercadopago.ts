import { MercadoPagoConfig, PreApproval } from "mercadopago"

const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})

const PLAN_CONFIG = {
  pro_monthly:      { reason: "Bookzi Pro — ARS 12.900/mes",      amount: 12900 },
  business_monthly: { reason: "Bookzi Business — ARS 32.900/mes", amount: 32900 },
} as const

export type MPPlanKey = keyof typeof PLAN_CONFIG

// Crea una suscripción sin plan previo (MP hosted checkout)
// MP devuelve init_point: URL donde el usuario ingresa su tarjeta
export async function createSubscription({
  planKey,
  businessId,
  userEmail,
  backUrl,
}: {
  planKey: MPPlanKey
  businessId: string
  userEmail: string
  backUrl: string
}): Promise<{ subscriptionId: string; approvalUrl: string }> {
  const { reason, amount } = PLAN_CONFIG[planKey]
  const preApproval = new PreApproval(mp)

  let result
  try {
    result = await preApproval.create({
      body: {
        reason,
        payer_email: userEmail,
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: amount,
          currency_id: "ARS",
        },
        back_url: backUrl,
        external_reference: businessId,
      } as Parameters<typeof preApproval.create>[0]["body"],
    })
  } catch (err: unknown) {
    const e = err as { cause?: unknown; message?: string }
    console.error("MP createSubscription error:", JSON.stringify(e?.cause ?? e, null, 2))
    throw err
  }

  return {
    subscriptionId: result.id!,
    approvalUrl: result.init_point!,
  }
}

// Cancelar una suscripción activa
export async function cancelSubscription(mpSubscriptionId: string): Promise<void> {
  const preApproval = new PreApproval(mp)
  await preApproval.update({
    id: mpSubscriptionId,
    body: { status: "cancelled" },
  })
}

// Obtener info de una suscripción por ID de MP
export async function getSubscription(mpSubscriptionId: string) {
  const preApproval = new PreApproval(mp)
  return preApproval.get({ id: mpSubscriptionId })
}
