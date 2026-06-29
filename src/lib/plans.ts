// Plan feature gates, docs/architecture.md §10. Enforced on the SERVER, never trust the UI.

export type Plan = "starter" | "growth" | "premium";

// Item caps. Docs specify starter=40, premium=unlimited; "growth = more items" has no
// number in the docs, so 200 is a chosen default (adjust if the spec firms up).
export const ITEM_CAPS: Record<Plan, number> = {
  starter: 40,
  growth: 200,
  premium: Infinity,
};

export function itemCap(plan: string): number {
  return ITEM_CAPS[(plan as Plan) in ITEM_CAPS ? (plan as Plan) : "starter"];
}

// Monthly plan prices in USD, finance.md §1.
export const PLAN_PRICES: Record<Plan, number> = { starter: 99, growth: 249, premium: 499 };

export function planPrice(plan: string): number {
  return PLAN_PRICES[(plan as Plan) in PLAN_PRICES ? (plan as Plan) : "starter"];
}

// Custom domain is a growth/premium feature (architecture §10).
export function allowsCustomDomain(plan: string): boolean {
  return plan === "growth" || plan === "premium";
}

// One-time setup fee per plan (finance.md §1).
export const PLAN_SETUP: Record<Plan, number> = { starter: 199, growth: 299, premium: 499 };

// Plan inclusions — single source of truth, mirrors finance.md §1 (+ the Plato Card perk
// on Premium). Consumed by the owner Billing page so the feature lists never drift.
export const PLAN_META: Record<Plan, { annual: number; features: string[] }> = {
  starter: {
    annual: 990,
    features: ["Online menu page", "Info & action buttons", "On-site photo & video capture", "English & Spanish", "1 QR code stand", "Basic analytics", "Up to 40 items"],
  },
  growth: {
    annual: 2490,
    features: ["Everything in Starter", "Full video menu", "Advanced analytics", "NFC + QR sticker pack", "Window decal", "Custom domain"],
  },
  premium: {
    annual: 4990,
    features: ["Everything in Growth", "Unlimited items", "Discovery feature spot", "Priority support", "Flyer design", "Quarterly re-shoot", "Full hardware kit", "1 free Plato Card blast / mo"],
  },
};

export function planFeatures(plan: string): string[] {
  return PLAN_META[(plan as Plan) in PLAN_META ? (plan as Plan) : "starter"].features;
}

// À-la-carte add-on prices now live in the editable `billing_services` catalog (admin
// Billing → Manage services). Only the two plan-derived line types stay in code, since
// their amount comes from the tenant's plan (PLAN_PRICES / PLAN_SETUP), not the catalog.
export const DERIVED_LINE_TYPES = [
  { key: "subscription", label: "Subscription (monthly)" },
  { key: "setup", label: "Setup fee" },
] as const;
