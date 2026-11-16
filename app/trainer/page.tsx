"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Logo, Spinner } from "@/components/ui";
import { ApiError, api, session } from "@/lib/api";
import type { TrainerMe } from "@/lib/types";

export default function TrainerPage() {
  const router = useRouter();
  const [me, setMe] = useState<TrainerMe | null>(null);

  useEffect(() => {
    const stored = session.get();
    if (!stored || stored.kind !== "trainer") {
      router.replace("/");
      return;
    }

    api<TrainerMe | { kind: "member" }>("/me")
      .then((data) => {
        if (data.kind !== "trainer") {
          router.replace("/member");
          return;
        }
        setMe(data);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) router.replace("/");
      });
  }, [router]);

  const signOut = () => {
    session.clear();
    router.replace("/");
  };

  if (!me) {
    return (
      <div className="flex min-h-screen items-center justify-center text-purple">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-3">
            <Logo size={36} />
            <div className="leading-tight">
              <p className="text-sm font-semibold">Silver GYM</p>
              <p className="text-xs text-muted">Trainer portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-muted sm:block">{me.displayName}</span>
            <button
              onClick={signOut}
              className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-surface"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-xl flex-col items-center px-5 py-24 text-center fade-up">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-purple-soft text-purple">
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M6.5 6.5v11M17.5 6.5v11M3 9v6M21 9v6M6.5 12h11" />
          </svg>
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Welcome, {me.displayName}</h1>
        <p className="mt-2 text-base font-medium text-purple">The trainer area is under construction</p>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
          We are building tools for you to follow your members and share diet and training plans.
          They will appear here soon.
        </p>
      </div>
    </main>
  );
}
