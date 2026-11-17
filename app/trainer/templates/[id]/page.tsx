"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import RichTextEditor from "@/components/RichTextEditor";
import { Card, Field, FullPageSpinner, PrimaryButton, SecondaryButton, SubPageHeader, fieldCls } from "@/components/ui";
import { api } from "@/lib/api";
import { TITLE_MAX } from "@/lib/plans";
import type { PlanTemplate } from "@/lib/types";
import { errorText, handleSignedOut, useRequireSession } from "@/lib/useSession";

const isBlank = (html: string) => !html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();

/** `/trainer/templates/new` creates; `/trainer/templates/<id>` edits. */
export default function TemplateEditorPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new";
  const ready = useRequireSession("trainer");

  const [loaded, setLoaded] = useState(isNew);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [version, setVersion] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const back = () => router.replace("/trainer/templates");

  useEffect(() => {
    if (!ready || isNew) return;
    api<PlanTemplate>(`/trainer/templates/${id}`)
      .then((t) => {
        setTitle(t.title);
        setContent(t.content);
        setVersion((v) => v + 1);
        setLoaded(true);
      })
      .catch((err) => {
        if (!handleSignedOut(err, router)) setLoadError(errorText(err, "Could not open this template."));
      });
  }, [ready, isNew, id, router]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  if (loadError) {
    return (
      <main className="min-h-dvh">
        <SubPageHeader title="Template" onBack={back} />
        <div className="mx-auto max-w-xl px-4 py-10 text-center">
          <p className="text-sm text-red-600">{loadError}</p>
          <SecondaryButton size="sm" className="mt-3" onClick={back}>
            Back to templates
          </SecondaryButton>
        </div>
      </main>
    );
  }

  if (!ready || !loaded) return <FullPageSpinner />;

  const leave = () => {
    if (dirty && !window.confirm("Leave without saving? Your changes will be lost.")) return;
    back();
  };

  const save = async () => {
    const next: typeof errors = {};
    if (!title.trim()) next.title = "Please give the template a title";
    if (isBlank(content)) next.content = "Please write the template";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      const body = { title: title.trim(), content };
      if (isNew) await api("/trainer/templates", { method: "POST", body });
      else await api(`/trainer/templates/${id}`, { method: "PATCH", body });
      toast.success("Template saved");
      setDirty(false);
      back();
    } catch (err) {
      if (!handleSignedOut(err, router)) toast.error(errorText(err));
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this template? Plans you already sent stay as they are.")) return;
    setDeleting(true);
    try {
      await api(`/trainer/templates/${id}`, { method: "DELETE" });
      toast.success("Template deleted");
      setDirty(false);
      back();
    } catch (err) {
      toast.error(errorText(err));
      setDeleting(false);
    }
  };

  return (
    <main className="min-h-dvh">
      <SubPageHeader
        title={isNew ? "New template" : "Edit template"}
        onBack={leave}
        action={
          !isNew ? (
            <button
              onClick={remove}
              disabled={deleting}
              className="h-10 shrink-0 rounded-lg px-3 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          ) : null
        }
      />

      <div className="fade-up mx-auto max-w-3xl px-4 pb-32 pt-4">
        <Card>
          <Field label="Title" htmlFor="templateTitle" error={errors.title}>
            <input
              id="templateTitle"
              value={title}
              maxLength={TITLE_MAX}
              placeholder="e.g. Weight loss: beginner, 4 weeks"
              onChange={(e) => {
                setTitle(e.target.value);
                setDirty(true);
                setErrors((x) => ({ ...x, title: undefined }));
              }}
              className={fieldCls("md", Boolean(errors.title))}
            />
          </Field>

          <div className="mt-4">
            <p className="mb-1.5 text-sm font-medium text-gray-600">Plan</p>
            <RichTextEditor
              value={content}
              version={version}
              invalid={Boolean(errors.content)}
              placeholder="Write the plan. Use headings for days or meals and lists for items."
              onChange={(html) => {
                setContent(html);
                setDirty(true);
                setErrors((x) => ({ ...x, content: undefined }));
              }}
            />
            {errors.content ? (
              <p role="alert" className="mt-1.5 text-xs text-red-600">
                {errors.content}
              </p>
            ) : null}
          </div>
        </Card>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl gap-2">
          <SecondaryButton className="flex-1 sm:flex-none" onClick={leave}>
            Cancel
          </SecondaryButton>
          <PrimaryButton className="flex-1" loading={saving} onClick={save}>
            Save template
          </PrimaryButton>
        </div>
      </div>
    </main>
  );
}
