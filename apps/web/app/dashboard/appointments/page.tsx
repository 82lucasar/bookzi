export const dynamic = "force-dynamic"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getMyBusiness } from "@/lib/actions/business"
import { getAppointments, confirmAppointment, cancelAppointment } from "@/lib/actions/appointments"

const STATUS_CONFIG: Record<string, { label: string; icon: string; bg: string; text: string; border: string }> = {
  pending:   { label: "Pendiente",  icon: "⏳", bg: "rgba(245,158,11,0.08)",  text: "#B45309", border: "rgba(245,158,11,0.2)"  },
  confirmed: { label: "Confirmado", icon: "✓",  bg: "rgba(5,150,105,0.08)",   text: "#047857", border: "rgba(5,150,105,0.2)"   },
  completed: { label: "Completado", icon: "—",  bg: "rgba(100,116,139,0.08)", text: "#64748B", border: "rgba(100,116,139,0.15)" },
}

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
}

type Filter = "upcoming" | "today" | "past"

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const business = await getMyBusiness()
  if (!business) redirect("/dashboard/setup")

  const { filter: rawFilter } = await searchParams
  const filter: Filter = rawFilter === "today" ? "today" : rawFilter === "past" ? "past" : "upcoming"

  const apptList = await getAppointments(filter)

  const tabs: { label: string; value: Filter }[] = [
    { label: "Próximos", value: "upcoming" },
    { label: "Hoy",      value: "today" },
    { label: "Anteriores", value: "past" },
  ]

  const emptyMessages: Record<Filter, { icon: string; title: string; subtitle: string }> = {
    upcoming: { icon: "📭", title: "No hay turnos próximos",   subtitle: "Cuando lleguen nuevas reservas, aparecerán acá." },
    today:    { icon: "☀️", title: "No hay turnos para hoy",   subtitle: "Disfrutá el tiempo libre." },
    past:     { icon: "🗂️", title: "Sin historial de turnos",  subtitle: "Los turnos completados aparecerán acá." },
  }

  return (
    <div className="min-h-screen">

      {/* Page header */}
      <div
        className="bg-white px-6 lg:px-10 py-7"
        style={{ borderBottom: "1.5px solid var(--color-border)" }}
      >
        <h1 className="text-2xl font-extrabold text-[var(--color-text-dark)]" style={{ letterSpacing: "-0.5px" }}>
          Turnos
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1 font-medium">
          Confirmá o cancelá las reservas de tus clientes
        </p>
      </div>

      <div className="px-6 lg:px-10 py-8 max-w-3xl">

        {/* Tabs */}
        <div
          className="flex gap-1.5 bg-white rounded-2xl p-1.5 mb-7 w-fit shadow-sm"
          style={{ border: "1.5px solid var(--color-border)" }}
        >
          {tabs.map((tab) => (
            <a
              key={tab.value}
              href={`/dashboard/appointments?filter=${tab.value}`}
              className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={filter === tab.value ? {
                background: "linear-gradient(135deg, #0284C7, #0369A1)",
                color: "white",
                boxShadow: "0 2px 8px rgba(2,132,199,0.3)",
              } : {
                color: "var(--color-text-muted)",
              }}
            >
              {tab.label}
            </a>
          ))}
        </div>

        {apptList.length === 0 ? (
          <div
            className="bg-white rounded-3xl py-20 text-center shadow-sm"
            style={{ border: "1.5px solid var(--color-border)" }}
          >
            <p className="text-5xl mb-5">{emptyMessages[filter].icon}</p>
            <p className="font-extrabold text-[var(--color-text-dark)] text-xl mb-2" style={{ letterSpacing: "-0.4px" }}>
              {emptyMessages[filter].title}
            </p>
            <p className="text-sm text-[var(--color-text-muted)] max-w-xs mx-auto leading-relaxed">
              {emptyMessages[filter].subtitle}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {apptList.map((appt) => {
              const sc = STATUS_CONFIG[appt.status] ?? STATUS_CONFIG.pending!
              const d = new Date(appt.startAt)
              const day = d.getDate()
              const month = d.toLocaleDateString("es-AR", { month: "short" }).replace(".", "").toUpperCase()

              return (
                <div
                  key={appt.id}
                  className="bg-white rounded-3xl overflow-hidden shadow-sm transition-shadow hover:shadow-md"
                  style={{ border: "1.5px solid var(--color-border)" }}
                >
                  <div className="flex items-stretch">
                    {/* Columna de fecha — brand manual */}
                    <div
                      className="flex flex-col items-center justify-center px-5 py-6 shrink-0"
                      style={{ background: "linear-gradient(180deg, #0284C7, #0369A1)", minWidth: 72 }}
                    >
                      <span className="text-3xl font-extrabold text-white leading-none">{day}</span>
                      <span className="text-[11px] font-bold text-white/75 uppercase tracking-wide mt-1">{month}</span>
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 px-6 py-5 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="min-w-0">
                          <p className="font-extrabold text-[var(--color-text-dark)] text-base leading-tight truncate">
                            {appt.clientName}
                          </p>
                          <p className="text-sm text-[var(--color-text-muted)] mt-0.5 truncate font-medium">
                            {appt.serviceName}
                          </p>
                        </div>
                        <span
                          className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5"
                          style={{ background: sc.bg, color: sc.text, border: `1.5px solid ${sc.border}` }}
                        >
                          <span>{sc.icon}</span>
                          {sc.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--color-primary)" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm font-bold text-[var(--color-primary)]">
                            {formatTime(appt.startAt)}
                          </span>
                          <span className="text-xs text-[var(--color-text-muted)]">—</span>
                          <span className="text-sm font-medium text-[var(--color-text-muted)]">
                            {formatTime(appt.endAt)}
                          </span>
                        </div>
                        {appt.clientPhone && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-[var(--color-border)]" />
                            <div className="flex items-center gap-1.5">
                              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="var(--color-text-muted)" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              <span className="text-xs text-[var(--color-text-muted)] font-medium">{appt.clientPhone}</span>
                            </div>
                          </>
                        )}
                        {appt.priceSnapshot && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-[var(--color-border)]" />
                            <span className="text-sm font-extrabold text-[var(--color-accent)]">
                              ${Number(appt.priceSnapshot).toLocaleString("es-AR")}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  {(appt.status === "pending" || appt.status === "confirmed") && (
                    <div
                      className="flex gap-3 px-6 py-4"
                      style={{ borderTop: "1.5px solid var(--color-border)", background: "var(--color-bg)" }}
                    >
                      {appt.status === "pending" && (
                        <form action={confirmAppointment.bind(null, appt.id)} className="flex-1">
                          <button
                            type="submit"
                            className="w-full h-11 rounded-2xl font-bold text-white text-sm transition-all hover:shadow-md"
                            style={{
                              background: "linear-gradient(135deg, #059669, #047857)",
                              boxShadow: "0 2px 8px rgba(5,150,105,0.3)",
                            }}
                          >
                            ✓ Confirmar turno
                          </button>
                        </form>
                      )}
                      <form action={cancelAppointment.bind(null, appt.id)} className="flex-1">
                        <button
                          type="submit"
                          className="w-full h-11 rounded-2xl text-sm font-bold transition-all hover:bg-red-50 hover:text-[var(--color-error)] hover:border-red-200"
                          style={{ border: "1.5px solid var(--color-border)", color: "var(--color-text-muted)", background: "white" }}
                        >
                          Cancelar
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
