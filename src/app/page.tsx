import Image from "next/image";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <Image
        src="/brand/plato-lockup.png"
        alt="Plato"
        width={220}
        height={64}
        priority
        className="h-auto w-[200px]"
      />
      <h1 className="font-display text-2xl font-semibold text-ink">
        Video menus for Caribbean restaurants
      </h1>
      <p className="max-w-md text-muted">
        Scan, watch the food, decide. The marketing site and dashboard are under
        construction.
      </p>
      <span className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-white">
        Building
      </span>
    </main>
  );
}
