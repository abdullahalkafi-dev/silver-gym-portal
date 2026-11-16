"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { DumbbellIcon, Logo, LogoutIcon, Spinner } from "@/components/ui";
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
      <div className="flex min-h-dvh items-center justify-center text-primary">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <main className="min-h-dvh">
      <header className="border-b border-gray-200 bg-white pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <Logo size={36} />
            <div className="min-w-0 leading-tight">
              <p className="text-sm font-semibold">Silver GYM</p>
              <p className="truncate text-xs text-muted">{me.branchName || "Trainer portal"}</p>
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
      </header>

      <div className="fade-up mx-auto flex max-w-md flex-col items-center px-5 py-16 text-center sm:py-24">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary-50 text-primary">
          <DumbbellIcon className="h-10 w-10" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Welcome, {me.displayName}</h1>
        <p className="mt-2 text-base font-medium text-primary">The trainer area is under construction</p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          We are building tools for you to follow your members and share diet and training plans. They will appear
          here soon.
        </p>
      </div>
    </main>
  );
}
