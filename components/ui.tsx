"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

/* ─── Form controls (same look as the dashboard forms, sized for thumbs) ─────────── */

// 16px text on phones stops iOS from zooming the page when a field is focused.
const FOCUS =
  "focus:border-focus focus:shadow-[0_0_0_3px_var(--color-focus-ring)] focus-within:border-focus focus-within:shadow-[0_0_0_3px_var(--color-focus-ring)]";

const SIZE = {
  md: "h-12 text-base sm:h-[42px] sm:text-sm",
  lg: "h-12 text-base sm:h-14",
  area: "min-h-24 py-3 text-base sm:text-sm",
} as const;

export const fieldCls = (size: keyof typeof SIZE = "md", invalid = false) =>
  `block w-full rounded-lg border bg-white px-3.5 text-ink outline-none transition-colors placeholder:text-gray-400 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 ${SIZE[size]} ${
    invalid ? "border-red-400" : "border-gray-300"
  } ${FOCUS}`;

export const selectCls = (invalid = false) =>
  `${fieldCls("md", invalid)} select-chevron appearance-none pr-9`;

export function Field({
  label,
  htmlFor,
  hint,
  error,
  className = "",
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-gray-600">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function SelectInput({
  id,
  value,
  onChange,
  options,
  placeholder,
  invalid,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder: string;
  invalid?: boolean;
}) {
  // A saved value that is not in the list (old data) must still be selectable.
  const list = value && !options.includes(value) ? [value, ...options] : options;
  return (
    <select
      id={id}
      value={value}
      data-empty={!value}
      onChange={(e) => onChange(e.target.value)}
      className={selectCls(invalid)}
    >
      <option value="">{placeholder}</option>
      {list.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

/** One box: number on the left, unit dropdown on the right (like the dashboard's height/weight field). */
export function UnitInput({
  id,
  value,
  onChange,
  unit,
  onUnitChange,
  units,
  placeholder,
  invalid,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  unit: string;
  onUnitChange: (unit: string) => void;
  units: readonly string[];
  placeholder?: string;
  invalid?: boolean;
}) {
  return (
    <div
      className={`flex h-12 w-full overflow-hidden rounded-lg border bg-white transition-colors sm:h-[42px] ${
        invalid ? "border-red-400" : "border-gray-300"
      } ${FOCUS}`}
    >
      <input
        id={id}
        value={value}
        inputMode="decimal"
        autoComplete="off"
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
        className="min-w-0 flex-1 bg-transparent px-3.5 text-base text-ink outline-none placeholder:text-gray-400 sm:text-sm"
      />
      <select
        aria-label="Unit"
        value={unit}
        onChange={(e) => onUnitChange(e.target.value)}
        className="select-chevron select-chevron-sm w-[4.75rem] shrink-0 appearance-none border-l border-gray-300 bg-gray-50 pl-3 pr-7 text-base text-gray-700 outline-none sm:text-sm"
      >
        {units.map((u) => (
          <option key={u} value={u}>
            {u}
          </option>
        ))}
      </select>
    </div>
  );
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type DateParts = { d: number; m: number; y: number };
const NO_DATE: DateParts = { d: 0, m: 0, y: 0 };

const parseDate = (value: string): DateParts => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) } : NO_DATE;
};

/**
 * Date of birth as three dropdowns (day / month / year). Far easier on a phone than a calendar,
 * and always day-first. `value` and `onChange` use "YYYY-MM-DD" ("" until all three are chosen).
 */
export function DatePartsInput({
  id,
  value,
  onChange,
  invalid,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
}) {
  const [parts, setParts] = useState<DateParts>(() => parseDate(value));

  // Follow the parent when it sets a real date (form reset) or clears everything.
  useEffect(() => {
    if (value) setParts(parseDate(value));
    else setParts((current) => (current.d && current.m && current.y ? NO_DATE : current));
  }, [value]);

  const thisYear = new Date().getFullYear();
  const daysInMonth = new Date(parts.y || 2000, parts.m || 1, 0).getDate();

  const update = (patch: Partial<DateParts>) => {
    const next = { ...parts, ...patch };
    const max = new Date(next.y || 2000, next.m || 1, 0).getDate();
    if (next.d > max) next.d = max;
    setParts(next);
    onChange(
      next.d && next.m && next.y
        ? `${next.y}-${String(next.m).padStart(2, "0")}-${String(next.d).padStart(2, "0")}`
        : "",
    );
  };

  const cls = () => selectCls(invalid);

  return (
    <div className="grid grid-cols-[1fr_1.3fr_1.2fr] gap-2" role="group" aria-label="Date of birth">
      <select
        id={id}
        aria-label="Day"
        value={parts.d || ""}
        data-empty={!parts.d}
        onChange={(e) => update({ d: Number(e.target.value) })}
        className={cls()}
      >
        <option value="">Day</option>
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
      <select
        aria-label="Month"
        value={parts.m || ""}
        data-empty={!parts.m}
        onChange={(e) => update({ m: Number(e.target.value) })}
        className={cls()}
      >
        <option value="">Month</option>
        {MONTHS.map((m, i) => (
          <option key={m} value={i + 1}>
            {m}
          </option>
        ))}
      </select>
      <select
        aria-label="Year"
        value={parts.y || ""}
        data-empty={!parts.y}
        onChange={(e) => update({ y: Number(e.target.value) })}
        className={cls()}
      >
        <option value="">Year</option>
        {Array.from({ length: 100 }, (_, i) => thisYear - i).map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ─── Buttons, cards, small pieces ────────────────────────────────────────────── */

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60";

const BUTTON_SIZE = {
  md: "h-12 px-5 text-base sm:h-11 sm:text-sm",
  lg: "h-12 px-6 text-base sm:h-14",
  sm: "h-10 px-3.5 text-sm",
} as const;

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  size?: keyof typeof BUTTON_SIZE;
};

export function PrimaryButton({ children, loading, size = "md", className = "", ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`${BUTTON_BASE} ${BUTTON_SIZE[size]} bg-primary text-white hover:bg-primary-600 active:bg-primary-700 ${className}`}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}

export function SecondaryButton({ children, loading, size = "md", className = "", ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`${BUTTON_BASE} ${BUTTON_SIZE[size]} border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 ${className}`}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}

export function Logo({ size = 40 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="Silver GYM"
      width={size}
      height={size}
      className="shrink-0 rounded-xl"
      style={{ width: size, height: size }}
    />
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
    <section className={`rounded-2xl border border-gray-100 bg-white p-4 sm:p-6 ${className}`}>
      {children}
    </section>
  );
}

export function StatusPill({
  tone,
  children,
}: {
  tone: "green" | "red" | "amber" | "gray" | "orange";
  children: ReactNode;
}) {
  const tones = {
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    amber: "bg-amber-100 text-amber-700",
    gray: "bg-gray-100 text-gray-600",
    orange: "bg-primary-100 text-primary-700",
  } as const;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

/* ─── Icons (24px, stroke) ─────────────────────────────────────────────────────── */

type IconProps = { className?: string };
const icon = (path: ReactNode) =>
  function Icon({ className = "h-5 w-5" }: IconProps) {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {path}
      </svg>
    );
  };

export const HomeIcon = icon(
  <>
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
  </>,
);
export const ReceiptIcon = icon(
  <>
    <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
    <path d="M9 8h6M9 12h6" />
  </>,
);
export const UserIcon = icon(
  <>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" />
  </>,
);
export const LockIcon = icon(
  <>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </>,
);
export const CameraIcon = icon(
  <>
    <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
    <circle cx="12" cy="13" r="3.5" />
  </>,
);
export const DownloadIcon = icon(<path d="M12 3v12m0 0-4-4m4 4 4-4M5 21h14" />);
export const LogoutIcon = icon(
  <>
    <path d="M10 4H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4" />
    <path d="M15 8l4 4-4 4M19 12H9" />
  </>,
);
export const ArrowLeftIcon = icon(<path d="M19 12H5m0 0 6-6m-6 6 6 6" />);
export const FoodIcon = icon(
  <>
    <path d="M12 7c-1.5-2-5-2-6.5 1C4 11 5 16 8 19c1.5 1.4 2.5 1 4 .5 1.5.5 2.5.9 4-.5 3-3 4-8 2.5-11C17 5 13.5 5 12 7Z" />
    <path d="M12 7c0-2 1-3.5 3-4" />
  </>,
);
export const DumbbellIcon = icon(<path d="M6.5 6.5v11M17.5 6.5v11M3 9v6M21 9v6M6.5 12h11" />);
export const ChartIcon = icon(
  <>
    <path d="M3 17l6-6 4 4 8-8" />
    <path d="M15 7h6v6" />
  </>,
);
