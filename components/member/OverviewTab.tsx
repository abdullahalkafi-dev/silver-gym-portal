import { Card, StatusPill } from "@/components/ui";
import { photoUrl } from "@/lib/api";
import { fmtDate, fmtMoney, initials } from "@/lib/format";
import type { MemberMe } from "@/lib/types";

export function Avatar({
  name,
  photo,
  size = 80,
}: {
  name: string;
  photo?: string | null;
  size?: number;
}) {
  const url = photoUrl(photo);
  const style = { width: size, height: size };
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={name} style={style} className="rounded-2xl object-cover" />
  ) : (
    <div
      style={{ ...style, fontSize: size / 2.8 }}
      className="flex items-center justify-center rounded-2xl bg-purple-soft font-semibold text-purple"
      aria-label={name}
    >
      {initials(name) || "?"}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "red" }) {
  return (
    <div className="rounded-xl bg-surface px-4 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold ${tone === "red" ? "text-red-600" : "text-ink"}`}>
        {value}
      </p>
    </div>
  );
}

function ComingSoon({ title, text, icon }: { title: string; text: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-[#d9d4ee] bg-white/60 px-5 py-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-soft text-purple">
        {icon}
      </div>
      <h3 className="mt-4 text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-[16rem] text-xs leading-relaxed text-muted">{text}</p>
      <span className="mt-3">
        <StatusPill tone="purple">Coming soon</StatusPill>
      </span>
    </div>
  );
}

export default function OverviewTab({ me }: { me: MemberMe }) {
  const p = me.profile;
  const due = p.currentDueAmount > 0;

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar name={p.fullName} photo={p.photo} size={88} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-semibold tracking-tight">{p.fullName}</h2>
              <StatusPill tone="green">Active</StatusPill>
            </div>
            <p className="mt-1 text-sm text-muted">
              Member ID <span className="font-mono font-medium text-ink">{p.memberId ?? "-"}</span>
              {me.branch.name ? <> &middot; {me.branch.name}</> : null}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Package" value={p.currentPackageName || "Monthly"} />
          <Stat label="Next payment" value={fmtDate(p.nextPaymentDate)} />
          <Stat
            label="Outstanding due"
            value={due ? fmtMoney(p.currentDueAmount) : "No due"}
            tone={due ? "red" : undefined}
          />
          <Stat label="Member since" value={fmtDate(p.joinedAt ?? p.membershipStartDate)} />
        </div>
      </Card>

      <div>
        <h3 className="mb-3 px-1 text-sm font-semibold text-ink">Your plans</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ComingSoon
            title="Diet plan"
            text="Your trainer will share a personal meal plan here."
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 7c-1.5-2-5-2-6.5 1C4 11 5 16 8 19c1.5 1.4 2.5 1 4 .5 1.5.5 2.5.9 4-.5 3-3 4-8 2.5-11C17 5 13.5 5 12 7Z" />
                <path d="M12 7c0-2 1-3.5 3-4" />
              </svg>
            }
          />
          <ComingSoon
            title="Workout plan"
            text="Training programs from your trainer will appear here."
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M6.5 6.5v11M17.5 6.5v11M3 9v6M21 9v6M6.5 12h11" />
              </svg>
            }
          />
          <ComingSoon
            title="Progress"
            text="Track your weight and measurements over time."
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M3 17l6-6 4 4 8-8" />
                <path d="M15 7h6v6" />
              </svg>
            }
          />
        </div>
      </div>
    </div>
  );
}
