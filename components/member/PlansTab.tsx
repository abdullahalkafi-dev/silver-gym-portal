"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  Card,
  ChevronRightIcon,
  ClipboardIcon,
  DumbbellIcon,
  PrimaryButton,
  SecondaryButton,
  Spinner,
  StatusPill,
} from "@/components/ui";
import { api } from "@/lib/api";
import { fmtDate } from "@/lib/format";
import { STATUS_LABEL, STATUS_TONE } from "@/lib/plans";
import type { PlanRequest, TrainerOption } from "@/lib/types";
import { errorText, handleSignedOut } from "@/lib/useSession";

export default function PlansTab() {
  const router = useRouter();
  const [trainers, setTrainers] = useState<TrainerOption[] | null>(null);
  const [requests, setRequests] = useState<PlanRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [t, r] = await Promise.all([
        api<TrainerOption[]>("/plan-trainers"),
        api<PlanRequest[]>("/plan-requests"),
      ]);
      setTrainers(t);
      setRequests(r);
      setError(null);
    } catch (err) {
      if (!handleSignedOut(err, router)) setError(errorText(err, "Could not load your plans."));
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const cancel = async (id: string) => {
    if (!window.confirm("Cancel this request? The trainer will no longer see it.")) return;
    setCancelling(id);
    try {
      await api(`/plan-requests/${id}`, { method: "DELETE" });
      toast.success("Request cancelled");
      await load();
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setCancelling(null);
    }
  };

  if (error) {
    return (
      <Card className="text-center">
        <p className="text-sm text-red-600">{error}</p>
        <SecondaryButton size="sm" className="mt-3" onClick={load}>
          Try again
        </SecondaryButton>
      </Card>
    );
  }

  if (!trainers) {
    return (
      <div className="flex justify-center py-16 text-primary">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  const waiting = requests.find((r) => r.status === "pending");
  const hasTrainers = trainers.length > 0;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-start gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary">
            <DumbbellIcon className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold tracking-tight">Diet & workout plans</h2>
            <p className="mt-0.5 text-sm leading-relaxed text-muted">
              {hasTrainers
                ? "Ask a trainer of your branch for a plan made for you."
                : "No trainer is available at your branch yet. Please check again later."}
            </p>
          </div>
        </div>

        {hasTrainers ? (
          waiting ? (
            <p className="mt-4 rounded-xl bg-amber-50 px-3.5 py-3 text-sm text-amber-800">
              Your request is waiting for {waiting.trainerName || "the trainer"}. You can ask again after it is answered.
            </p>
          ) : (
            <PrimaryButton className="mt-4 w-full sm:w-auto" onClick={() => router.push("/member/ask")}>
              Ask a trainer
            </PrimaryButton>
          )
        ) : null}
      </Card>

      <div>
        <h2 className="mb-2.5 px-1 text-sm font-semibold text-gray-700">My requests</h2>

        {requests.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center">
            <ClipboardIcon className="h-8 w-8 text-gray-300" />
            <p className="mt-2 text-sm text-muted">Your plans from trainers will show up here.</p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {requests.map((r) => (
              <li key={r._id} className="rounded-2xl border border-gray-100 bg-white">
                <Link
                  href={`/member/plan/${r._id}`}
                  className="flex items-center gap-3 rounded-2xl p-4 transition-colors active:bg-gray-50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold">{r.reply?.title || r.topic}</p>
                      <StatusPill tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</StatusPill>
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {r.trainerName || "Trainer"} · {fmtDate(r.createdAt)}
                    </p>
                    {r.status === "answered" ? (
                      <p className="mt-1.5 text-sm font-medium text-primary">Read your plan</p>
                    ) : r.status === "declined" && r.declineReason ? (
                      <p className="mt-1.5 line-clamp-2 text-sm text-red-700">{r.declineReason}</p>
                    ) : null}
                  </div>
                  <ChevronRightIcon className="h-5 w-5 shrink-0 text-gray-400" />
                </Link>
                {r.status === "pending" ? (
                  <div className="border-t border-gray-100 px-4 py-2.5">
                    <button
                      onClick={() => cancel(r._id)}
                      disabled={cancelling === r._id}
                      className="flex min-h-10 items-center gap-2 text-sm font-medium text-red-600 disabled:opacity-60"
                    >
                      {cancelling === r._id ? <Spinner /> : null}
                      Cancel request
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
