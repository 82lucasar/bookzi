"use client"

import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        width: "100%", padding: "16px", borderRadius: 16,
        background: "var(--bg-white)", border: "1px solid var(--border)",
        color: "var(--error)", fontSize: 15, fontWeight: 700,
        cursor: "pointer", fontFamily: "var(--font)",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M7 3H3a1 1 0 00-1 1v10a1 1 0 001 1h4M12 13l4-4-4-4M16 9H7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      Cerrar sesión
    </button>
  )
}
