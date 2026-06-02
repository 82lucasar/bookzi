"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createStaff } from "@/lib/actions/staff"
import Link from "next/link"

export default function NewStaffPage() {
  const router = useRouter()
  const [name, setName]     = useState("")
  const [error, setError]   = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const result = await createStaff(name)
    if ("error" in result) {
      setError(result.error)
      setSaving(false)
      return
    }
    router.push("/dashboard/staff")
  }

  return (
    <div style={{ background: "var(--bg)", minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <header className="app-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/dashboard/staff" className="back-btn">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <span style={{ fontSize: 17, fontWeight: 700, color: "var(--text-dark)" }}>Nuevo colaborador</span>
        </div>
      </header>

      <form onSubmit={handleSubmit} style={{ flex: 1, padding: "24px 16px", maxWidth: 480, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ background: "white", borderRadius: 16, border: "1.5px solid var(--border)", padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 8 }}>
              Nombre del colaborador
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Dr. Emiliano Martínez"
              required
              autoFocus
              style={{
                width: "100%", padding: "12px 14px", borderRadius: 10,
                border: "1.5px solid var(--border)", fontSize: 15,
                fontFamily: "inherit", outline: "none", color: "var(--text-dark)",
                background: "var(--bg)",
              }}
            />
            {error && (
              <div style={{ fontSize: 13, color: "var(--error)", marginTop: 6, fontWeight: 600 }}>{error}</div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="btn btn-primary"
          style={{ width: "100%", padding: "14px" }}
        >
          {saving ? "Guardando…" : "Crear colaborador"}
        </button>
      </form>
    </div>
  )
}
