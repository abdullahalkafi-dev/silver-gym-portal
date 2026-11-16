import type { Payment } from "./types";

const TZ = "Asia/Dhaka";

export const fmtDate = (value?: string | null) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: TZ,
  });
};

export const fmtDateTime = (value?: string | null) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return `${fmtDate(value)}, ${d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  })}`;
};

const monthYear = (d: Date) =>
  d.toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: TZ });

export const fmtMoney = (n?: number | null) =>
  `৳${Number(n ?? 0).toLocaleString("en-BD")}`;

const TYPE_LABELS: Record<string, string> = {
  monthly: "Monthly fee",
  package: "Package",
  admission: "Admission",
  registration: "Registration",
  locker: "Locker",
  due_settlement: "Due payment",
  custom: "Payment",
  other: "Payment",
};

export const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  bkash: "bKash",
  nagad: "Nagad",
  rocket: "Rocket",
  card: "Card",
  bank_transfer: "Bank transfer",
  other: "Other",
};

/** "Nov 2026", "Nov 2026 - Jan 2027" (period end is the first day AFTER the covered months). */
export const paymentPeriodLabel = (p: Payment) => {
  if (p.periodStart && p.periodEnd) {
    const start = new Date(p.periodStart);
    const end = new Date(new Date(p.periodEnd).getTime() - 24 * 60 * 60 * 1000);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      const a = monthYear(start);
      const b = monthYear(end);
      return a === b ? a : `${a} - ${b}`;
    }
  }
  return "";
};

export const paymentTitle = (p: Payment) => {
  if (p.paymentType === "package" && p.packageName) return p.packageName;
  return TYPE_LABELS[p.paymentType ?? ""] ?? "Payment";
};

export const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
