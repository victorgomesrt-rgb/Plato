"use server";

import { revalidatePath } from "next/cache";
import { currentAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/passbuddy";

type Result = { ok: true } | { ok: false; error: string };

const WEEKLY_CAP = 7;        // Plato's own network blasts per week (paid promos are exempt).
const BLAST_PRICE = 75;      // per promoted blast, docs/plato-card.md §13.

const arubaYear = () => Number(new Intl.DateTimeFormat("en-US", { year: "numeric", timeZone: "America/Aruba" }).format(new Date()));

async function platoPassId(svc: ReturnType<typeof createAdminClient>): Promise<string | null> {
  const { data } = await svc.from("wallet_passes").select("passbuddy_pass_id").eq("kind", "plato_card").maybeSingle();
  return (data as { passbuddy_pass_id: string } | null)?.passbuddy_pass_id ?? null;
}

async function sentLast7Days(svc: ReturnType<typeof createAdminClient>): Promise<number> {
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { count } = await svc.from("wallet_blasts").select("id", { count: "exact", head: true }).eq("status", "sent").gte("sent_at", since);
  return count ?? 0;
}

// Admin-authored network blast to every Plato member (now or scheduled).
export async function sendNetworkBlast(message: string, scheduledAt?: string): Promise<Result> {
  const admin = await currentAdmin();
  if (!admin) return { ok: false, error: "Not authorized" };
  const text = message.trim();
  if (!text) return { ok: false, error: "Write a message first." };

  const svc = createAdminClient();
  const sendNow = !scheduledAt;
  if (sendNow && (await sentLast7Days(svc)) >= WEEKLY_CAP)
    return { ok: false, error: `Weekly cap reached (${WEEKLY_CAP}). Schedule it for next week to protect the diner experience.` };

  const passId = await platoPassId(svc);
  if (!passId) return { ok: false, error: "The Plato Card isn't set up yet." };

  const res = await notify(passId, text, scheduledAt);
  if (!res.ok) return { ok: false, error: res.error };

  await svc.from("wallet_blasts").insert({
    tenant_id: null, message: text,
    status: scheduledAt ? "scheduled" : "sent",
    scheduled_at: scheduledAt ?? null,
    sent_at: scheduledAt ? null : new Date().toISOString(),
    passbuddy_message_id: res.data.messageId,
  });
  revalidatePath("/admin/plato-card");
  return { ok: true };
}

// Approve a restaurant's promo request → push it + raise the invoice.
export async function approveBlast(id: string): Promise<Result> {
  const admin = await currentAdmin();
  if (!admin) return { ok: false, error: "Not authorized" };
  const svc = createAdminClient();

  const { data: blast } = await svc.from("wallet_blasts").select("id, tenant_id, message, status").eq("id", id).maybeSingle();
  const b = blast as { id: string; tenant_id: string | null; message: string; status: string } | null;
  if (!b || b.status !== "requested") return { ok: false, error: "That request is no longer open." };

  const passId = await platoPassId(svc);
  if (!passId) return { ok: false, error: "The Plato Card isn't set up yet." };
  const res = await notify(passId, b.message);
  if (!res.ok) return { ok: false, error: res.error };

  // Raise the blast invoice (PLATO-YYYY-NNNN, retry on collision).
  let invoiceId: string | null = null;
  if (b.tenant_id) {
    const year = arubaYear();
    const { count } = await svc.from("invoices").select("id", { count: "exact", head: true }).like("number", `PLATO-${year}-%`);
    for (let seq = (count ?? 0) + 1, attempt = 0; attempt < 5; seq++, attempt++) {
      const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Aruba" }).format(new Date());
      const { data: inv, error } = await svc.from("invoices").insert({
        tenant_id: b.tenant_id, number: `PLATO-${year}-${String(seq).padStart(4, "0")}`,
        amount: BLAST_PRICE, currency: "USD", description: "Promoted special · wallet blast",
        method: "manual", status: "sent", period_start: today, period_end: today, due_date: today, sent_at: new Date().toISOString(),
      }).select("id").maybeSingle();
      if (!error) { invoiceId = (inv as { id: string } | null)?.id ?? null; break; }
      if (error.code !== "23505") break;
    }
  }

  await svc.from("wallet_blasts").update({
    status: "sent", sent_at: new Date().toISOString(), passbuddy_message_id: res.data.messageId, invoice_id: invoiceId, price: BLAST_PRICE,
  }).eq("id", id);
  revalidatePath("/admin/plato-card");
  revalidatePath("/admin/billing");
  return { ok: true };
}

export async function declineBlast(id: string): Promise<Result> {
  if (!(await currentAdmin())) return { ok: false, error: "Not authorized" };
  const svc = createAdminClient();
  await svc.from("wallet_blasts").update({ status: "declined" }).eq("id", id).eq("status", "requested");
  revalidatePath("/admin/plato-card");
  return { ok: true };
}
