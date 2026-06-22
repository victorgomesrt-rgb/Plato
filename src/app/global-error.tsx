"use client";

// Catches errors in the root layout itself (where error.tsx can't reach). It replaces
// the whole document, so it ships its own html/body and inline styles (no Tailwind here).
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "Inter, system-ui, sans-serif", margin: 0, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#FB6A1A" }}>Plato</div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "#16110E", marginTop: 12 }}>Something went wrong</h1>
          <p style={{ color: "#6B6660", marginTop: 8 }}>Please refresh the page to try again.</p>
          <button onClick={() => reset()} style={{ marginTop: 16, background: "#FB6A1A", color: "#fff", border: 0, borderRadius: 12, padding: "10px 20px", fontWeight: 500, cursor: "pointer" }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
