"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { Avatar } from "@/components/member/OverviewTab";
import PlanContent from "@/components/PlanContent";
import RichTextEditor from "@/components/RichTextEditor";
import Sheet from "@/components/Sheet";
import TemplatePicker from "@/components/trainer/TemplatePicker";
import {
  Card,
  Field,
  FileTextIcon,
  FullPageSpinner,
  PrimaryButton,
  SecondaryButton,
  StatusPill,
  SubPageHeader,
  fieldCls,
} from "@/components/ui";
import { api } from "@/lib/api";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { STATUS_LABEL, STATUS_TONE, TITLE_MAX, fmtHeight, fmtWeight } from "@/lib/plans";
import type { PlanRequest, PlanTemplate } from "@/lib/types";
import { errorText, handleSignedOut, useRequireSession } from "@/lib/useSession";

const isBlank = (html: string) => !html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();

export default function TrainerRequestPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const ready = useRequireSession("trainer");

  const [request, setRequest] = useState<PlanRequest | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Reply editor
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [version, setVersion] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Decline
  const [declineOpen, setDeclineOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [declining, setDeclining] = useState(false);

  const back = () => router.replace("/trainer");

  useEffect(() => {
    if (!ready) return;
    api<PlanRequest>(`/trainer/requests/${id}`)
      .then((r) => {
        setRequest(r);
        if (r.status === "pending") {
          setEditing(true);
          setTitle(r.topic);
        }
      })
      .catch((err) => {
        if (!handleSignedOut(err, router)) setLoadError(errorText(err, "Could not open this request."));
      });
  }, [ready, id, router]);

  // Warn before leaving with an unsent plan.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  if (loadError) {
    return (
      <main className="min-h-dvh">
        <SubPageHeader title="Request" onBack={back} />
        <div className="mx-auto max-w-xl px-4 py-10 text-center">
          <p className="text-sm text-red-600">{loadError}</p>
          <SecondaryButton size="sm" className="mt-3" onClick={back}>
            Back to requests
          </SecondaryButton>
        </div>
      </main>
    );
  }

  if (!ready || !request) return <FullPageSpinner />;

  const r = request;
  const s = r.memberSnapshot;
  const canReply = r.status === "pending" || r.status === "answered";

  const leave = () => {
    if (dirty && !window.confirm("Leave without sending? Your changes will be lost.")) return;
    back();
  };

  const startEdit = () => {
    setTitle(r.reply?.title || r.topic);
    setContent(r.reply?.content || "");
    setVersion((v) => v + 1);
    setDirty(false);
    setEditing(true);
  };

  const pickTemplate = (t: PlanTemplate) => {
    if (!isBlank(content) && !window.confirm("Replace the text you wrote with this template?")) return;
    setContent(t.content);
    setVersion((v) => v + 1);
    // The title stays the member's topic: template names are the trainer's private labels.
    if (!title.trim()) setTitle(r.topic);
    setDirty(true);
    setContentError(null);
    setPickerOpen(false);
    toast.success("Template added. Change anything you need for this member.");
  };

  const save = async () => {
    if (isBlank(content)) {
      setContentError("Please write the plan before sending");
      return;
    }
    setSaving(true);
    try {
      const updated = await api<PlanRequest>(`/trainer/requests/${r._id}/reply`, {
        method: "PUT",
        body: { title: title.trim() || undefined, content },
      });
      toast.success(r.status === "pending" ? "Plan sent to the member" : "Plan updated");
      setRequest(updated);
      setEditing(false);
      setDirty(false);
    } catch (err) {
      if (!handleSignedOut(err, router)) toast.error(errorText(err));
    } finally {
      setSaving(false);
    }
  };

  const saveAsTemplate = async () => {
    if (isBlank(content)) {
      setContentError("Write something first, then save it as a template");
      return;
    }
    setSavingTemplate(true);
    try {
      await api("/trainer/templates", {
        method: "POST",
        body: { title: (title.trim() || r.topic).slice(0, TITLE_MAX), content },
      });
      toast.success("Saved to your templates");
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setSavingTemplate(false);
    }
  };

  const decline = async () => {
    if (!reason.trim()) {
      toast.error("Please write a short reason");
      return;
    }
    setDeclining(true);
    try {
      const updated = await api<PlanRequest>(`/trainer/requests/${r._id}/decline`, {
        method: "POST",
        body: { reason: reason.trim() },
      });
      toast.success("Request declined");
      setRequest(updated);
      setEditing(false);
      setDirty(false);
      setDeclineOpen(false);
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setDeclining(false);
    }
  };

  return (
    <main className="min-h-dvh">
      <SubPageHeader
        title={s.fullName || "Member"}
        subtitle={r.topic}
        onBack={leave}
        action={<StatusPill tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</StatusPill>}
      />

      <div className={`fade-up mx-auto max-w-3xl space-y-4 px-4 pt-4 ${editing ? "pb-40" : "pb-16"}`}>
        {/* Member */}
        <Card>
          <div className="flex items-center gap-3.5">
            <Avatar name={s.fullName || "?"} photo={s.photo} size={56} />
            <div className="min-w-0">
              <p className="truncate text-base font-semibold">{s.fullName || "Member"}</p>
              <p className="text-sm text-muted">Member ID {s.memberId || "-"}</p>
            </div>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <Fact label="Height" value={fmtHeight(s)} />
            <Fact label="Weight" value={fmtWeight(s)} />
            <Fact label="Age" value={s.age !== undefined ? `${s.age} years` : "-"} />
            <Fact label="Gender" value={s.gender || "-"} />
            <Fact label="Blood group" value={s.bloodGroup || "-"} />
            <Fact label="Asked on" value={fmtDate(r.createdAt)} />
            {s.trainingGoals?.length ? (
              <div className="col-span-2 rounded-xl bg-gray-50 px-3.5 py-3 sm:col-span-3">
                <dt className="text-xs text-muted">Goals</dt>
                <dd className="mt-0.5 text-sm font-semibold">{s.trainingGoals.join(", ")}</dd>
              </div>
            ) : null}
          </dl>
        </Card>

        {/* What they asked */}
        <Card>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Asked for</h2>
          <p className="mt-1 text-lg font-semibold">{r.topic}</p>
          {r.note ? (
            <p className="mt-3 whitespace-pre-line rounded-xl bg-gray-50 p-3.5 text-[15px] leading-relaxed">{r.note}</p>
          ) : (
            <p className="mt-2 text-sm text-muted">The member did not add a note.</p>
          )}
        </Card>

        {/* Reply */}
        {editing && canReply ? (
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold">{r.status === "answered" ? "Edit the plan" : "Your plan"}</h2>
              <SecondaryButton size="sm" type="button" onClick={() => setPickerOpen(true)}>
                <FileTextIcon className="h-4 w-4" />
                Use a template
              </SecondaryButton>
            </div>

            <Field label="Title" htmlFor="planTitle" className="mt-4">
              <input
                id="planTitle"
                value={title}
                maxLength={TITLE_MAX}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setDirty(true);
                }}
                className={fieldCls()}
              />
            </Field>

            <div className="mt-4">
              <p className="mb-1.5 text-sm font-medium text-gray-600">Plan</p>
              <RichTextEditor
                value={content}
                version={version}
                invalid={Boolean(contentError)}
                onChange={(html) => {
                  setContent(html);
                  setDirty(true);
                  setContentError(null);
                }}
              />
              {contentError ? (
                <p role="alert" className="mt-1.5 text-xs text-red-600">
                  {contentError}
                </p>
              ) : null}
            </div>

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
              <button
                type="button"
                onClick={saveAsTemplate}
                disabled={savingTemplate}
                className="min-h-10 text-sm font-medium text-primary disabled:opacity-60"
              >
                {savingTemplate ? "Saving..." : "Save as a new template"}
              </button>
              {r.status === "pending" ? (
                <button
                  type="button"
                  onClick={() => setDeclineOpen(true)}
                  className="min-h-10 text-sm font-medium text-red-600"
                >
                  Decline request
                </button>
              ) : null}
            </div>
          </Card>
        ) : r.status === "answered" && r.reply ? (
          <Card className="sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold">{r.reply.title || r.topic}</h2>
                <p className="text-xs text-muted">
                  Sent {fmtDateTime(r.reply.sentAt)}
                  {r.reply.editedAt ? ` · Updated ${fmtDateTime(r.reply.editedAt)}` : ""}
                </p>
              </div>
              <SecondaryButton size="sm" onClick={startEdit}>
                Edit plan
              </SecondaryButton>
            </div>
            <PlanContent html={r.reply.content} className="mt-4" />
          </Card>
        ) : r.status === "declined" ? (
          <Card>
            <h2 className="text-sm font-semibold text-gray-700">You declined this request</h2>
            {r.declineReason ? <p className="mt-2 text-sm text-gray-700">{r.declineReason}</p> : null}
          </Card>
        ) : r.status === "cancelled" ? (
          <Card>
            <p className="text-sm text-gray-700">The member cancelled this request.</p>
          </Card>
        ) : null}
      </div>

      {editing && canReply ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur">
          <div className="mx-auto flex max-w-3xl gap-2">
            {r.status === "answered" ? (
              <SecondaryButton
                className="flex-1 sm:flex-none"
                onClick={() => {
                  if (dirty && !window.confirm("Discard your changes?")) return;
                  setEditing(false);
                  setDirty(false);
                }}
              >
                Cancel
              </SecondaryButton>
            ) : null}
            <PrimaryButton className="flex-1" loading={saving} onClick={save}>
              {r.status === "answered" ? "Save changes" : "Send plan"}
            </PrimaryButton>
          </div>
        </div>
      ) : null}

      <TemplatePicker open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={pickTemplate} />

      <Sheet
        open={declineOpen}
        title="Decline request"
        onClose={() => setDeclineOpen(false)}
        footer={
          <div className="flex gap-2">
            <SecondaryButton className="flex-1" onClick={() => setDeclineOpen(false)}>
              Back
            </SecondaryButton>
            <PrimaryButton className="flex-1 bg-red-600! hover:bg-red-700!" loading={declining} onClick={decline}>
              Decline
            </PrimaryButton>
          </div>
        }
      >
        <Field label="Reason (the member will see this)" htmlFor="declineReason" hint={`${reason.length}/300`}>
          <textarea
            id="declineReason"
            rows={4}
            maxLength={300}
            value={reason}
            placeholder="e.g. Please see a doctor about your knee first, then ask again."
            onChange={(e) => setReason(e.target.value)}
            className={fieldCls("area")}
          />
        </Field>
      </Sheet>
    </main>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 px-3.5 py-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 truncate text-sm font-semibold">{value}</dd>
    </div>
  );
}
