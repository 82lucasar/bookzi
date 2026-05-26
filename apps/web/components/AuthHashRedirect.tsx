"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// Detecta hashes de error de Supabase en la URL raíz y redirige a la página correcta.
// Supabase envía errores de recovery al site_url (no al redirectTo), por eso aterrizan aquí.
export default function AuthHashRedirect() {
  const router = useRouter()

  useEffect(() => {
    const hash = window.location.hash
    if (!hash) return

    const params = new URLSearchParams(hash.replace("#", ""))
    const errorCode = params.get("error_code")
    const error = params.get("error")

    if (error === "access_denied" || errorCode === "otp_expired") {
      router.replace("/forgot-password?expired=1")
    }
  }, [router])

  return null
}
