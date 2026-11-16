import { Card, StatusPill } from "@/components/ui";
import {
  METHOD_LABELS,
  fmtDate,
  fmtMoney,
  paymentPeriodLabel,
  paymentTitle,
} from "@/lib/format";
import { openReceipt } from "@/lib/receipt";
import type { MemberMe, Payment } from "@/lib/types";

function ReceiptButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-purple transition hover:bg-purple-soft"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" />
      </svg>
      Receipt
    </button>
  );
}

const statusPill = (p: Payment) =>
  p.status === "partial" || Number(p.dueAmount) > 0 ? (
    <StatusPill tone="amber">Partial</StatusPill>
  ) : (
    <StatusPill tone="green">Paid</StatusPill>
  );

export default function BillingTab({ me, payments }: { me: MemberMe; payments: Payment[] }) {
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.paidTotal ?? 0), 0);
  const last = payments[0];

  if (payments.length === 0) {
    return (
      <Card className="py-14 text-center">
        <p className="text-sm font-medium text-ink">No payments to show yet</p>
        <p className="mt-1 text-sm text-muted">Your paid bills and receipts will appear here.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total paid", value: fmtMoney(totalPaid) },
          { label: "Payments", value: String(payments.length) },
          { label: "Last payment", value: fmtDate(last?.paymentDate) },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-line bg-white px-4 py-3.5">
            <p className="text-xs text-muted">{s.label}</p>
            <p className="mt-0.5 truncate text-sm font-semibold sm:text-base">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <Card className="hidden overflow-hidden p-0 md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-surface text-left text-xs font-medium uppercase tracking-wide text-muted">
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Invoice</th>
              <th className="px-5 py-3">For</th>
              <th className="px-5 py-3">Method</th>
              <th className="px-5 py-3 text-right">Paid</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p._id} className="border-b border-line last:border-0 hover:bg-surface/60">
                <td className="whitespace-nowrap px-5 py-3.5">{fmtDate(p.paymentDate)}</td>
                <td className="px-5 py-3.5 font-mono text-xs text-muted">{p.invoiceNo ?? "-"}</td>
                <td className="px-5 py-3.5">
                  <p className="font-medium">{paymentTitle(p)}</p>
                  {paymentPeriodLabel(p) ? (
                    <p className="text-xs text-muted">{paymentPeriodLabel(p)}</p>
                  ) : null}
                </td>
                <td className="px-5 py-3.5 text-muted">
                  {METHOD_LABELS[p.paymentMethod ?? ""] ?? p.paymentMethod ?? "-"}
                </td>
                <td className="px-5 py-3.5 text-right font-semibold">{fmtMoney(p.paidTotal)}</td>
                <td className="px-5 py-3.5">{statusPill(p)}</td>
                <td className="px-5 py-3.5 text-right">
                  <ReceiptButton onClick={() => openReceipt(p, me)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {payments.map((p) => (
          <div key={p._id} className="rounded-2xl border border-line bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">{paymentTitle(p)}</p>
                <p className="text-xs text-muted">
                  {paymentPeriodLabel(p) || fmtDate(p.paymentDate)}
                </p>
              </div>
              <p className="shrink-0 text-base font-semibold">{fmtMoney(p.paidTotal)}</p>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                {statusPill(p)}
                <span>{fmtDate(p.paymentDate)}</span>
                <span>&middot; {METHOD_LABELS[p.paymentMethod ?? ""] ?? p.paymentMethod ?? "-"}</span>
              </div>
              <ReceiptButton onClick={() => openReceipt(p, me)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
