import { notFound } from "next/navigation";
import { currentAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminSidebar } from "@/components/admin-sidebar";
import { Toaster } from "@/components/toast";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await currentAdmin();
  if (!admin) notFound();
  const { count } = await createAdminClient()
    .from("change_requests").select("id", { count: "exact", head: true }).neq("status", "done");
  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <AdminSidebar email={admin.email ?? ""} requestCount={count ?? 0} />
      <div className="md:pl-60">{children}</div>
      <Toaster />
    </div>
  );
}
