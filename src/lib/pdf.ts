import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Business } from "@/contexts/BusinessContext";
import { formatRWF, formatDate } from "./format";

function header(doc: jsPDF, b: Business, title: string, num: string) {
  doc.setFontSize(18); doc.text(b.name, 14, 18);
  doc.setFontSize(9); doc.setTextColor(100);
  const lines = [b.full_address, b.business_phone, b.whatsapp_number ? "WhatsApp: " + b.whatsapp_number : "", b.email, b.tin_number ? "TIN: " + b.tin_number : ""].filter(Boolean);
  lines.forEach((l, i) => doc.text(String(l), 14, 24 + i * 4));
  doc.setTextColor(0); doc.setFontSize(14); doc.text(title, 196, 18, { align: "right" });
  doc.setFontSize(10); doc.text(num, 196, 24, { align: "right" });
  doc.text(formatDate(new Date()), 196, 29, { align: "right" });
}

export function generateProformaPDF(b: Business, p: { proforma_id: string; customer_name: string | null; customer_phone: string | null; subtotal: number; vat_enabled: boolean; vat_percentage: number; vat_amount: number; grand_total: number; notes: string | null }, items: { item_name: string; quantity: number; unit_price: number; total_price: number }[]) {
  const doc = new jsPDF();
  header(doc, b, "PROFORMA INVOICE", p.proforma_id);
  doc.setFontSize(10);
  doc.text(`Bill to: ${p.customer_name ?? "—"}`, 14, 55);
  if (p.customer_phone) doc.text(p.customer_phone, 14, 60);
  autoTable(doc, {
    startY: 70,
    head: [["Item", "Qty", "Unit price", "Total"]],
    body: items.map(i => [i.item_name, String(i.quantity), formatRWF(i.unit_price), formatRWF(i.total_price)]),
    headStyles: { fillColor: [40, 40, 60] },
  });
  let y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  doc.text(`Subtotal: ${formatRWF(p.subtotal)}`, 196, y, { align: "right" }); y += 5;
  if (p.vat_enabled) { doc.text(`VAT ${p.vat_percentage}%: ${formatRWF(p.vat_amount)}`, 196, y, { align: "right" }); y += 5; }
  doc.setFontSize(12); doc.text(`Grand total: ${formatRWF(p.grand_total)}`, 196, y, { align: "right" });
  if (b.payment_terms) { doc.setFontSize(9); doc.setTextColor(100); doc.text("Payment terms: " + b.payment_terms, 14, y + 10); }
  if (b.invoice_footer_note) doc.text(b.invoice_footer_note, 14, y + 15);
  doc.save(`${p.proforma_id}.pdf`);
}

export function generateDeliveryNotePDF(b: Business, d: { delivery_note_id: string; customer_name: string | null; delivery_address: string | null; delivery_date: string | null; delivered_by: string | null; received_by: string | null; notes: string | null }, items: { item_name: string; quantity: number; unit_type: string | null }[]) {
  const doc = new jsPDF();
  header(doc, b, "DELIVERY NOTE", d.delivery_note_id);
  doc.setFontSize(10);
  doc.text(`Deliver to: ${d.customer_name ?? "—"}`, 14, 55);
  if (d.delivery_address) doc.text(d.delivery_address, 14, 60);
  autoTable(doc, {
    startY: 70, head: [["Item", "Quantity", "Unit"]],
    body: items.map(i => [i.item_name, String(i.quantity), i.unit_type ?? ""]),
    headStyles: { fillColor: [40,40,60] },
  });
  const y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  doc.text(`Delivered by: ${d.delivered_by ?? "____________"}`, 14, y);
  doc.text(`Received by: ${d.received_by ?? "____________"}`, 14, y + 8);
  doc.save(`${d.delivery_note_id}.pdf`);
}

export function whatsappLink(phone: string, message: string) {
  const cleaned = phone.replace(/[^\d+]/g, "").replace(/^\+/, "");
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}