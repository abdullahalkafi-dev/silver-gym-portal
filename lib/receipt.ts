import { METHOD_LABELS, fmtDateTime, fmtMoney, paymentPeriodLabel, paymentTitle } from "./format";
import type { MemberMe, Payment } from "./types";

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

/** Opens a printable receipt in the same look as the gym's dashboard invoices. */
export function openReceipt(payment: Payment, me: MemberMe) {
  const paid = Number(payment.paidTotal ?? 0);
  const due = Number(payment.dueAmount ?? 0);
  // Some registration bills carry admission fee outside billAmount, so never show a total below what was paid.
  const total = Number(payment.billAmount) > 0 ? Number(payment.billAmount) : paid + due;
  const status = payment.status === "partial" || due > 0 ? "PARTIAL" : "PAID";
  const statusColor = status === "PAID" ? "#16a34a" : "#ea580c";
  const period = paymentPeriodLabel(payment);

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Receipt ${esc(payment.invoiceNo ?? "")}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #1a1a2e; background: #fff; padding: 20px 28px; line-height: 1.4; font-size: 12px;
    -webkit-print-color-adjust: exact; print-color-adjust: exact; max-width: 760px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px;
    padding-bottom: 10px; border-bottom: 3px solid #6c5ce7; }
  .brand h1 { font-size: 22px; font-weight: 800; color: #6c5ce7; letter-spacing: -0.5px; }
  .brand .branch { font-size: 12px; color: #64748b; margin-top: 1px; }
  .meta { text-align: right; }
  .meta .title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: #6c5ce7; margin-bottom: 3px; }
  .meta .no { font-size: 11px; color: #475569; font-family: 'Courier New', monospace; }
  .meta .date { font-size: 11px; color: #64748b; margin-top: 1px; }
  .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #6c5ce7;
    margin-bottom: 6px; padding-bottom: 4px; border-bottom: 2px solid #ede9fe; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 30px; margin-bottom: 14px; }
  .row { display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px solid #f1f5f9; }
  .row .l { font-size: 11px; color: #64748b; }
  .row .v { font-size: 11px; font-weight: 600; color: #1e293b; text-align: right; max-width: 55%; }
  table { width: 100%; border-collapse: collapse; margin: 4px 0 12px; }
  td { padding: 5px 8px; font-size: 11px; border-bottom: 1px solid #f1f5f9; }
  td:first-child { color: #64748b; width: 55%; }
  td:last-child { font-weight: 600; color: #1e293b; text-align: right; }
  .total td { font-size: 12px; font-weight: 700; color: #1a1a2e; border-top: 2px solid #6c5ce7; border-bottom: none; padding-top: 7px; }
  .discount td:last-child { color: #16a34a; }
  .due td:last-child { color: #dc2626; }
  .badge { display: inline-block; padding: 2px 12px; border-radius: 20px; font-size: 10px; font-weight: 700; letter-spacing: 0.5px; color: #fff; background: ${statusColor}; }
  .footer { margin-top: 16px; padding-top: 10px; border-top: 2px solid #f1f5f9; text-align: center; font-size: 10px; color: #94a3b8; }
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
<div class="grid">
  <div class="row"><span class="l">Full Name</span><span class="v">${safe(me.profile.fullName)}</span></div>
  <div class="row"><span class="l">Member ID</span><span class="v">${safe(me.profile.memberId)}</span></div>
  <div class="row"><span class="l">Contact</span><span class="v">${safe(me.profile.contact)}</span></div>
  <div class="row"><span class="l">Payment For</span><span class="v">${esc(paymentTitle(payment))}${period ? ` (${esc(period)})` : ""}</span></div>
</div>

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

  const win = window.open("", "_blank", "width=800,height=1000");
  if (!win) {
    alert("Please allow pop-ups to download your receipt.");
    return;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}
