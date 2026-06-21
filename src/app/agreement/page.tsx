import type { Metadata } from "next";
import { LegalDoc } from "@/components/legal-doc";

export const dynamic = "force-static";
export const metadata: Metadata = {
  title: "Client Service Agreement",
  description: "The service agreement between Plato (GMS Innovations) and restaurant clients.",
  alternates: { canonical: "/agreement" },
};

export default function AgreementPage() {
  return <LegalDoc file="client-service-agreement.md" />;
}
