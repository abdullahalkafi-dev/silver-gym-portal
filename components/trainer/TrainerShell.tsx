"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ClipboardIcon, FileTextIcon, FullPageSpinner, Logo, LogoutIcon } from "@/components/ui";
import { api, session } from "@/lib/api";
import type { TrainerInbox, TrainerMe } from "@/lib/types";
import { handleSignedOut, useRequireSession } from "@/lib/useSession";

type Section = "requests" | "templates";

const NAV: { key: Section; label: string; href: string; Icon: typeof ClipboardIcon }[] = [
  { key: "requests", label: "Requests", href: "/trainer", Icon: ClipboardIcon },
  { key: "templates", label: "Templates", href: "/trainer/templates", Icon: FileTextIcon },
];

// Kept for the session so switching sections does not flash a spinner each time.
let cachedMe: TrainerMe | null = null;

/** Header + section navigation of the trainer's main pages (bottom bar on phones, tabs on md+). */
export default function TrainerShell({
  section,
  badge,
  children,
}: {
  section: Section;
  /** Number shown on the Requests tab (waiting requests). */
  badge?: number;
  children: ReactNode;
}) {
  const router = useRouter();
  const ready = useRequireSession("trainer");
  const [me, setMe] = useState<TrainerMe | null>(cachedMe);
  const [waiting, setWaiting] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!ready) return;
    api<TrainerMe>("/me")
      .then((data) => {
        cachedMe = data;
        setMe(data);
      })
      .catch((err) => handleSignedOut(err, router));
    // Waiting count for the badge (the Requests page passes a fresher one).
    if (badge === undefined) {
      api<TrainerInbox>("/trainer/requests?status=pending&limit=1")
        .then((data) => setWaiting(data.counts.pending))
        .catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, router]);

  const count = badge ?? waiting;

  const signOut = () => {
    cachedMe = null;
    session.clear();
    router.replace("/");
  };

  if (!ready || !me) return <FullPageSpinner />;

  return (
    <main className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <Logo size={36} />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-semibold">{me.displayName}</p>
              <p className="truncate text-xs text-muted">Trainer · {me.branchName || "Silver GYM"}</p>
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

        <nav className="mx-auto hidden max-w-4xl gap-1 px-3 md:flex" aria-label="Sections">
          {NAV.map(({ key, label, href }) => (
            <Link
              key={key}
              href={href}
              replace
              aria-current={section === key ? "page" : undefined}
              className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                section === key ? "text-primary" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {label}
              {key === "requests" && count ? (
                <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-semibold text-white">
                  {count}
                </span>
              ) : null}
              {section === key ? <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary" /> : null}
            </Link>
          ))}
        </nav>
      </header>

      <div className="fade-up mx-auto max-w-4xl px-4 pb-32 pt-4 md:pb-12 md:pt-6">{children}</div>

      <nav
        aria-label="Sections"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <div className="grid grid-cols-2">
          {NAV.map(({ key, label, href, Icon }) => (
            <Link
              key={key}
              href={href}
              replace
              aria-current={section === key ? "page" : undefined}
              className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
                section === key ? "text-primary" : "text-gray-500 active:bg-gray-50"
              }`}
            >
              <span className="relative">
                <Icon className="h-6 w-6" />
                {key === "requests" && count ? (
                  <span className="absolute -right-2.5 -top-1.5 min-w-5 rounded-full border-2 border-white bg-primary px-1 text-center text-[10px] font-semibold leading-4 text-white">
                    {count > 99 ? "99+" : count}
                  </span>
                ) : null}
              </span>
              {label}
              {section === key ? <span className="absolute inset-x-10 top-0 h-0.5 rounded-b-full bg-primary" /> : null}
            </Link>
          ))}
        </div>
      </nav>
    </main>
  );
}
