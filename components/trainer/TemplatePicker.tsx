"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import Sheet from "@/components/Sheet";
import { ChevronRightIcon, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { fmtDate } from "@/lib/format";
import type { PlanTemplate } from "@/lib/types";
import { errorText } from "@/lib/useSession";

/** Lists the trainer's own templates; picking one hands it back to the editor. */
export default function TemplatePicker({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (template: PlanTemplate) => void;
}) {
  const [templates, setTemplates] = useState<PlanTemplate[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    api<PlanTemplate[]>("/trainer/templates")
      .then(setTemplates)
      .catch((err) => setError(errorText(err, "Could not load your templates.")));
  }, [open]);

  return (
    <Sheet open={open} title="Use a template" onClose={onClose}>
      {error ? (
        <p className="py-6 text-center text-sm text-red-600">{error}</p>
      ) : !templates ? (
        <div className="flex justify-center py-10 text-primary">
          <Spinner className="h-6 w-6" />
        </div>
      ) : templates.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted">
          You have no templates yet.
          <br />
          <Link href="/trainer/templates/new" className="mt-2 inline-block font-medium text-primary">
            Create your first template
          </Link>
        </div>
      ) : (
        <ul className="-mx-1 divide-y divide-gray-100">
          {templates.map((t) => (
            <li key={t._id}>
              <button
                onClick={() => onPick(t)}
                className="flex min-h-14 w-full items-center gap-3 rounded-lg px-1 py-2.5 text-left active:bg-gray-50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{t.title}</p>
                  <p className="text-xs text-muted">Updated {fmtDate(t.updatedAt)}</p>
                </div>
                <ChevronRightIcon className="h-5 w-5 shrink-0 text-gray-400" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
