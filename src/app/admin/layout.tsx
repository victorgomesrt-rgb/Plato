import { notFound } from "next/navigation";
import { currentAdmin } from "@/lib/admin-auth";
import { AdminSidebar } from "@/components/admin-sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await currentAdmin();
  if (!admin) notFound();
  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <AdminSidebar email={admin.email ?? ""} />
      <div className="md:pl-60">{children}</div>
    </div>
  );
}
