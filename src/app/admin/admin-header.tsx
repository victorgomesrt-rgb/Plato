import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminSearch } from "./search";

// Shared admin top bar: page title/subtitle (left) + tenant search + New client (right),
// matching the consistent header across the mockup's admin views.
export function AdminHeader({
  title,
  subtitle,
  tenants,
  showNewClient = true,
}: {
  title: string;
  subtitle: string;
  tenants: { name: string; slug: string; plan: string }[];
  showNewClient?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="mr-auto">
        <h1 className="font-display text-2xl font-bold text-ink">{title}</h1>
        <p className="text-sm text-muted">{subtitle}</p>
      </div>
      <AdminSearch tenants={tenants} />
      {showNewClient && (
        <Link href="/admin/new-client" className="inline-flex shrink-0 items-center gap-1.5 rounded-btn bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-deep">
          <Plus className="h-4 w-4" /> New client
        </Link>
      )}
    </div>
  );
}
