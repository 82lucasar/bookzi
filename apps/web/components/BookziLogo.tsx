export function BookziIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="16" width="52" height="46" rx="10" fill="#0284C7"/>
      <rect x="10" y="16" width="52" height="18" rx="10" fill="#0369A1"/>
      <rect x="10" y="26" width="52" height="8" fill="#0369A1"/>
      <rect x="24" y="10" width="5" height="14" rx="2.5" fill="#334155"/>
      <rect x="43" y="10" width="5" height="14" rx="2.5" fill="#334155"/>
      <path d="M24 44 L32 52 L50 34" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function BookziIconWhite({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="16" width="52" height="46" rx="10" fill="white" opacity="0.95"/>
      <rect x="10" y="16" width="52" height="18" rx="10" fill="#E0F0F8"/>
      <rect x="10" y="26" width="52" height="8" fill="#E0F0F8"/>
      <rect x="24" y="10" width="5" height="14" rx="2.5" fill="white" opacity="0.6"/>
      <rect x="43" y="10" width="5" height="14" rx="2.5" fill="white" opacity="0.6"/>
      <path d="M24 44 L32 52 L50 34" stroke="#0284C7" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function BookziWordmark({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className ?? ""}`}>
      <BookziIcon size={28} />
      <span className="font-extrabold text-[#0F172A] tracking-tight" style={{ fontSize: 20, letterSpacing: "-0.5px" }}>
        Book<span className="text-[#0284C7]">zi</span>
      </span>
    </div>
  )
}

export function BookziWordmarkWhite({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className ?? ""}`}>
      <BookziIconWhite size={28} />
      <span className="font-extrabold text-white tracking-tight" style={{ fontSize: 20, letterSpacing: "-0.5px" }}>
        Bookzi
      </span>
    </div>
  )
}
