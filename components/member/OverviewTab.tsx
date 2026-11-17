import { Card, ChartIcon, ChevronRightIcon, FoodIcon, SecondaryButton, StatusPill } from "@/components/ui";
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
    <img src={url} alt={name} style={style} className="shrink-0 rounded-2xl object-cover" />
  ) : (
    <div
      style={{ ...style, fontSize: size / 2.8 }}
      className="flex shrink-0 items-center justify-center rounded-2xl bg-primary-100 font-semibold text-primary-700"
      aria-label={name}
    >
      {initials(name) || "?"}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "red" }) {
  return (
    <div className="rounded-xl bg-gray-50 px-3.5 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-0.5 break-words text-sm font-semibold ${tone === "red" ? "text-red-600" : "text-ink"}`}>
        {value}
      </p>
    </div>
  );
}

export default function OverviewTab({
  me,
  onOpenProfile,
  onOpenPlans,
}: {
  me: MemberMe;
  onOpenProfile: () => void;
  onOpenPlans: () => void;
}) {
  const p = me.profile;
  const due = p.currentDueAmount > 0;
  // Photos are missing for almost every member, so nudge them to add one.
  const missingPhoto = !p.photo;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-4">
          <Avatar name={p.fullName} photo={p.photo} size={72} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-semibold tracking-tight">{p.fullName}</h1>
            <p className="mt-0.5 text-sm text-muted">
              Member ID <span className="font-medium text-ink">{p.memberId ?? "-"}</span>
            </p>
            <div className="mt-1.5">
              <StatusPill tone="green">Active member</StatusPill>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Stat label="Package" value={p.currentPackageName || "-"} />
          <Stat label="Next payment" value={fmtDate(p.nextPaymentDate)} />
          <Stat label="Outstanding due" value={due ? fmtMoney(p.currentDueAmount) : "No due"} tone={due ? "red" : undefined} />
          <Stat label="Member since" value={fmtDate(p.joinedAt ?? p.membershipStartDate)} />
        </div>
      </Card>

      {due ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3.5 text-sm text-red-700">
          You have {fmtMoney(p.currentDueAmount)} due. Please pay at the front desk.
        </div>
      ) : null}

      {missingPhoto ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-primary-200 bg-primary-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary-800">Add your profile photo</p>
            <p className="mt-0.5 text-sm text-primary-700/80">
              The gym does not have a photo of you yet. It only takes a minute.
            </p>
          </div>
          <SecondaryButton size="sm" onClick={onOpenProfile} className="w-full sm:w-auto">
            Go to profile
          </SecondaryButton>
        </div>
      ) : null}

      <div className="space-y-2.5">
        <button
          onClick={onOpenPlans}
          className="flex w-full items-center gap-3.5 rounded-2xl border border-gray-100 bg-white p-3.5 text-left transition-colors active:bg-gray-50"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary">
            <FoodIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Diet & workout plans</p>
            <p className="text-xs leading-relaxed text-muted">Ask a trainer of your branch for a plan made for you.</p>
          </div>
          <ChevronRightIcon className="h-5 w-5 shrink-0 text-gray-400" />
        </button>
        <div className="flex items-center gap-3.5 rounded-2xl border border-gray-100 bg-white p-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary">
            <ChartIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Progress</p>
            <p className="text-xs leading-relaxed text-muted">Track your weight and measurements over time.</p>
          </div>
          <StatusPill tone="gray">Soon</StatusPill>
        </div>
      </div>
    </div>
  );
}
