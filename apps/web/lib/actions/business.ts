"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { db } from "@bookzi/db"
import { businesses } from "@bookzi/db/schema"
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

  const name = formData.get("name") as string
  const category = formData.get("category") as string
  const phone = formData.get("phone") as string

  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80)

  await db.insert(businesses).values({
    ownerId: user.id,
    name,
    slug: `${slug}-${Math.random().toString(36).slice(2, 6)}`,
    category: category || null,
    phone: phone || null,
    email: user.email ?? null,
  })

  redirect("/dashboard")
}
