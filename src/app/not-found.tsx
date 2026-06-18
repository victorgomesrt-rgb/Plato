import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
      <Image
        src="/brand/plato-mark.png"
        alt="Plato"
        width={56}
        height={56}
        className="h-14 w-14"
      />
      <h1 className="font-display text-2xl font-semibold text-ink">Page not found</h1>
      <p className="max-w-sm text-muted">
        This page doesn’t exist, or the menu isn’t live yet.
      </p>
      <Link
        href="/"
        className="rounded-btn bg-accent px-5 py-2.5 text-sm font-medium text-white"
      >
        Go to Plato
      </Link>
    </main>
  );
}
