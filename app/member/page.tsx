"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import BillingTab from "@/components/member/BillingTab";
import OverviewTab from "@/components/member/OverviewTab";
import ProfileTab from "@/components/member/ProfileTab";
import { Logo, Spinner } from "@/components/ui";
import { ApiError, api, session } from "@/lib/api";
import type { MemberMe, Payment, UpdateRequestState } from "@/lib/types";

type TabKey = "overview" | "billing" | "profile";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "billing", label: "Billing" },
  { key: "profile", label: "Profile" },
];

export default function MemberPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("overview");
  const [me, setMe] = useState<MemberMe | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [request, setRequest] = useState<UpdateRequestState>({ pending: null, latest: null });
  const [error, setError] = useState<string | null>(null);

  const refreshRequest = useCallback(async () => {
    const data = await api<UpdateRequestState>("/update-request");
    setRequest(data);
  }, []);

  useEffect(() => {
    const stored = session.get();
    if (!stored || stored.kind !== "member") {
      router.replace("/");
      return;
    }

    (async () => {
      try {
        const profile = await api<MemberMe | { kind: "trainer" }>("/me");
        if (profile.kind !== "member") {
          router.replace("/trainer");
          return;
        }
        const [paymentList, requestState] = await Promise.all([
          api<Payment[]>("/payments"),
          api<UpdateRequestState>("/update-request"),
        ]);
        setMe(profile);
        setPayments(paymentList);
        setRequest(requestState);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          router.replace("/");
          return;
        }
        setError(err instanceof ApiError ? err.message : "Could not load your information.");
      }
    })();
  }, [router]);

  const signOut = () => {
    session.clear();
    router.replace("/");
  };

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-xl bg-purple px-5 py-2.5 text-sm font-semibold text-white"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="flex min-h-screen items-center justify-center text-purple">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  const hasPending = Boolean(request.pending);

  return (
    <main className="min-h-screen pb-16">
      <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <Logo size={36} />
            <div className="leading-tight">
              <p className="text-sm font-semibold">{me.business.name}</p>
              <p className="text-xs text-muted">{me.branch.name || "Member portal"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden max-w-[12rem] truncate text-sm text-muted sm:block">
              {me.profile.fullName}
            </span>
            <button
              onClick={signOut}
              className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium transition hover:bg-surface"
            >
              Sign out
            </button>
          </div>
        </div>

        <nav className="mx-auto flex max-w-5xl gap-1 px-4" aria-label="Sections">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              aria-current={tab === t.key ? "page" : undefined}
              className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                tab === t.key ? "text-purple" : "text-muted hover:text-ink"
              }`}
            >
              {t.label}
              {t.key === "profile" && hasPending ? (
                <span className="ml-1.5 inline-block h-2 w-2 rounded-full bg-amber-500 align-middle" title="Update request pending" />
              ) : null}
              {tab === t.key ? (
                <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-purple" />
              ) : null}
            </button>
          ))}
        </nav>
      </header>

      <div className="fade-up mx-auto max-w-5xl px-5 pt-6" key={tab}>
        {tab === "overview" ? <OverviewTab me={me} /> : null}
        {tab === "billing" ? <BillingTab me={me} payments={payments} /> : null}
        {tab === "profile" ? (
          <ProfileTab me={me} request={request} onRequestChanged={refreshRequest} />
        ) : null}
      </div>
    </main>
  );
}
