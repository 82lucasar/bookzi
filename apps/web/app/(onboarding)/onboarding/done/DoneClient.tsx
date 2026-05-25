"use client"

import { useEffect, useRef, useState } from "react"

interface Props { slug: string }

const CONFETTI_COLORS = ["#0284C7", "#38BDF8", "#059669", "#34D399", "#F59E0B"]

export default function DoneClient({ slug }: Props) {
  const confettiRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://bookzi-three.vercel.app").replace(/\/$/, "")
  const bookingUrl = `${appUrl}/book/${slug}`
  const displayUrl = bookingUrl.replace(/^https?:\/\//, "")

  useEffect(() => {
    const container = confettiRef.current
    if (!container) return
    for (let i = 0; i < 50; i++) {
      const el = document.createElement("div")
      el.className = "confetti-piece"
      el.style.cssText = `
        left: ${Math.random() * 100}%;
        top: -10px;
        background: ${CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]};
        width: ${6 + Math.random() * 6}px;
        height: ${6 + Math.random() * 6}px;
        animation-duration: ${1.5 + Math.random() * 2}s;
        animation-delay: ${Math.random() * 0.8}s;
        border-radius: ${Math.random() > 0.5 ? "50%" : "2px"};
      `
      container.appendChild(el)
    }
  }, [])

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(bookingUrl) } catch {}
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareLink = () => {
    if (navigator.share) {
      navigator.share({ url: bookingUrl, title: "Reservá tu turno" })
    } else {
      copyLink()
    }
  }

  return (
    <>
      <div className="confetti-wrap" ref={confettiRef} />
      <div className="success-screen" style={{ position: "relative", zIndex: 1 }}>
        <div className="check-anim">
          <svg viewBox="0 0 80 80" fill="none">
            <circle className="check-circle" cx="40" cy="40" r="34" stroke="#059669" strokeWidth="5" fill="none" strokeLinecap="round"/>
            <path className="check-tick" d="M25 40l10 10 20-20" stroke="#059669" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
        </div>

        <h1 className="success-title">¡Tu agenda está lista!</h1>
        <p className="success-body">Compartí tu link de reservas con tus clientes y empezá a recibir turnos de inmediato.</p>

        <div className="link-box">
          <span className="link-url">{displayUrl}</span>
          <button className={`copy-btn${copied ? " copied" : ""}`} onClick={copyLink}>
            {copied ? "¡Copiado!" : "Copiar"}
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 360 }}>
          <a href="/dashboard">
            <button className="btn btn-primary btn-full btn-lg">Ir a mi agenda</button>
          </a>
          <button className="btn btn-secondary btn-full" onClick={shareLink}>
            Compartir link
          </button>
        </div>
      </div>
    </>
  )
}
