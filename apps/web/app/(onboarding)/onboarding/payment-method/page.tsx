"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { saveTransferData } from "@/lib/actions/business"

export default function PaymentMethodPage() {
  const router = useRouter()
  const [titular, setTitular] = useState("")
  const [cbu, setCbu]         = useState("")
  const [alias, setAlias]     = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const handleContinuar = async () => {
    setError(null)
    if (cbu.trim() && !/^\d{22}$/.test(cbu.trim())) {
      setError("El CBU debe tener exactamente 22 dígitos numéricos.")
      return
    }
    setLoading(true)
    try {
      await saveTransferData({ titular, cbu, alias })
      router.push("/onboarding/done")
    } catch {
      setError("Hubo un problema al guardar. Intentá de nuevo.")
      setLoading(false)
    }
  }

  const handleOmitir = () => router.push("/onboarding/done")

  return (
    <div className="ob-screen">
      <div className="ob-header">
        <div className="ob-header-left">
          <button
            className="ob-back-btn"
            onClick={() => router.push("/onboarding/availability")}
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <span className="step-label">Paso 4 de 4</span>
        </div>
        <a href="/dashboard" className="logo-home-btn">B</a>
      </div>

      <div className="progress-wrap">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: "100%" }}></div>
        </div>
      </div>

      <div className="ob-body" style={{ gap: 24, paddingBottom: 120 }}>
        <div>
          <h1 className="ob-title">Método de pago</h1>
          <p className="ob-subtitle">
            Tus clientes verán estos datos al momento de pagar su turno.
          </p>
        </div>

        <div style={{
          background: "white",
          borderRadius: 20,
          border: "1.5px solid var(--border)",
          padding: "20px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}>
          {/* Titular */}
          <div className="form-group">
            <label className="form-label">Titular de la cuenta</label>
            <input
              className="form-input"
              type="text"
              value={titular}
              placeholder="Ej: María García"
              maxLength={255}
              onChange={e => setTitular(e.target.value)}
            />
          </div>

          {/* CBU */}
          <div className="form-group">
            <label className="form-label">CBU</label>
            <input
              className="form-input"
              type="text"
              inputMode="numeric"
              value={cbu}
              placeholder="22 dígitos"
              maxLength={22}
              onChange={e => setCbu(e.target.value.replace(/\D/g, ""))}
            />
            {cbu.length > 0 && cbu.length < 22 && (
              <span style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                {22 - cbu.length} dígito{22 - cbu.length !== 1 ? "s" : ""} restante{22 - cbu.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Alias */}
          <div className="form-group">
            <label className="form-label">Alias</label>
            <input
              className="form-input"
              type="text"
              value={alias}
              placeholder="Ej: maria.garcia.mp"
              maxLength={100}
              onChange={e => setAlias(e.target.value)}
            />
          </div>

          {error && (
            <p style={{ fontSize: 13, color: "var(--error)", margin: 0, fontWeight: 500 }}>
              {error}
            </p>
          )}
        </div>

        <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", margin: 0 }}>
          Todos los campos son opcionales. Podés completarlos más tarde desde tu perfil.
        </p>
      </div>

      <div className="ob-footer" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          className="btn btn-primary btn-full btn-lg"
          type="button"
          disabled={loading}
          style={{ opacity: loading ? 0.8 : 1, cursor: loading ? "not-allowed" : "pointer" }}
          onClick={handleContinuar}
        >
          {loading ? "Guardando..." : "Continuar →"}
        </button>
        <button
          className="btn btn-secondary btn-full"
          type="button"
          disabled={loading}
          onClick={handleOmitir}
        >
          Omitir por ahora
        </button>
      </div>
    </div>
  )
}
