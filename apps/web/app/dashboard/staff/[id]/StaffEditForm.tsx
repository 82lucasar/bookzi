"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateStaff, toggleStaffActive, deleteStaff } from "@/lib/actions/staff"

export default function StaffEditForm({
  id, initialName, isActive,
}: {
  id: string
  initialName: string
  isActive: boolean
}) {
  const router  = useRouter()
  const [name, setName]       = useState(initialName)
  const [active, setActive]   = useState(isActive)
  const [error, setError]     = useState<string | null>(null)
  const [saving, setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(null)
    const result = await updateStaff(id, name)
    if (result && "error" in result) { setError(result.error); setSaving(false); return }
    router.push("/dashboard/staff")
  }

  async function handleToggle() {
    const next = !active
    setActive(next)
    await toggleStaffActive(id, next)
  }

  async function handleDelete() {
    if (!confirm(`¿Eliminar a ${name}? Esta acción no se puede deshacer.`)) return
    setDeleting(true)
    await deleteStaff(id)
    router.push("/dashboard/staff")
  }

  return (
    <form onSubmit={handleSave} style={{ flex: 1, padding: "24px 16px 40px", maxWidth: 480, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: "white", borderRadius: 16, border: "1.5px solid var(--border)", padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 8 }}>
            Nombre
          </label>
          <input
            type="text" value={name} onChange={e => setName(e.target.value)}
            required autoFocus
            style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid var(--border)", fontSize: 15, fontFamily: "inherit", outline: "none", color: "var(--text-dark)", background: "var(--bg)" }}
          />
          {error && <div style={{ fontSize: 13, color: "var(--error)", marginTop: 6, fontWeight: 600 }}>{error}</div>}
        </div>

        {/* Toggle activo */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 4 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-dark)" }}>Activo</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Aparece en la agenda y en las reservas</div>
          </div>
          <button
            type="button"
            onClick={handleToggle}
            style={{
              width: 44, height: 26, borderRadius: 13, border: "none", cursor: "pointer",
              background: active ? "var(--accent)" : "var(--bg-muted)",
              position: "relative", transition: "background 200ms",
            }}
          >
            <div style={{
              position: "absolute", top: 3, left: active ? 21 : 3,
              width: 20, height: 20, borderRadius: "50%", background: "white",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              transition: "left 200ms",
            }} />
          </button>
        </div>
      </div>

      <button type="submit" disabled={saving || !name.trim()} className="btn btn-primary" style={{ width: "100%", padding: "14px" }}>
        {saving ? "Guardando…" : "Guardar cambios"}
      </button>

      <button
        type="button" onClick={handleDelete} disabled={deleting}
        style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1.5px solid var(--border)", background: "white", fontSize: 14, fontWeight: 600, color: "var(--error)", cursor: "pointer", fontFamily: "inherit" }}
      >
        {deleting ? "Eliminando…" : "Eliminar colaborador"}
      </button>
    </form>
  )
}
