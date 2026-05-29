"use client"

import { useState } from "react"

const DURATIONS = [30, 45, 60, 90, 120, 180]

function formatDur(min: number) {
  return `${min} min`
}

function addMin(base: string, mins: number) {
  const parts = base.split(":").map(Number)
  const t = (parts[0] ?? 0) * 60 + (parts[1] ?? 0) + mins
  return `${String(Math.floor(t / 60) % 24).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`
}

const EX = "14:00"

interface Space {
  name: string
  capacity: number
}

export default function SetupDurationPicker() {
  const [duration, setDuration] = useState(30)
  const [buffer, setBuffer]     = useState(0)
  const [spaces, setSpaces]     = useState<Space[]>([{ name: "", capacity: 1 }])
  const [groupMode, setGroupMode] = useState(false)

  const spaceCount       = spaces.length
  const hasMultiCapacity = spaces.some(s => s.capacity > 1)

  const changeSpaceCount = (n: number) => {
    const count = Math.max(1, Math.min(10, n))
    setSpaces(prev => {
      const next = [...prev]
      while (next.length < count) next.push({ name: "", capacity: 1 })
      return next.slice(0, count)
    })
  }

  const updateSpace = (i: number, field: keyof Space, value: string | number) => {
    setSpaces(prev => {
      const next = [...prev]
      next[i] = { ...next[i]!, [field]: value }
      return next
    })
  }

  const endTime  = addMin(EX, duration)
  const nextTime = addMin(EX, duration + buffer)

  const spacesConfig = JSON.stringify({ spaces, groupMode })

  const stepper = (dec: () => void, label: string, inc: () => void) => (
    <div style={{
      display: "flex", alignItems: "center",
      background: "var(--bg-white)", border: "1px solid var(--border)",
      borderRadius: "var(--radius-sm)", overflow: "hidden",
    }}>
      <button type="button" onClick={dec} style={btnSt}>−</button>
      <span style={{ flex: 1, textAlign: "center", fontSize: 15, fontWeight: 700, color: "var(--text-dark)" }}>
        {label}
      </span>
      <button type="button" onClick={inc} style={btnSt}>+</button>
    </div>
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* hidden fields */}
      <input type="hidden" name="defaultDuration" value={duration} />
      <input type="hidden" name="bufferTime"      value={buffer} />
      <input type="hidden" name="spacesConfig"    value={spacesConfig} />

      {/* ── Duración ── */}
      <div className="form-group">
        <label className="form-label">¿Cuánto dura cada turno?</label>
        <div className="duration-grid">
          {DURATIONS.map(min => (
            <button
              key={min}
              type="button"
              className={`duration-chip${duration === min ? " selected" : ""}`}
              onClick={() => setDuration(min)}
            >
              {formatDur(min)}
            </button>
          ))}
        </div>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
          En minutos. Si tus servicios tienen distintas duraciones, podés configurarlas por separado más adelante.
        </p>
      </div>

      {/* ── Intervalo ── */}
      <div className="form-group">
        <label className="form-label">¿Tiempo libre entre turnos?</label>
        {stepper(
          () => setBuffer(b => Math.max(0, b - 5)),
          buffer === 0 ? "Sin intervalo" : `${buffer} min`,
          () => setBuffer(b => b + 5),
        )}
        {buffer > 0 ? (
          <div style={infoBx}>
            Un turno a las{" "}
            <strong style={{ color: "var(--primary)" }}>{EX}</strong> finaliza a las{" "}
            <strong style={{ color: "var(--primary)" }}>{endTime}</strong> y el próximo disponible
            estará <strong style={{ color: "var(--primary)" }}>{buffer} min después</strong>{" "}
            a las <strong style={{ color: "var(--primary)" }}>{nextTime}</strong>.
          </div>
        ) : (
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
            Los turnos se ofrecerán uno a continuación del otro, sin pausa.
          </p>
        )}
      </div>

      {/* ── Espacios ── */}
      <div className="form-group">
        <label className="form-label">¿Cuántos espacios tenés disponibles?</label>
        {stepper(
          () => changeSpaceCount(spaceCount - 1),
          `${spaceCount} ${spaceCount === 1 ? "espacio" : "espacios"}`,
          () => changeSpaceCount(spaceCount + 1),
        )}
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
          {spaceCount === 1
            ? "Un solo espacio — cada turno ocupa toda la disponibilidad."
            : `${spaceCount} espacios independientes. Cada uno puede recibir turnos en el mismo horario.`}
        </p>

        {/* Configuración de cada espacio */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
          {spaces.map((space, i) => (
            <div key={i} style={{
              background: "#F8FAFC",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              padding: "14px 16px",
              display: "flex", flexDirection: "column", gap: 10,
            }}>
              {/* número + nombre */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                  background: "var(--primary)", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700,
                }}>
                  {i + 1}
                </div>
                <input
                  className="form-input"
                  type="text"
                  placeholder={`Espacio ${i + 1} (ej: Consultorio ${i + 1})`}
                  value={space.name}
                  onChange={e => updateSpace(i, "name", e.target.value)}
                  style={{ margin: 0, flex: 1 }}
                />
              </div>

              {/* capacidad */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 13, color: "var(--text-mid)", flex: 1 }}>
                  Capacidad por turno
                </span>
                <div style={{
                  display: "flex", alignItems: "center",
                  background: "#fff", border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)", overflow: "hidden",
                }}>
                  <button
                    type="button"
                    onClick={() => updateSpace(i, "capacity", Math.max(1, space.capacity - 1))}
                    style={{ ...btnSt, width: 36, height: 36, fontSize: 18 }}
                  >−</button>
                  <span style={{ width: 44, textAlign: "center", fontSize: 14, fontWeight: 700, color: "var(--text-dark)" }}>
                    {space.capacity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateSpace(i, "capacity", Math.min(50, space.capacity + 1))}
                    style={{ ...btnSt, width: 36, height: 36, fontSize: 18 }}
                  >+</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modo grupo — solo visible si algún espacio tiene capacidad > 1 */}
        {hasMultiCapacity && (
          <div style={{
            marginTop: 14,
            background: "rgba(2,132,199,0.07)",
            border: "1px solid rgba(2,132,199,0.18)",
            borderRadius: "var(--radius-sm)",
            padding: "14px 16px",
            display: "flex", alignItems: "flex-start", gap: 12,
          }}>
            <input
              type="checkbox"
              id="groupMode"
              checked={groupMode}
              onChange={e => setGroupMode(e.target.checked)}
              style={{ marginTop: 2, width: 16, height: 16, accentColor: "#0284C7", flexShrink: 0 }}
            />
            <label htmlFor="groupMode" style={{ fontSize: 13, color: "var(--text-mid)", lineHeight: 1.6, cursor: "pointer" }}>
              <strong style={{ color: "var(--text-dark)" }}>Modo grupo</strong> — Los clientes reservan individualmente
              pero comparten el mismo espacio. Ideal para clases grupales, workshops o actividades colectivas.
            </label>
          </div>
        )}
      </div>

    </div>
  )
}

const btnSt: React.CSSProperties = {
  width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: 22, fontWeight: 400, color: "var(--text-mid)",
  background: "var(--bg-muted)", border: "none", cursor: "pointer", flexShrink: 0,
}

const infoBx: React.CSSProperties = {
  marginTop: 10,
  background: "rgba(2,132,199,0.07)",
  border: "1px solid rgba(2,132,199,0.18)",
  borderRadius: "var(--radius-sm)",
  padding: "10px 14px",
  fontSize: 13, color: "var(--text-mid)", lineHeight: 1.6,
}
