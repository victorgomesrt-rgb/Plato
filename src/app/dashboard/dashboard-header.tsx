import Link from "next/link";
import { Eye, MessageSquare } from "lucide-react";

// Shared owner-dashboard page header: title + subtitle on the left, the two
// standing actions (View live menu / Request a change) on the right. Matches the
// mockup, which repeats this header on every owner screen.
export function DashboardHeader({ title, subtitle, slug }: { title: string; subtitle: string; slug: string }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">{title}</h1>
        <p className="text-sm text-muted">{subtitle}</p>
      </div>
      <div className="flex gap-2">
        <a href={`/${slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-btn border border-line bg-surface px-3 py-2 text-sm font-medium text-ink hover:border-ink/20">
          <Eye className="h-4 w-4" />View live menu
        </a>
        <Link href="/dashboard/requests" className="inline-flex items-center gap-2 rounded-btn bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-deep">
          <MessageSquare className="h-4 w-4" />Request a change
        </Link>
      </div>
    </div>
  );
}
