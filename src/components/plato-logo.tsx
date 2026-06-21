// Plato brand mark (the real artwork). Dark "P" + orange play triangle, transparent.
// On dark backgrounds pass `onDark` to use the reversed (white) mark, design.md §1a.

export function PlatoMark({ className, onDark = false }: { className?: string; onDark?: boolean }) {
  const src = onDark ? "/brand/plato-mark-white.png" : "/brand/plato-mark.png";
  // Plain <img>: tiny static asset, sized by height with width auto to keep the ratio.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="Plato" className={className} />;
}

export function PlatoLogo({ className, mark = "h-7 w-auto", text = "text-lg", onDark = false }: { className?: string; mark?: string; text?: string; onDark?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <PlatoMark className={mark} onDark={onDark} />
      <span className={`font-display font-extrabold tracking-tight ${text}`}>Plato</span>
    </span>
  );
}
