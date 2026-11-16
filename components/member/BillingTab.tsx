"use client";

import { useRouter } from "next/navigation";

import { Card, DownloadIcon, StatusPill } from "@/components/ui";
import { METHOD_LABELS, fmtDate, fmtMoney, paymentPeriodLabel, paymentTitle } from "@/lib/format";
import { stashReceipt } from "@/lib/receipt";
import type { MemberMe, Payment } from "@/lib/types";

const statusPill = (p: Payment) =>
  p.status === "partial" || Number(p.dueAmount) > 0 ? (
    <StatusPill tone="amber">Partial</StatusPill>
  ) : (
    <StatusPill tone="green">Paid</StatusPill>
  );

export default function BillingTab({ me, payments }: { me: MemberMe; payments: Payment[] }) {
  const router = useRouter();
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.paidTotal ?? 0), 0);
  const last = payments[0];

  const openReceipt = (payment: Payment) => {
    stashReceipt(payment, me);
    router.push("/member/receipt");
  };

  const ReceiptButton = ({ payment }: { payment: Payment }) => (
    <button
      onClick={() => openReceipt(payment)}
      className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50 active:bg-primary-100"
    >
      <DownloadIcon className="h-4 w-4" />
      Receipt
    </button>
  );

  if (payments.length === 0) {
    return (
      <Card className="py-14 text-center">
        <p className="text-sm font-medium text-ink">No payments to show yet</p>
        <p className="mt-1 text-sm text-muted">Your paid bills and receipts will appear here.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2.5">
        <div className="col-span-2 rounded-2xl border border-gray-100 bg-white px-4 py-3.5 sm:col-span-1">
          <p className="text-xs text-muted">Total paid</p>
          <p className="mt-0.5 text-2xl font-semibold tracking-tight">{fmtMoney(totalPaid)}</p>
        </div>
        <div className="col-span-2 grid grid-cols-2 gap-2.5 sm:col-span-1">
          <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3.5">
            <p className="text-xs text-muted">Payments</p>
            <p className="mt-0.5 text-lg font-semibold">{payments.length}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3.5">
            <p className="text-xs text-muted">Last payment</p>
            <p className="mt-0.5 text-base font-semibold leading-7">{fmtDate(last?.paymentDate)}</p>
          </div>
        </div>
      </div>

      {/* Desktop table */}
      <Card className="hidden overflow-hidden p-0 sm:p-0 md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-muted">
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
              <tr key={p._id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60">
                <td className="whitespace-nowrap px-5 py-3.5">{fmtDate(p.paymentDate)}</td>
                <td className="px-5 py-3.5 font-mono text-xs text-muted">{p.invoiceNo ?? "-"}</td>
                <td className="px-5 py-3.5">
                  <p className="font-medium">{paymentTitle(p)}</p>
                  {paymentPeriodLabel(p) ? <p className="text-xs text-muted">{paymentPeriodLabel(p)}</p> : null}
                </td>
                <td className="px-5 py-3.5 text-muted">
                  {METHOD_LABELS[p.paymentMethod ?? ""] ?? p.paymentMethod ?? "-"}
                </td>
                <td className="px-5 py-3.5 text-right font-semibold">{fmtMoney(p.paidTotal)}</td>
                <td className="px-5 py-3.5">{statusPill(p)}</td>
                <td className="px-5 py-3.5 text-right">
                  <ReceiptButton payment={p} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Phone cards */}
      <div className="space-y-2.5 md:hidden">
        {payments.map((p) => (
          <div key={p._id} className="rounded-2xl border border-gray-100 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium leading-snug">{paymentTitle(p)}</p>
                <p className="mt-0.5 text-xs text-muted">{paymentPeriodLabel(p) || fmtDate(p.paymentDate)}</p>
              </div>
              <p className="shrink-0 text-lg font-semibold">{fmtMoney(p.paidTotal)}</p>
            </div>
            <div className="mt-3 flex items-end justify-between gap-3">
              <div className="space-y-1 text-xs text-muted">
                <div className="flex items-center gap-2">
                  {statusPill(p)}
                  <span>{METHOD_LABELS[p.paymentMethod ?? ""] ?? p.paymentMethod ?? "-"}</span>
                </div>
                <p>
                  {fmtDate(p.paymentDate)}
                  {p.invoiceNo ? <> &middot; {p.invoiceNo}</> : null}
                </p>
              </div>
              <ReceiptButton payment={p} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
