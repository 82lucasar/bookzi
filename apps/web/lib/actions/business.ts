"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { db } from "@bookzi/db"
import { businesses, staff } from "@bookzi/db/schema"
import { eq } from "drizzle-orm"

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

  const name     = formData.get("name") as string
  const category = formData.get("category") as string
  const phone    = formData.get("phone") as string

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
