import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { currentAdmin } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { itemCap } from "@/lib/plans";
import { MenuEditor } from "./menu-editor";
import { TemplatePicker } from "./template-picker";
import { TenantControls } from "./tenant-controls";
import { ReviewCardPanel } from "./review-card-panel";

export const metadata: Metadata = { title: "Manage menu", robots: { index: false } };

export default async function ManageTenantPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!(await currentAdmin())) notFound();

  const supabase = await createClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, slug, name, plan, status, published_at, base_currency, fx_rate, template, review_url, review_active, review_paid_through, review_only")
    .eq("slug", slug)
    .maybeSingle();
  if (!tenant) notFound();

  const { data: reviewLink } = await createAdminClient()
    .from("short_links")
    .select("code")
    .eq("tenant_id", tenant.id)
    .eq("kind", "review")
    .limit(1);

  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase
      .from("menu_categories")
      .select("id, name, name_i18n, is_visible, sort_order")
      .eq("tenant_id", tenant.id)
      .order("sort_order"),
    supabase
      .from("menu_items")
      .select(
        "id, category_id, name, name_i18n, description, description_i18n, price, price_text, tags, is_available, is_featured, image_url, video_status, video_thumb_url, sort_order"
      )
      .eq("tenant_id", tenant.id)
      .order("sort_order"),
  ]);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <Link href="/admin" className="text-sm text-muted hover:text-ink">
        ← Admin
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">{tenant.name}</h1>
          <p className="text-sm capitalize text-muted">
            {tenant.review_only ? (
              <>/{tenant.slug} · review-only client</>
            ) : (
              <>/{tenant.slug} · {tenant.plan} · {tenant.status === "past_due" ? "past due" : tenant.status}{tenant.published_at ? " · live" : ""}</>
            )}
          </p>
        </div>
        {!tenant.review_only && (
          <div className="flex items-center gap-3 text-sm">
            <form action="/admin/impersonate" method="post">
              <input type="hidden" name="tenant_id" value={tenant.id} />
              <button type="submit" className="font-medium text-accent">View as owner</button>
            </form>
            <Link href={`/admin/tenants/${tenant.slug}/qr`} className="font-medium text-accent">
              QR codes
            </Link>
            <Link href={`/${tenant.slug}`} className="text-accent underline">
              Preview
            </Link>
          </div>
        )}
      </div>

      <TenantControls tenantId={tenant.id} slug={tenant.slug} plan={tenant.plan} status={tenant.status} />

      <ReviewCardPanel
        tenantId={tenant.id}
        slug={tenant.slug}
        site={process.env.NEXT_PUBLIC_SITE_URL ?? "https://platodigital.io"}
        reviewUrl={tenant.review_url ?? null}
        reviewActive={tenant.review_active ?? false}
        reviewPaidThrough={tenant.review_paid_through ?? null}
        reviewCode={reviewLink?.[0]?.code ?? null}
      />

      {!tenant.review_only && (
        <>
          <div className="mt-3">
            <TemplatePicker tenantId={tenant.id} current={tenant.template ?? "grid"} />
          </div>

          <MenuEditor
            tenant={tenant}
            categories={categories ?? []}
            items={items ?? []}
            cap={itemCap(tenant.plan)}
          />
        </>
      )}
    </main>
  );
}
