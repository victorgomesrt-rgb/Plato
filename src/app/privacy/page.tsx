import type { Metadata } from "next";
import { LegalDoc } from "@/components/legal-doc";

export const dynamic = "force-static";
export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Plato handles data. Diner analytics are cookieless with no personal data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return <LegalDoc file="privacy-policy.md" />;
}
