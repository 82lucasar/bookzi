import { notFound } from "next/navigation"
import { getReviewByToken, submitReview } from "@/lib/actions/reviews"

const TZ = "America/Argentina/Buenos_Aires"

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("es-AR", {
    weekday: "long", day: "numeric", month: "long", timeZone: TZ,
  })
}

const STAR_LABELS = ["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"]

export default async function ReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ rating?: string }>
}) {
  const { token }   = await params
  const { rating: ratingParam } = await searchParams

  const review = await getReviewByToken(token)
  if (!review) notFound()

  const preSelected = ratingParam ? Math.min(5, Math.max(1, parseInt(ratingParam, 10))) : null

  return (
    <div style={{ background: "var(--bg)", minHeight: "100dvh", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0369A1, #0284C7)", padding: "24px 20px 32px", textAlign: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: "white", marginBottom: 4 }}>Bookzi</div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.8)" }}>Reseña de tu experiencia</div>
      </div>

      <div style={{ flex: 1, padding: "24px 20px 60px", maxWidth: 440, margin: "0 auto", width: "100%" }}>

        {/* Info del turno */}
        <div style={{
          background: "white", borderRadius: 16, border: "1.5px solid var(--border)",
          padding: "16px", marginBottom: 20,
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-dark)", marginBottom: 4 }}>
            {review.serviceName}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {review.bizName} · {fmtDate(review.startAt)}
          </div>
        </div>

        {/* Ya respondió */}
        {review.submittedAt ? (
          <div style={{
            background: "white", borderRadius: 20, border: "1.5px solid #D1FAE5",
            padding: "40px 24px", textAlign: "center",
          }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🙌</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-dark)", marginBottom: 8 }}>
              ¡Gracias por tu reseña!
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 8 }}>
              {[1, 2, 3, 4, 5].map(n => (
                <span key={n} style={{ fontSize: 28, opacity: n <= (review.rating ?? 0) ? 1 : 0.2 }}>⭐</span>
              ))}
            </div>
            {review.comment && (
              <p style={{ fontSize: 14, color: "var(--text-muted)", fontStyle: "italic", margin: 0 }}>
                "{review.comment}"
              </p>
            )}
          </div>
        ) : (
          <form action={submitReview.bind(null, token)}>
            <div style={{
              background: "white", borderRadius: 20, border: "1.5px solid var(--border)",
              padding: "28px 20px",
            }}>
              <p style={{ fontSize: 17, fontWeight: 800, color: "var(--text-dark)", textAlign: "center", margin: "0 0 8px" }}>
                ¿Cómo fue tu experiencia?
              </p>
              <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", margin: "0 0 24px" }}>
                Hola <strong>{review.clientName}</strong>, tu opinión ayuda mucho.
              </p>

              {/* Estrellas interactivas */}
              <StarPicker defaultValue={preSelected ?? 0} />

              {/* Comentario opcional */}
              <textarea
                name="comment"
                placeholder="Contanos tu experiencia (opcional)..."
                rows={3}
                style={{
                  width: "100%", border: "1.5px solid var(--border)", borderRadius: 12,
                  padding: "12px 14px", fontSize: 14, fontFamily: "inherit",
                  color: "var(--text-dark)", background: "#FAFAFA", resize: "vertical",
                  outline: "none", boxSizing: "border-box", marginTop: 16,
                }}
              />

              <button
                type="submit"
                style={{
                  width: "100%", marginTop: 16, padding: "14px",
                  background: "var(--primary)", color: "white", border: "none",
                  borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer",
                }}
              >
                Enviar reseña
              </button>
            </div>
          </form>
        )}

        <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)", marginTop: 20 }}>
          Reservas gestionadas por <strong style={{ color: "var(--primary)" }}>Bookzi</strong>
        </p>
      </div>
    </div>
  )
}

function StarPicker({ defaultValue }: { defaultValue: number }) {
  return (
    <>
      <input type="hidden" name="rating" id="rating-value" defaultValue={defaultValue || ""} />
      <style>{`
        .stars { display:flex; justify-content:center; gap:8px; margin-bottom:4px; }
        .star-btn { background:none; border:none; font-size:40px; cursor:pointer; opacity:0.25; transition:opacity 120ms, transform 120ms; padding:0; }
        .star-btn.active { opacity:1; transform:scale(1.1); }
        .star-label { text-align:center; font-size:13px; font-weight:600; color:var(--primary); height:20px; }
      `}</style>
      <div className="stars" id="star-container">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n} type="button"
            className={`star-btn${n <= defaultValue ? " active" : ""}`}
            data-value={n}
            onClick={undefined}
          >⭐</button>
        ))}
      </div>
      <div className="star-label" id="star-label">
        {defaultValue > 0 ? STAR_LABELS[defaultValue] : ""}
      </div>
      <script dangerouslySetInnerHTML={{ __html: `
        const btns = document.querySelectorAll('.star-btn');
        const input = document.getElementById('rating-value');
        const label = document.getElementById('star-label');
        const labels = ['','Muy malo','Malo','Regular','Bueno','Excelente'];
        btns.forEach(btn => {
          btn.addEventListener('click', () => {
            const v = parseInt(btn.dataset.value);
            input.value = v;
            label.textContent = labels[v];
            btns.forEach((b,i) => b.classList.toggle('active', i < v));
          });
        });
      `}} />
    </>
  )
}
