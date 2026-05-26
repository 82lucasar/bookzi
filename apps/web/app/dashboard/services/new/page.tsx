import { createService } from "@/lib/actions/services"
import Link from "next/link"

const DURATIONS = [
  { label: "15 minutos", value: 15 },
  { label: "30 minutos", value: 30 },
  { label: "45 minutos", value: 45 },
  { label: "1 hora",     value: 60 },
  { label: "1h 30min",   value: 90 },
  { label: "2 horas",    value: 120 },
  { label: "3 horas",    value: 180 },
]

export default function NewServicePage() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100dvh", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <header className="app-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/dashboard/services" className="back-btn">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <span style={{ fontSize: 17, fontWeight: 700, color: "var(--text-dark)" }}>Nuevo servicio</span>
        </div>
        <Link href="/dashboard" className="logo-home-btn">
          <div className="logo-mark">B</div>
          <span className="logo-text">Bookzi</span>
        </Link>
      </header>

      <div style={{ flex: 1, padding: "20px 16px 40px", maxWidth: 480, margin: "0 auto", width: "100%" }}>

        <form action={createService} style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Nombre */}
          <div style={{ background: "var(--bg-white)", borderRadius: 16, border: "1px solid var(--border)", overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                Nombre del servicio <span style={{ color: "var(--error)" }}>*</span>
              </div>
              <input
                name="name"
                type="text"
                required
                placeholder="Ej: Corte de pelo"
                style={{
                  width: "100%", border: "none", outline: "none",
                  fontSize: 15, fontWeight: 600, color: "var(--text-dark)",
                  background: "transparent", fontFamily: "inherit",
                  padding: 0,
                }}
              />
            </div>

            {/* Descripción */}
            <div style={{ padding: "14px 16px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                Descripción <span style={{ fontSize: 10, fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>(opcional)</span>
              </div>
              <textarea
                name="description"
                rows={3}
                placeholder="Ej: Incluye lavado y secado con blow dry"
                style={{
                  width: "100%", border: "none", outline: "none", resize: "none",
                  fontSize: 14, color: "var(--text-dark)",
                  background: "transparent", fontFamily: "inherit",
                  lineHeight: 1.6, padding: 0,
                }}
              />
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                Tus clientes verán esta descripción al reservar.
              </div>
            </div>
          </div>

          {/* Duración + Pausa */}
          <div style={{ background: "var(--bg-white)", borderRadius: 16, border: "1px solid var(--border)", overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                Duración <span style={{ color: "var(--error)" }}>*</span>
              </div>
              <select
                name="durationMinutes"
                required
                style={{
                  width: "100%", border: "none", outline: "none",
                  fontSize: 15, fontWeight: 600, color: "var(--text-dark)",
                  background: "transparent", fontFamily: "inherit",
                  padding: 0, cursor: "pointer", appearance: "none",
                }}
              >
                {DURATIONS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>

            <div style={{ padding: "14px 16px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                Pausa entre turnos
              </div>
              <select
                name="bufferMinutes"
                style={{
                  width: "100%", border: "none", outline: "none",
                  fontSize: 15, fontWeight: 600, color: "var(--text-dark)",
                  background: "transparent", fontFamily: "inherit",
                  padding: 0, cursor: "pointer", appearance: "none",
                }}
              >
                <option value={0}>Sin pausa</option>
                <option value={10}>10 min</option>
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
              </select>
            </div>
          </div>

          {/* Precio */}
          <div style={{ background: "var(--bg-white)", borderRadius: 16, border: "1px solid var(--border)", overflow: "hidden" }}>
            <div style={{ padding: "14px 16px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                Precio <span style={{ fontSize: 10, fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>(ARS · opcional)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-muted)" }}>$</span>
                <input
                  name="price"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="0"
                  style={{
                    flex: 1, border: "none", outline: "none",
                    fontSize: 15, fontWeight: 600, color: "var(--text-dark)",
                    background: "transparent", fontFamily: "inherit", padding: 0,
                  }}
                />
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
                Dejalo en 0 si no querés mostrar precio.
              </div>
            </div>
          </div>

          {/* Botones */}
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <Link
              href="/dashboard/services"
              style={{
                flex: 1, height: 50, borderRadius: 13, display: "flex",
                alignItems: "center", justifyContent: "center",
                border: "1.5px solid var(--border)", background: "var(--bg-white)",
                color: "var(--text-muted)", fontSize: 15, fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Cancelar
            </Link>
            <button
              type="submit"
              style={{
                flex: 1, height: 50, borderRadius: 13, border: "none",
                background: "linear-gradient(135deg, var(--primary), #0369A1)",
                color: "white", fontSize: 15, fontWeight: 800,
                cursor: "pointer", fontFamily: "inherit",
                boxShadow: "0 4px 14px rgba(2,132,199,0.35)",
              }}
            >
              Guardar servicio
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
