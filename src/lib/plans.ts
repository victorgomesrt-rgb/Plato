// Plan feature gates — docs/architecture.md §10. Enforced on the SERVER, never trust the UI.

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

// Custom domain is a growth/premium feature (architecture §10).
export function allowsCustomDomain(plan: string): boolean {
  return plan === "growth" || plan === "premium";
}
