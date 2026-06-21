// Plato brand mark: a letter P whose counter holds a play triangle (design.md §1a).
// Vector + transparent; the P uses currentColor (ink on light, white on dark),
// the play triangle is always Plato Orange.

export function PlatoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11 4h11a11 11 0 0 1 0 22h-6v8a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm5 8v8h6a4 4 0 0 0 0-8h-6Z"
        fill="currentColor"
      />
      <path d="M17.5 12.9 24 16l-6.5 3.1V12.9Z" fill="#FB6A1A" />
    </svg>
  );
}

export function PlatoLogo({ className, mark = "h-7 w-7", text = "text-lg" }: { className?: string; mark?: string; text?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <PlatoMark className={mark} />
      <span className={`font-display font-extrabold tracking-tight ${text}`}>Plato</span>
    </span>
  );
}
