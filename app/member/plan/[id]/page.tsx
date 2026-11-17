"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import PlanContent from "@/components/PlanContent";
import { Card, FullPageSpinner, SecondaryButton, StatusPill, SubPageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { STATUS_LABEL, STATUS_TONE, fmtHeight, fmtWeight } from "@/lib/plans";
import type { PlanRequest } from "@/lib/types";
import { errorText, handleSignedOut, useRequireSession } from "@/lib/useSession";

export default function MemberPlanPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const ready = useRequireSession("member");
  const [request, setRequest] = useState<PlanRequest | null>(null);
  const [error, setError] = useState<string | null>(null);

  const back = () => router.replace("/member?tab=plans");

  useEffect(() => {
    if (!ready) return;
    api<PlanRequest>(`/plan-requests/${id}`)
      .then(setRequest)
      .catch((err) => {
        if (!handleSignedOut(err, router)) setError(errorText(err, "Could not open this plan."));
      });
  }, [ready, id, router]);

  if (error) {
    return (
      <main className="min-h-dvh">
        <SubPageHeader title="Plan" onBack={back} />
        <div className="mx-auto max-w-xl px-4 py-10 text-center">
          <p className="text-sm text-red-600">{error}</p>
          <SecondaryButton size="sm" className="mt-3" onClick={back}>
            Back to my plans
          </SecondaryButton>
        </div>
      </main>
    );
  }

  if (!request) return <FullPageSpinner />;

  const r = request;
  const s = r.memberSnapshot;

  return (
    <main className="min-h-dvh">
      <SubPageHeader
        title={r.reply?.title || r.topic}
        subtitle={r.trainerName ? `From ${r.trainerName}` : undefined}
        onBack={back}
      />

      <div className="fade-up mx-auto max-w-2xl space-y-4 px-4 pb-16 pt-4">
        {r.status === "answered" && r.reply ? (
          <Card className="sm:p-7">
            <p className="text-xs text-muted">
              Sent {fmtDateTime(r.reply.sentAt)}
              {r.reply.editedAt ? ` · Updated ${fmtDateTime(r.reply.editedAt)}` : ""}
            </p>
            <PlanContent html={r.reply.content} className="mt-4" />
          </Card>
        ) : (
          <Card>
            <div className="flex items-center gap-2">
              <StatusPill tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</StatusPill>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-gray-700">
              {r.status === "pending"
                ? `${r.trainerName || "The trainer"} has your request. Your plan will show up here when it is ready.`
                : r.status === "declined"
                  ? r.declineReason || "The trainer could not take this request."
                  : "You cancelled this request."}
            </p>
          </Card>
        )}

        {/* What the member sent (read only) */}
        <Card>
          <h2 className="text-sm font-semibold text-gray-700">Your request</h2>
          <dl className="mt-3 space-y-3 text-sm">
            <Row label="Topic" value={r.topic} />
            <Row label="Sent" value={fmtDate(r.createdAt)} />
            <Row label="Height / weight" value={`${fmtHeight(s)} · ${fmtWeight(s)}`} />
            {r.note ? (
              <div>
                <dt className="text-muted">About you</dt>
                <dd className="mt-1 whitespace-pre-line rounded-xl bg-gray-50 p-3 leading-relaxed">{r.note}</dd>
              </div>
            ) : null}
          </dl>
        </Card>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 text-right font-medium break-words">{value}</dd>
    </div>
  );
}
