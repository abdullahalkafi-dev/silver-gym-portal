import type { ReactNode } from "react";

export const inputCls =
  "w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-purple focus:ring-4 focus:ring-purple/10 disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted";

export function Logo({ size = 40 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/logo.png" alt="Silver GYM" width={size} height={size} className="rounded-xl" />
  );
}

export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] ${className}`}>
      {children}
    </section>
  );
}

export function PrimaryButton({
  children,
  loading,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-purple px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple/25 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}

export function StatusPill({
  tone,
  children,
}: {
  tone: "green" | "red" | "amber" | "gray" | "purple";
  children: ReactNode;
}) {
  const tones = {
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    amber: "bg-amber-100 text-amber-700",
    gray: "bg-gray-100 text-gray-600",
    purple: "bg-purple-soft text-purple",
  } as const;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}
