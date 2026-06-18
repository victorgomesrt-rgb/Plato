"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { checkSlug, provisionClient, type SlugCheck } from "../actions";

const PLANS = [
  { value: "starter", label: "Starter — $99/mo" },
  { value: "growth", label: "Growth — $249/mo" },
  { value: "premium", label: "Premium — $499/mo" },
];

export function NewClientForm() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [plan, setPlan] = useState("starter");
  const [email, setEmail] = useState("");
  const [slugState, setSlugState] = useState<SlugCheck | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Auto-suggest a slug from the name unless the user has typed their own.
  function onName(v: string) {
    setName(v);
    if (!slug || slug === suggestSlug(name)) {
      const s = suggestSlug(v);
      setSlug(s);
      void verifySlug(s);
    }
  }

  async function verifySlug(s: string) {
    if (!s) return setSlugState(null);
    setSlugState(await checkSlug(s));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const res = await provisionClient({ name, slug, plan, email });
      if (res.ok) {
        setResult(
          `✓ Created /${res.slug}. ${
            res.ownerExisted
              ? "Linked to the owner's existing account."
              : "An invite was sent to set their password."
          }`
        );
        setName("");
        setSlug("");
        setEmail("");
        setSlugState(null);
      } else {
        setResult(`✗ ${res.error}`);
      }
    });
  }

  const slugOk = slugState?.available === true;

  return (
    <form onSubmit={onSubmit} className="mt-6 max-w-md space-y-4">
      <div>
        <label className="text-sm font-medium text-ink">Restaurant name</label>
        <input
          required
          value={name}
          onChange={(e) => onName(e.target.value)}
          placeholder="Hung Paradise"
          className="mt-1 w-full rounded-btn border border-line px-3 py-2.5 text-ink outline-none focus:border-accent"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-ink">Menu address</label>
        <div className="mt-1 flex items-center gap-1 rounded-btn border border-line px-3 py-2.5 focus-within:border-accent">
          <span className="text-muted">platodigital.io/</span>
          <input
            required
            value={slug}
            onChange={(e) => {
              const s = e.target.value.toLowerCase();
              setSlug(s);
              void verifySlug(s);
            }}
            placeholder="hungparadise"
            className="flex-1 text-ink outline-none"
          />
        </div>
        {slugState?.reason && (
          <p className={`mt-1 text-sm ${slugOk ? "text-sea" : "text-accent-deep"}`}>
            {slugState.reason}
          </p>
        )}
        {slugOk && !slugState?.reason && (
          <p className="mt-1 text-sm text-sea">Available</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium text-ink">Plan</label>
        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          className="mt-1 w-full rounded-btn border border-line bg-surface px-3 py-2.5 text-ink outline-none focus:border-accent"
        >
          {PLANS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium text-ink">Owner email</label>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="owner@restaurant.com"
          className="mt-1 w-full rounded-btn border border-line px-3 py-2.5 text-ink outline-none focus:border-accent"
        />
        <p className="mt-1 text-xs text-muted">
          They get an invite to set their own password. No password is ever created for them.
        </p>
      </div>

      <button
        type="submit"
        disabled={pending || slugState?.available === false}
        className="w-full rounded-btn bg-accent px-4 py-2.5 font-medium text-white disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create client"}
      </button>

      {result && (
        <p className="text-sm text-ink">
          {result}{" "}
          {result.startsWith("✓") && (
            <Link href="/admin" className="underline">
              Back to admin
            </Link>
          )}
        </p>
      )}
    </form>
  );
}

function suggestSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
