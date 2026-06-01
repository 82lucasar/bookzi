"use server"

import { z } from "zod"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { db } from "@bookzi/db"
import { businesses, staff } from "@bookzi/db/schema"
import { eq } from "drizzle-orm"

const CreateBusinessSchema = z.object({
  name: z.string().min(1, "El nombre del negocio es obligatorio").max(255),
  category: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
})

const TransferDataSchema = z.object({
  titular: z.string().max(255),
  cbu: z.string().max(22).regex(/^\d*$/, "El CBU solo puede contener números").refine(v => !v || v.length === 22, "El CBU debe tener exactamente 22 dígitos"),
  alias: z.string().max(100),
})

export async function saveTransferData(data: {
  titular: string
  cbu: string
  alias: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const business = await getMyBusiness()
  if (!business) redirect("/dashboard/setup")

  const parsed = TransferDataSchema.parse({
    titular: data.titular.trim(),
    cbu: data.cbu.trim(),
    alias: data.alias.trim(),
  })

  await db
    .update(businesses)
    .set({
      transferTitular: parsed.titular || null,
      transferCbu: parsed.cbu || null,
      transferAlias: parsed.alias || null,
      updatedAt: new Date(),
    })
    .where(eq(businesses.id, business.id))
}

export async function getMyBusiness() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [business] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.ownerId, user.id))
    .limit(1)

  return business ?? null
}

export async function createBusiness(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const parsedBusiness = CreateBusinessSchema.parse({
    name: formData.get("name"),
    category: formData.get("category"),
    phone: formData.get("phone"),
  })

  const name     = parsedBusiness.name
  const category = parsedBusiness.category
  const phone    = parsedBusiness.phone

  const defaultDuration = Number(formData.get("defaultDuration") ?? 30)
  const bufferTime      = Number(formData.get("bufferTime") ?? 0)
  const spacesRaw       = formData.get("spacesConfig") as string | null

  let spacesConfig: { spaces: { name: string; capacity: number }[]; groupMode: boolean } = {
    spaces: [{ name: "", capacity: 1 }],
    groupMode: false,
  }
  if (spacesRaw) {
    try { spacesConfig = JSON.parse(spacesRaw) } catch { /* keep default */ }
  }

  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80)

  const result = await db.insert(businesses).values({
    ownerId: user.id,
    name,
    slug: `${slug}-${Math.random().toString(36).slice(2, 6)}`,
    category: category || null,
    phone: phone || null,
    email: user.email ?? null,
    config: { defaultDuration, bufferTime, ...spacesConfig },
  }).returning()

  const business = result[0]!

  // Staff por defecto — representa al dueño del negocio
  await db.insert(staff).values({
    businessId: business.id,
    name,
    email: user.email ?? null,
    phone: phone || null,
  })

  redirect("/onboarding/services")
}
