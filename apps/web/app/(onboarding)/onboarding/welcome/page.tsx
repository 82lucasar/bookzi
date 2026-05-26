import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function WelcomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const firstName = (user.user_metadata?.full_name || user.user_metadata?.business_name || user.email || "")
    .split(" ")[0]

  return (
    <>
      <style>{`
        body { padding: 0; }
        .hero {
          min-height: 100dvh;
          background: linear-gradient(135deg, #0369A1 0%, #0284C7 50%, #0EA5E9 100%);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          text-align: center; padding: 48px 28px;
          position: relative; overflow: hidden;
        }
        .hero::before {
          content: ''; position: absolute;
          width: 320px; height: 320px; border-radius: 50%;
          background: rgba(255,255,255,0.06);
          top: -80px; right: -80px;
        }
        .hero::after {
          content: ''; position: absolute;
          width: 200px; height: 200px; border-radius: 50%;
          background: rgba(255,255,255,0.04);
          bottom: -40px; left: -40px;
        }
        .w-logo-mark {
          width: 72px; height: 72px; border-radius: 20px;
          background: rgba(255,255,255,0.2);
          display: flex; align-items: center; justify-content: center;
          font-size: 32px; font-weight: 800; color: #fff;
          margin: 0 auto 12px; backdrop-filter: blur(8px);
          border: 2px solid rgba(255,255,255,0.3);
        }
        .w-logo-word { font-size: 24px; font-weight: 800; color: #fff; margin-bottom: 48px; letter-spacing: -0.5px; }
        .w-greeting {
          font-size: clamp(36px, 8vw, 52px);
          font-weight: 800; color: #fff;
          letter-spacing: -1.5px; margin-bottom: 16px; line-height: 1.1;
        }
        .w-subtitle {
          font-size: 17px; color: rgba(255,255,255,0.85); font-weight: 500;
          line-height: 1.5; margin-bottom: 48px; max-width: 300px;
        }
        .w-actions { display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 320px; }
        .w-btn-start {
          width: 100%; padding: 16px; border-radius: 12px;
          background: #fff; color: var(--primary); font-size: 16px; font-weight: 700;
          border: none; cursor: pointer; transition: transform 150ms, filter 150ms;
          font-family: var(--font);
        }
        .w-btn-start:hover { filter: brightness(0.97); }
        .w-btn-start:active { transform: scale(0.97); }
        .w-caption { font-size: 13px; color: rgba(255,255,255,0.6); font-weight: 500; margin-top: 4px; }
      `}</style>

      <div className="hero">
        {/* Botón home esquina superior derecha */}
        <a href="/dashboard" className="logo-home-btn-white" style={{ position: "absolute", top: 20, right: 20, zIndex: 10 }}>B</a>

        <div className="w-logo-mark">B</div>
        <div className="w-logo-word">Bookzi</div>

        <h1 className="w-greeting">Hola, {firstName || "ahí"}</h1>
        <p className="w-subtitle">Configuremos tu agenda en 3 pasos rápidos y empezás a recibir turnos hoy mismo.</p>

        <div className="w-actions">
          <Link href="/dashboard/setup">
            <button className="w-btn-start">Empezar</button>
          </Link>
          <p className="w-caption">Tomá 3 minutos ahora, ganás horas cada semana</p>
        </div>
      </div>
    </>
  )
}
