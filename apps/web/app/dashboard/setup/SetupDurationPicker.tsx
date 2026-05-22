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

export default function SetupDurationPicker() {
  const [duration, setDuration] = useState(30)
  const [buffer, setBuffer]     = useState(0)
  const [slots, setSlots]       = useState(1)
  const [names, setNames]       = useState<string[]>([""])

  const changeSlots = (n: number) => {
    const count = Math.max(1, Math.min(10, n))
    setSlots(count)
    setNames(prev => {
      const next = [...prev]
      while (next.length < count) next.push("")
      return next.slice(0, count)
    })
  }

  const endTime  = addMin(EX, duration)
  const nextTime = addMin(EX, duration + buffer)

  const stepper = (val: number, dec: () => void, inc: () => void, label: string) => (
    <div style={{
      display: "flex", alignItems: "center",
      background: "var(--bg-white)", border: "1px solid var(--border)",
      borderRadius: "var(--radius-sm)", overflow: "hidden"
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
      <input type="hidden" name="bufferTime"       value={buffer} />
      <input type="hidden" name="concurrentSlots"  value={slots} />
      {names.map((n, i) => <input key={i} type="hidden" name={`slotName_${i}`} value={n} />)}

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
          buffer,
          () => setBuffer(b => Math.max(0, b - 5)),
          () => setBuffer(b => b + 5),
          buffer === 0 ? "Sin intervalo" : `${buffer} min`
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

      {/* ── Reservas simultáneas ── */}
      <div className="form-group">
        <label className="form-label">¿Cuántas reservas en el mismo horario?</label>
        {stepper(
          slots,
          () => changeSlots(slots - 1),
          () => changeSlots(slots + 1),
          `${slots} ${slots === 1 ? "lugar" : "lugares"}`
        )}
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
          {slots === 1
            ? "Solo una reserva por horario."
            : `Las ${slots} reservas del mismo horario se asignan a distintos espacios.`}
        </p>

        {slots > 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-mid)" }}>
              Nombrá cada espacio <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(opcional)</span>
            </div>
            {names.map((name, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                  background: "var(--primary)", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700
                }}>
                  {i + 1}
                </div>
                <input
                  className="form-input"
                  type="text"
                  placeholder={`Ej: Consultorio ${i + 1}`}
                  value={name}
                  onChange={e => {
                    const next = [...names]
                    next[i] = e.target.value
                    setNames(next)
                  }}
                  style={{ margin: 0, flex: 1 }}
                />
              </div>
            ))}
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
