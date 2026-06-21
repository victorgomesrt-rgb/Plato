import { readFile } from "node:fs/promises";
import { join } from "node:path";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { PlatoMark } from "@/components/plato-logo";

const C: Components = {
  h1: ({ children }) => <h1 className="font-display text-3xl font-bold text-ink">{children}</h1>,
  h2: ({ children }) => <h2 className="mt-7 font-display text-lg font-semibold text-ink">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-4 font-semibold text-ink">{children}</h3>,
  p: ({ children }) => <p className="mt-3 text-sm leading-relaxed text-muted">{children}</p>,
  ul: ({ children }) => <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">{children}</ul>,
  ol: ({ children }) => <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ href, children }) => <a href={href} className="text-accent underline">{children}</a>,
  strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
  hr: () => <hr className="my-6 border-line" />,
  code: ({ children }) => <code className="rounded bg-line px-1 py-0.5 text-[0.85em] text-ink">{children}</code>,
  blockquote: ({ children }) => (
    <blockquote className="mt-4 rounded-card border-l-4 border-citrus bg-citrus/10 p-3 text-sm text-ink [&_p]:mt-1 [&_p]:text-ink [&_strong]:text-ink">{children}</blockquote>
  ),
};

export async function LegalDoc({ file }: { file: string }) {
  const md = await readFile(join(process.cwd(), "docs/legal", file), "utf8");
  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3">
          <Link href="/" className="flex items-center gap-2">
            <PlatoMark className="h-6 w-auto" />
            <span className="font-display font-extrabold text-ink">Plato</span>
          </Link>
          <Link href="/" className="text-sm text-muted hover:text-ink">← Home</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-10">
        <article><ReactMarkdown components={C}>{md}</ReactMarkdown></article>
        <p className="mt-10 border-t border-line pt-4 text-xs text-muted">
          Plato is operated by GMS Innovations, Aruba. Questions: adrian@platodigital.online
        </p>
      </main>
    </div>
  );
}
