"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import BillingTab from "@/components/member/BillingTab";
import OverviewTab from "@/components/member/OverviewTab";
import ProfileTab from "@/components/member/ProfileTab";
import {
  HomeIcon,
  Logo,
  LogoutIcon,
  PrimaryButton,
  ReceiptIcon,
  Spinner,
  UserIcon,
} from "@/components/ui";
import { ApiError, api, session } from "@/lib/api";
import type { MemberMe, Payment, UpdateRequestState } from "@/lib/types";

type TabKey = "overview" | "billing" | "profile";

const TABS: { key: TabKey; label: string; Icon: typeof HomeIcon }[] = [
  { key: "overview", label: "Home", Icon: HomeIcon },
  { key: "billing", label: "Billing", Icon: ReceiptIcon },
  { key: "profile", label: "Profile", Icon: UserIcon },
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

  const goTo = (next: TabKey) => {
    setTab(next);
    window.scrollTo({ top: 0 });
  };

  const signOut = () => {
    session.clear();
    router.replace("/");
  };

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-5 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <PrimaryButton onClick={() => window.location.reload()}>Try again</PrimaryButton>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-primary">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  const hasPending = Boolean(request.pending);

  return (
    <main className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <Logo size={36} />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-semibold">{me.business.name}</p>
              <p className="truncate text-xs text-muted">{me.branch.name || "Member portal"}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            aria-label="Sign out"
            className="flex h-10 shrink-0 items-center gap-2 rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-100"
          >
            <LogoutIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>

        {/* Top tabs (tablet and desktop) */}
        <nav className="mx-auto hidden max-w-4xl gap-1 px-3 md:flex" aria-label="Sections">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => goTo(key)}
              aria-current={tab === key ? "page" : undefined}
              className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                tab === key ? "text-primary" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {key === "overview" ? "Overview" : label}
              {key === "profile" && hasPending ? (
                <span className="ml-1.5 inline-block h-2 w-2 rounded-full bg-amber-500 align-middle" title="Update request pending" />
              ) : null}
              {tab === key ? <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary" /> : null}
            </button>
          ))}
        </nav>
      </header>

      <div className="fade-up mx-auto max-w-4xl px-4 pb-32 pt-4 md:pb-12 md:pt-6" key={tab}>
        {tab === "overview" ? <OverviewTab me={me} onOpenProfile={() => goTo("profile")} /> : null}
        {tab === "billing" ? <BillingTab me={me} payments={payments} /> : null}
        {tab === "profile" ? (
          <ProfileTab me={me} request={request} onRequestChanged={refreshRequest} />
        ) : null}
      </div>

      {/* Bottom bar (phones) */}
      <nav
        aria-label="Sections"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <div className="grid grid-cols-3">
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => goTo(key)}
              aria-current={tab === key ? "page" : undefined}
              className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
                tab === key ? "text-primary" : "text-gray-500 active:bg-gray-50"
              }`}
            >
              <span className="relative">
                <Icon className="h-6 w-6" />
                {key === "profile" && hasPending ? (
                  <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-amber-500" />
                ) : null}
              </span>
              {label}
              {tab === key ? <span className="absolute inset-x-6 top-0 h-0.5 rounded-b-full bg-primary" /> : null}
            </button>
          ))}
        </div>
      </nav>
    </main>
  );
}
