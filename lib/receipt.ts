import { METHOD_LABELS, fmtDateTime, fmtMoney, paymentPeriodLabel, paymentTitle } from "./format";
import type { MemberMe, Payment } from "./types";

const STORAGE_KEY = "sg_portal_receipt";

const esc = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const safe = (value: unknown, fallback = "N/A") =>
  value === null || value === undefined || String(value).trim() === ""
    ? fallback
    : esc(value);

/** Remembers the chosen bill so the receipt page can show it (no extra server call needed). */
export function stashReceipt(payment: Payment, me: MemberMe) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ payment, me }));
  } catch {
    /* private mode: the receipt page sends the member back to Billing */
  }
}

export function loadReceipt(): { payment: Payment; me: MemberMe } | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const receiptTitle = (payment: Payment) => `Receipt ${payment.invoiceNo ?? ""}`.trim();

/** The receipt as a standalone HTML page, in the same layout as the gym's dashboard invoices. */
export function buildReceiptHtml(payment: Payment, me: MemberMe) {
  const paid = Number(payment.paidTotal ?? 0);
  const due = Number(payment.dueAmount ?? 0);
  // Some registration bills carry admission fee outside billAmount, so never show a total below what was paid.
  const total = Number(payment.billAmount) > 0 ? Number(payment.billAmount) : paid + due;
  const status = payment.status === "partial" || due > 0 ? "PARTIAL" : "PAID";
  const statusColor = status === "PAID" ? "#16a34a" : "#ea580c";
  const period = paymentPeriodLabel(payment);

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(receiptTitle(payment))}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #252525; background: #fff; padding: 20px 20px 28px; line-height: 1.4; font-size: 13px;
    -webkit-print-color-adjust: exact; print-color-adjust: exact; max-width: 760px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 16px;
    padding-bottom: 12px; border-bottom: 3px solid #e16349; }
  .brand h1 { font-size: 20px; font-weight: 800; color: #e16349; letter-spacing: -0.3px; }
  .brand .branch { font-size: 12px; color: #64748b; margin-top: 1px; }
  .meta { text-align: right; }
  .meta .title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: #e16349; margin-bottom: 3px; }
  .meta .no { font-size: 11px; color: #475569; font-family: 'Courier New', monospace; word-break: break-all; }
  .meta .date { font-size: 11px; color: #64748b; margin-top: 1px; }
  .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #e16349;
    margin: 14px 0 6px; padding-bottom: 4px; border-bottom: 2px solid #fde9e4; }
  .row { display: flex; justify-content: space-between; gap: 12px; padding: 5px 0; border-bottom: 1px solid #f1f5f9; }
  .row .l { font-size: 12px; color: #64748b; }
  .row .v { font-size: 12px; font-weight: 600; color: #1e293b; text-align: right; max-width: 60%; word-break: break-word; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 7px 4px; font-size: 12px; border-bottom: 1px solid #f1f5f9; }
  td:first-child { color: #64748b; width: 55%; }
  td:last-child { font-weight: 600; color: #1e293b; text-align: right; }
  .total td { font-size: 14px; font-weight: 700; color: #252525; border-top: 2px solid #e16349; border-bottom: none; padding-top: 9px; }
  .discount td:last-child { color: #16a34a; }
  .due td:last-child { color: #dc2626; }
  .badge { display: inline-block; padding: 2px 12px; border-radius: 20px; font-size: 10px; font-weight: 700; letter-spacing: 0.5px; color: #fff; background: ${statusColor}; }
  .footer { margin-top: 20px; padding-top: 12px; border-top: 2px solid #f1f5f9; text-align: center; font-size: 11px; color: #94a3b8; }
  .footer .thanks { font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 2px; }
  @media print { body { padding: 16px 24px; } }
</style></head>
<body>
<div class="header">
  <div class="brand"><h1>${safe(me.business.name, "Silver GYM")}</h1>
    ${me.branch.name ? `<div class="branch">${esc(me.branch.name)}</div>` : ""}</div>
  <div class="meta"><div class="title">Payment Receipt</div>
    <div class="no">${safe(payment.invoiceNo)}</div>
    <div class="date">${esc(fmtDateTime(payment.paymentDate))}</div></div>
</div>

<div class="section-title">Member Details</div>
<div class="row"><span class="l">Full Name</span><span class="v">${safe(me.profile.fullName)}</span></div>
<div class="row"><span class="l">Member ID</span><span class="v">${safe(me.profile.memberId)}</span></div>
<div class="row"><span class="l">Contact</span><span class="v">${safe(me.profile.contact)}</span></div>
<div class="row"><span class="l">Payment For</span><span class="v">${esc(paymentTitle(payment))}${period ? ` (${esc(period)})` : ""}</span></div>

<div class="section-title">Payment Summary</div>
<table>
  ${Number(payment.billAmount) > 0 ? `<tr><td>Subtotal</td><td>${fmtMoney(payment.subTotal ?? total)}</td></tr>` : ""}
  ${Number(payment.billAmount) > 0 && Number(payment.discount) > 0 ? `<tr class="discount"><td>Discount</td><td>-${fmtMoney(payment.discount)}</td></tr>` : ""}
  <tr class="total"><td>Total Amount</td><td>${fmtMoney(total)}</td></tr>
  <tr><td>Paid Amount</td><td>${fmtMoney(paid)}</td></tr>
  ${due > 0 ? `<tr class="due"><td>Due Amount</td><td>${fmtMoney(due)}</td></tr>` : ""}
  <tr><td>Payment Method</td><td>${esc(METHOD_LABELS[payment.paymentMethod ?? ""] ?? payment.paymentMethod ?? "N/A")}</td></tr>
  <tr><td>Status</td><td><span class="badge">${status}</span></td></tr>
</table>

<div class="footer">
  <div class="thanks">Thank you for choosing ${safe(me.business.name, "Silver GYM")}!</div>
  <div>For inquiries, please contact the front desk.</div>
</div>
</body></html>`;
}
