import "server-only";

// PassBuddy (Apple Wallet) API wrapper. Server-only — the keys must never reach the
// client. Every call returns a Result so a PassBuddy outage never throws into a render.
// Docs + findings: docs/plato-card.md.

const BASE = "https://www.passbuddy.xyz";

export type PbResult<T = unknown> = { ok: true; data: T } | { ok: false; error: string };

function headers() {
  return {
    "X-User-Id": process.env.PASSBUDDY_USER_ID ?? "",
    "X-API-Key": process.env.PASSBUDDY_API_KEY ?? "",
    "Content-Type": "application/json",
  };
}

// Friendlier text for the documented error codes.
const FRIENDLY: Record<string, string> = {
  UNAUTHORIZED: "Wallet service auth failed (check PassBuddy keys).",
  PASS_LIMIT_EXCEEDED: "PassBuddy pass limit reached. Upgrade the plan.",
  NOTIFICATION_LIMIT_EXCEEDED: "Monthly notification limit reached. Upgrade the plan or wait for the reset.",
  FORBIDDEN: "No access to that pass.",
  PASS_NOT_FOUND: "That pass no longer exists.",
};

async function call<T>(path: string, init: RequestInit): Promise<PbResult<T>> {
  try {
    const res = await fetch(`${BASE}${path}`, { ...init, headers: headers(), cache: "no-store" });
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      const code = String(body.error ?? "");
      return { ok: false, error: FRIENDLY[code] ?? (body.message as string) ?? `Wallet service error (${res.status}).` };
    }
    return { ok: true, data: body as T };
  } catch {
    return { ok: false, error: "Could not reach the wallet service." };
  }
}

export type CreatedPass = { passId: string; slug: string; serialNumber: string; passShareId: string };

export function createPass(input: Record<string, unknown>) {
  return call<CreatedPass>("/api/v1/passes", { method: "POST", body: JSON.stringify(input) });
}

export function updatePass(passId: string, fields: Record<string, unknown>) {
  return call<{ passId: string; updated: string[] }>(`/api/v1/passes/${passId}`, { method: "PATCH", body: JSON.stringify(fields) });
}

// Push to every device that installed the pass. scheduledAt = ISO 8601 (sends now if omitted).
export function notify(passId: string, message: string, scheduledAt?: string) {
  return call<{ messageId: string; status: string }>(`/api/v1/passes/${passId}/notify`, {
    method: "POST",
    body: JSON.stringify(scheduledAt ? { message, scheduledAt } : { message }),
  });
}

// Public "Add to Apple Wallet" / share page for a pass (the API never returns this URL).
export function passShareUrl(shareId: string) {
  return `${BASE}/share/pass/${shareId}`;
}
