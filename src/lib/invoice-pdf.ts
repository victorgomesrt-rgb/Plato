import "server-only";
import { jsPDF } from "jspdf";

export type InvoiceLine = {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
};

export type InvoiceData = {
  number: string;
  restaurant: string;
  periodLabel: string;
  amount: number;
  currency: string;
  dueDate: string;
  planLabel: string;
  paymentInstructions: string;
  lines?: InvoiceLine[];
};

function money(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

// Numbered invoice PDF (architecture §9). Text-only so it runs server-side without canvas.
export function buildInvoicePdf(d: InvoiceData): Buffer {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const left = 20;

  // Header band
  doc.setFillColor(251, 106, 26); // Plato Orange
  doc.rect(0, 0, 210, 26, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text("Plato", left, 17);
  doc.setFontSize(11);
  doc.text("Invoice", 190, 17, { align: "right" });

  doc.setTextColor(22, 17, 14);
  doc.setFontSize(11);
  let y = 42;
  doc.text(`Invoice: ${d.number}`, left, y);
  doc.text(`Due: ${d.dueDate}`, 190, y, { align: "right" });
  y += 8;
  doc.text(`Billed to: ${d.restaurant}`, left, y);
  y += 8;
  doc.text(`Period: ${d.periodLabel}`, left, y);

  // Line items
  y += 16;
  doc.setDrawColor(236, 231, 225);
  doc.line(left, y, 190, y);
  y += 8;
  const lines: InvoiceLine[] =
    d.lines && d.lines.length
      ? d.lines
      : [{ description: `Plato ${d.planLabel} subscription`, quantity: 1, unitPrice: d.amount, amount: d.amount }];
  for (const li of lines) {
    const label =
      li.quantity && li.quantity !== 1
        ? `${li.description}  (${li.quantity} x ${money(li.unitPrice, d.currency)})`
        : li.description;
    const wrapped = doc.splitTextToSize(label, 140) as string[];
    doc.text(wrapped, left, y);
    doc.text(money(li.amount, d.currency), 190, y, { align: "right" });
    y += 6 * wrapped.length + 2;
  }
  doc.line(left, y, 190, y);
  y += 9;
  doc.setFontSize(13);
  doc.text("Total", left, y);
  doc.text(money(d.amount, d.currency), 190, y, { align: "right" });

  // Payment instructions
  y += 18;
  doc.setFontSize(11);
  doc.setTextColor(107, 102, 96);
  doc.text("How to pay", left, y);
  y += 7;
  doc.setTextColor(22, 17, 14);
  doc.text(doc.splitTextToSize(d.paymentInstructions, 170), left, y);

  doc.setFontSize(10);
  doc.setTextColor(107, 102, 96);
  doc.text("Thanks for building with Plato.", left, 285);

  return Buffer.from(doc.output("arraybuffer"));
}
