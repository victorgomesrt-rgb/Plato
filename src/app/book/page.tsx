import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BookForm } from "./book-form";

export const metadata: Metadata = {
  title: "Book a free demo",
  description:
    "Tell us about your restaurant. We'll confirm a capture time and have your filmed video menu live before your next dinner service.",
  alternates: { canonical: "/book" },
};

export default function BookPage() {
  return (
    <div className="min-h-screen bg-ink text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/brand/plato-appicon.png" alt="" width={28} height={28} className="h-7 w-7 rounded-lg" />
            <span className="font-display font-extrabold">Plato</span>
          </Link>
          <Link href="/login" className="text-sm text-white/70 hover:text-white">Log in</Link>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent/25 blur-[110px]" />
        <div className="mx-auto max-w-5xl px-5 py-12">
          <Link href="/" className="text-sm text-white/60 hover:text-white">← Back to home</Link>
          <h1 className="mt-3 font-display text-4xl font-extrabold leading-tight sm:text-5xl">Book your free demo.</h1>
          <p className="mt-3 max-w-xl text-white/70">
            Tell us about your restaurant. We&apos;ll confirm a capture time this week and have your filmed
            menu live before your next dinner service.
          </p>
          <div className="mt-8">
            <BookForm />
          </div>
          <p className="mt-6 text-sm text-white/50">Join restaurants already live on Plato.</p>
        </div>
      </section>
    </div>
  );
}
