// Instant skeleton on every owner-dashboard navigation (the sidebar persists from the layout).
export default function Loading() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-6 lg:px-8 lg:py-8">
      <div className="h-7 w-40 animate-pulse rounded-md bg-line" />
      <div className="mt-2 h-4 w-52 animate-pulse rounded bg-line/70" />
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-[88px] animate-pulse rounded-card border border-line bg-surface" />
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="h-72 animate-pulse rounded-card border border-line bg-surface" />
        <div className="h-72 animate-pulse rounded-card border border-line bg-surface" />
      </div>
    </main>
  );
}
