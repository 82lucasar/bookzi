import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getMyBusiness } from "@/lib/actions/business"
import { getAppointments, confirmAppointment, cancelAppointment } from "@/lib/actions/appointments"

const STATUS_LABELS: Record<string, { label: string; classes: string }> = {
  pending:   { label: "Pendiente",  classes: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  confirmed: { label: "Confirmado", classes: "bg-green-50 text-green-700 border-green-200" },
  completed: { label: "Completado", classes: "bg-[var(--color-bg)] text-[var(--color-text-muted)] border-[var(--color-border)]" },
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("es-AR", {
    weekday: "short", day: "numeric", month: "short",
  })
}

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString("es-AR", {
    hour: "2-digit", minute: "2-digit",
  })
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
  const filter: Filter = (rawFilter === "today" || rawFilter === "past") ? rawFilter : "upcoming"

  const apptList = await getAppointments(filter)

  const tabs: { label: string; value: Filter }[] = [
    { label: "Próximos", value: "upcoming" },
    { label: "Hoy", value: "today" },
    { label: "Anteriores", value: "past" },
  ]

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <header className="bg-white border-b border-[var(--color-border)] px-6 py-4 flex items-center gap-3">
        <a href="/dashboard" className="text-xl font-extrabold text-[var(--color-primary)]">Bookzi</a>
        <span className="text-[var(--color-border)]">/</span>
        <span className="text-sm font-medium text-[var(--color-text-dark)]">Turnos</span>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-[var(--color-text-dark)] mb-5">Turnos</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-[var(--color-border)] rounded-xl p-1 mb-6 w-fit">
          {tabs.map((tab) => (
            <a
              key={tab.value}
              href={`/dashboard/appointments?filter=${tab.value}`}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === tab.value
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-dark)]"
              }`}
            >
              {tab.label}
            </a>
          ))}
        </div>

        {apptList.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[var(--color-border)] p-12 text-center">
            <p className="text-[var(--color-text-muted)]">
              {filter === "today" ? "No hay turnos para hoy." : filter === "past" ? "Sin turnos anteriores." : "No hay turnos próximos."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {apptList.map((appt) => {
              const statusInfo = STATUS_LABELS[appt.status] ?? STATUS_LABELS.pending!
              return (
                <div
                  key={appt.id}
                  className="bg-white rounded-2xl border border-[var(--color-border)] px-6 py-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Fecha y hora */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-[var(--color-primary)]">
                          {formatDate(appt.startAt)}
                        </span>
                        <span className="text-sm text-[var(--color-text-muted)]">
                          {formatTime(appt.startAt)} – {formatTime(appt.endAt)}
                        </span>
                      </div>

                      {/* Servicio y cliente */}
                      <p className="font-semibold text-[var(--color-text-dark)] truncate">
                        {appt.serviceName}
                      </p>
                      <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
                        {appt.clientName}
                        {appt.clientPhone && ` · ${appt.clientPhone}`}
                      </p>

                      {/* Precio */}
                      {appt.priceSnapshot && (
                        <p className="text-sm font-medium text-[var(--color-accent)] mt-1">
                          $ {Number(appt.priceSnapshot).toLocaleString("es-AR")}
                        </p>
                      )}
                    </div>

                    {/* Status badge */}
                    <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full border ${statusInfo.classes}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* Acciones */}
                  {(appt.status === "pending" || appt.status === "confirmed") && (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-[var(--color-border)]">
                      {appt.status === "pending" && (
                        <form action={confirmAppointment.bind(null, appt.id)} className="flex-1">
                          <button
                            type="submit"
                            className="w-full h-9 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold hover:bg-emerald-600 transition-colors"
                          >
                            Confirmar
                          </button>
                        </form>
                      )}
                      <form action={cancelAppointment.bind(null, appt.id)} className="flex-1">
                        <button
                          type="submit"
                          className="w-full h-9 rounded-lg border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-muted)] hover:border-[var(--color-error)] hover:text-[var(--color-error)] transition-colors"
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
      </main>
    </div>
  )
}
