"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import TrainerShell from "@/components/trainer/TrainerShell";
import { ChevronRightIcon, FileTextIcon, PlusIcon, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { fmtDate } from "@/lib/format";
import type { PlanTemplate } from "@/lib/types";
import { errorText, handleSignedOut } from "@/lib/useSession";

/** First words of a template, for the list. */
const preview = (html: string) =>
  html
    .replace(/<\/(p|h2|h3|li)>/g, " · ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/(\s·\s)+/g, " · ")
    .replace(/^\s·\s|\s·\s$/g, "")
    .trim()
    .slice(0, 140);

export default function TrainerTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<PlanTemplate[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<PlanTemplate[]>("/trainer/templates")
      .then(setTemplates)
      .catch((err) => {
        if (!handleSignedOut(err, router)) setError(errorText(err, "Could not load your templates."));
      });
  }, [router]);

  return (
    <TrainerShell section="templates">
      <div className="flex items-start justify-between gap-3 px-1">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">My templates</h1>
          <p className="text-sm text-muted">Ready-made plans you can send and change for each member. Only you can see them.</p>
        </div>
        <Link
          href="/trainer/templates/new"
          className="hidden h-10 shrink-0 items-center gap-2 rounded-lg bg-primary px-3.5 text-sm font-medium text-white transition-colors hover:bg-primary-600 sm:inline-flex"
        >
          <PlusIcon className="h-4 w-4" />
          New template
        </Link>
      </div>

      <div className="mt-4">
        {error ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : !templates ? (
          <div className="flex justify-center py-16 text-primary">
            <Spinner className="h-6 w-6" />
          </div>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
            <FileTextIcon className="h-8 w-8 text-gray-300" />
            <p className="mt-2 text-sm text-muted">
              No templates yet. Write your common diet and workout plans once, then reuse them.
            </p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {templates.map((t) => (
              <li key={t._id}>
                <Link
                  href={`/trainer/templates/${t._id}`}
                  className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 transition-colors active:bg-gray-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{t.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-sm text-muted">{preview(t.content)}</p>
                    <p className="mt-1 text-xs text-gray-400">Updated {fmtDate(t.updatedAt)}</p>
                  </div>
                  <ChevronRightIcon className="h-5 w-5 shrink-0 text-gray-400" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Phones: floating add button above the bottom bar */}
      <Link
        href="/trainer/templates/new"
        aria-label="New template"
        className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-colors active:bg-primary-700 sm:hidden"
      >
        <PlusIcon className="h-6 w-6" />
      </Link>
    </TrainerShell>
  );
}
