import type { Metadata } from "next";
import { LegalDoc } from "@/components/legal-doc";

export const dynamic = "force-static";
export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern use of Plato by restaurant owners and staff.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return <LegalDoc file="terms-of-service.md" />;
}
