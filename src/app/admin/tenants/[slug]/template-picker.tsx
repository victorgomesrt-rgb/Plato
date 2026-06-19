"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setTemplate } from "./actions";

const TEMPLATES: { value: string; label: string }[] = [
  { value: "grid", label: "Grid" },
  { value: "reel", label: "Reel" },
  { value: "classic", label: "Classic" },
  { value: "spotlight", label: "Spotlight" },
];

export function TemplatePicker({
  tenantId,
  current,
}: {
  tenantId: string;
  current: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      Template
      <select
        defaultValue={current}
        disabled={pending}
        onChange={(e) =>
          startTransition(async () => {
            await setTemplate(tenantId, e.target.value);
            router.refresh();
          })
        }
        className="rounded-btn border border-line bg-surface px-2 py-1 text-sm text-ink"
      >
        {TEMPLATES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
    </label>
  );
}
