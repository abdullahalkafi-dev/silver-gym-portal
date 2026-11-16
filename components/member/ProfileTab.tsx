"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Card, PrimaryButton, StatusPill, inputCls } from "@/components/ui";
import { ApiError, api, photoUrl } from "@/lib/api";
import { fmtDate } from "@/lib/format";
import type { MemberMe, MemberProfile, UpdateRequest, UpdateRequestState } from "@/lib/types";
import { Avatar } from "./OverviewTab";

const GOALS = [
  "Yoga",
  "Cardio Endurance",
  "Bodybuilding",
  "Muscle Gain",
  "Flexibility & Mobility",
  "General Fitness",
  "Strength Training",
];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const LABELS: Record<string, string> = {
  fullName: "Full name",
  email: "Email",
  dateOfBirth: "Date of birth",
  country: "Country",
  nid: "NID",
  gender: "Gender",
  bloodGroup: "Blood group",
  address: "Address",
  height: "Height",
  weight: "Weight",
  emergencyContact: "Emergency contact",
  trainingGoals: "Training goals",
};

const describe = (key: string, value: unknown): string => {
  if (value == null || value === "") return "-";
  switch (key) {
    case "dateOfBirth":
      return fmtDate(String(value));
    case "height":
    case "weight": {
      const v = value as { value: number; unit: string };
      return `${v.value} ${v.unit}`;
    }
    case "emergencyContact": {
      const v = value as { relationship?: string; contactNumber?: string };
      return [v.relationship, v.contactNumber].filter(Boolean).join(" - ");
    }
    case "trainingGoals":
      return (value as string[]).join(", ");
    default:
      return String(value);
  }
};

type FormState = {
  fullName: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  country: string;
  nid: string;
  address: string;
  heightValue: string;
  heightUnit: string;
  weightValue: string;
  weightUnit: string;
  ecRelationship: string;
  ecNumber: string;
  goals: string[];
};

const dateInput = (iso?: string | null) => (iso ? new Date(iso).toISOString().slice(0, 10) : "");

/** Starting form values: the saved profile, with anything already requested laid on top. */
const buildForm = (p: MemberProfile, pending: UpdateRequest | null): FormState => {
  const req = (key: string) => pending?.changes?.[key]?.new as any;
  const h = req("height");
  const w = req("weight");
  const ec = req("emergencyContact");
  return {
    fullName: req("fullName") ?? p.fullName ?? "",
    email: req("email") ?? p.email ?? "",
    dateOfBirth: dateInput(req("dateOfBirth") ?? p.dateOfBirth),
    gender: req("gender") ?? p.gender ?? "",
    bloodGroup: req("bloodGroup") ?? p.bloodGroup ?? "",
    country: req("country") ?? p.country ?? "",
    nid: req("nid") ?? p.nid ?? "",
    address: req("address") ?? p.address ?? "",
    heightValue: String(h?.value ?? p.height ?? ""),
    heightUnit: h?.unit ?? p.heightUnit ?? "cm",
    weightValue: String(w?.value ?? p.weight ?? ""),
    weightUnit: w?.unit ?? p.weightUnit ?? "kg",
    ecRelationship: ec?.relationship ?? p.emergencyContact?.relationship ?? "",
    ecNumber: ec?.contactNumber ?? p.emergencyContact?.contactNumber ?? "",
    goals: req("trainingGoals") ?? p.trainingGoals ?? [],
  };
};

/**
 * Only fields that have a value AND differ from the saved profile are sent.
 * Empty inputs are ignored (a member cannot blank a field out).
 */
const buildChanges = (f: FormState, p: MemberProfile) => {
  const changes: Record<string, unknown> = {};
  const text = (key: "fullName" | "email" | "country" | "nid" | "gender" | "bloodGroup" | "address") => {
    const value = f[key].trim();
    if (value && value !== (p[key] ?? "")) changes[key] = value;
  };
  (["fullName", "email", "country", "nid", "gender", "bloodGroup", "address"] as const).forEach(text);

  if (f.dateOfBirth && f.dateOfBirth !== dateInput(p.dateOfBirth)) changes.dateOfBirth = f.dateOfBirth;

  const h = Number(f.heightValue);
  if (f.heightValue && h > 0 && (h !== p.height || f.heightUnit !== p.heightUnit)) {
    changes.height = { value: h, unit: f.heightUnit };
  }
  const w = Number(f.weightValue);
  if (f.weightValue && w > 0 && (w !== p.weight || f.weightUnit !== p.weightUnit)) {
    changes.weight = { value: w, unit: f.weightUnit };
  }

  const rel = f.ecRelationship.trim();
  const num = f.ecNumber.trim();
  const savedRel = p.emergencyContact?.relationship ?? "";
  const savedNum = p.emergencyContact?.contactNumber ?? "";
  if ((rel || num) && (rel !== savedRel || num !== savedNum)) {
    changes.emergencyContact = { relationship: rel, contactNumber: num };
  }

  const savedGoals = [...(p.trainingGoals ?? [])].sort().join("|");
  if (f.goals.length && [...f.goals].sort().join("|") !== savedGoals) changes.trainingGoals = f.goals;

  return changes;
};

function ReadOnlyRow({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-3 last:border-0">
      <div>
        <p className="text-sm text-muted">{label}</p>
        {hint ? <p className="mt-0.5 text-xs text-muted/80">{hint}</p> : null}
      </div>
      <p className="max-w-[60%] text-right text-sm font-medium text-ink">{value}</p>
    </div>
  );
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export default function ProfileTab({
  me,
  request,
  onRequestChanged,
}: {
  me: MemberMe;
  request: UpdateRequestState;
  onRequestChanged: () => Promise<void>;
}) {
  const p = me.profile;
  const [form, setForm] = useState<FormState>(() => buildForm(p, request.pending));
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Rebuild the form when the saved request changes (after send/cancel).
  const pendingStamp = request.pending?.updatedAt ?? "none";
  useEffect(() => {
    setForm(buildForm(p, request.pending));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingStamp, p.id]);

  useEffect(() => {
    if (!photo) {
      setPhotoPreview(null);
      return;
    }
    const url = URL.createObjectURL(photo);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const set =
    (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const pickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo must be 5 MB or smaller");
      e.target.value = "";
      return;
    }
    setPhoto(file);
  };

  const changes = useMemo(() => buildChanges(form, p), [form, p]);
  const changeCount = Object.keys(changes).length + (photo ? 1 : 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (changeCount === 0) {
      return setError("Change at least one detail before sending.");
    }
    const ec = changes.emergencyContact as { relationship: string; contactNumber: string } | undefined;
    if (ec && (!ec.relationship || !ec.contactNumber)) {
      return setError("Please enter both the relationship and the phone number for the emergency contact.");
    }

    const body = new FormData();
    body.append("data", JSON.stringify(changes));
    if (photo) body.append("image", photo);

    setSaving(true);
    try {
      await api("/update-request", { method: "POST", form: body });
      toast.success("Sent! The gym will review your update.");
      setPhoto(null);
      if (fileRef.current) fileRef.current.value = "";
      await onRequestChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send your request.");
    } finally {
      setSaving(false);
    }
  };

  const cancel = async () => {
    setCancelling(true);
    try {
      await api("/update-request", { method: "DELETE" });
      toast.success("Request cancelled");
      setPhoto(null);
      await onRequestChanged();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not cancel the request.");
    } finally {
      setCancelling(false);
    }
  };

  const pending = request.pending;
  const pendingEntries = pending ? Object.entries(pending.changes ?? {}) : [];
  const latest = request.latest;

  return (
    <div className="space-y-5">
      {/* Pending request banner */}
      {pending ? (
        <div className="rounded-2xl border border-purple/25 bg-purple-soft p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-purple">Your update request is waiting for review</p>
              <p className="mt-0.5 text-xs text-muted">
                Your profile changes only after the gym confirms it.
              </p>
            </div>
            <button
              onClick={cancel}
              disabled={cancelling || pending.status === "processing"}
              className="rounded-lg border border-purple/30 bg-white px-3 py-1.5 text-xs font-medium text-purple transition hover:bg-white/70 disabled:opacity-60"
            >
              {cancelling ? "Cancelling..." : "Cancel request"}
            </button>
          </div>
          <ul className="mt-3 space-y-1 text-sm">
            {pending.photo?.newKey ? (
              <li className="flex items-center gap-2">
                <span className="text-muted">New photo</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoUrl(pending.photo.newKey)} alt="" className="h-8 w-8 rounded-lg object-cover" />
              </li>
            ) : null}
            {pendingEntries.map(([key, change]) => (
              <li key={key} className="flex flex-wrap gap-x-2">
                <span className="text-muted">{LABELS[key] ?? key}:</span>
                <span className="font-medium">{describe(key, change.new)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : latest ? (
        <div className="rounded-2xl border border-line bg-white px-5 py-3.5 text-sm">
          <span className="text-muted">Last update request: </span>
          {latest.status === "approved" ? (
            <StatusPill tone="green">Approved</StatusPill>
          ) : latest.status === "partially_approved" ? (
            <StatusPill tone="amber">Partly approved</StatusPill>
          ) : (
            <StatusPill tone="red">Not approved</StatusPill>
          )}{" "}
          <span className="text-muted">on {fmtDate(latest.reviewedAt)}</span>
        </div>
      ) : null}

      {/* Current details */}
      <Card>
        <div className="mb-2 flex items-center gap-4">
          <Avatar name={p.fullName} photo={p.photo} size={64} />
          <div>
            <h2 className="text-base font-semibold">My profile</h2>
            <p className="text-xs text-muted">Details the gym has on file</p>
          </div>
        </div>
        <ReadOnlyRow
          label="Phone number"
          value={p.contact ?? "-"}
          hint="Cannot be changed here. Please ask the front desk."
        />
        <ReadOnlyRow label="Full name" value={p.fullName} />
        <ReadOnlyRow label="Email" value={p.email ?? "-"} />
        <ReadOnlyRow label="Date of birth" value={fmtDate(p.dateOfBirth)} />
        <ReadOnlyRow label="Gender" value={p.gender ?? "-"} />
        <ReadOnlyRow label="Blood group" value={p.bloodGroup ?? "-"} />
        <ReadOnlyRow label="Country" value={p.country ?? "-"} />
        <ReadOnlyRow label="NID" value={p.nid ?? "-"} />
        <ReadOnlyRow label="Address" value={p.address ?? "-"} />
        <ReadOnlyRow label="Height" value={p.height ? `${p.height} ${p.heightUnit ?? ""}` : "-"} />
        <ReadOnlyRow label="Weight" value={p.weight ? `${p.weight} ${p.weightUnit ?? ""}` : "-"} />
        <ReadOnlyRow
          label="Emergency contact"
          value={
            [p.emergencyContact?.relationship, p.emergencyContact?.contactNumber]
              .filter(Boolean)
              .join(" - ") || "-"
          }
        />
        <ReadOnlyRow label="Training goals" value={p.trainingGoals.join(", ") || "-"} />
      </Card>

      {/* Request form */}
      <Card>
        <h2 className="text-base font-semibold">Request a profile update</h2>
        <p className="mt-1 text-sm text-muted">
          Fill in or correct what you like. The gym checks your request before your profile is
          updated. Fields you do not touch stay as they are.
        </p>

        <form onSubmit={submit} className="mt-5 space-y-5" noValidate>
          {/* Photo */}
          <div className="flex items-center gap-4 rounded-xl bg-surface p-4">
            {photoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoPreview} alt="New photo preview" className="h-20 w-20 rounded-2xl object-cover" />
            ) : (
              <Avatar name={p.fullName} photo={p.photo} size={80} />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium">Profile photo</p>
              <p className="text-xs text-muted">JPG, PNG or WEBP, up to 5 MB.</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-purple transition hover:bg-purple-soft"
                >
                  {p.photo || photo ? "Choose another photo" : "Upload photo"}
                </button>
                {photo ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPhoto(null);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted hover:text-ink"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={pickPhoto}
                className="hidden"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name">
              <input className={inputCls} value={form.fullName} onChange={set("fullName")} />
            </Field>
            <Field label="Email">
              <input className={inputCls} type="email" value={form.email} onChange={set("email")} placeholder="name@example.com" />
            </Field>
            <Field label="Date of birth">
              <input className={inputCls} type="date" value={form.dateOfBirth} onChange={set("dateOfBirth")} max={new Date().toISOString().slice(0, 10)} />
            </Field>
            <Field label="Gender">
              <select className={inputCls} value={form.gender} onChange={set("gender")}>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </Field>
            <Field label="Blood group">
              <select className={inputCls} value={form.bloodGroup} onChange={set("bloodGroup")}>
                <option value="">Select</option>
                {BLOOD_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Country">
              <input className={inputCls} value={form.country} onChange={set("country")} placeholder="Bangladesh" />
            </Field>
            <Field label="NID number">
              <input className={inputCls} value={form.nid} onChange={set("nid")} inputMode="numeric" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Address">
                <textarea className={`${inputCls} min-h-[84px] resize-y`} value={form.address} onChange={set("address")} />
              </Field>
            </div>

            <Field label="Height">
              <div className="flex gap-2">
                <input className={`${inputCls} flex-1`} type="number" min="0" step="any" value={form.heightValue} onChange={set("heightValue")} placeholder="0" />
                <select className={`${inputCls} w-24`} value={form.heightUnit} onChange={set("heightUnit")}>
                  <option value="cm">cm</option>
                  <option value="in">in</option>
                  <option value="ft">ft</option>
                </select>
              </div>
            </Field>
            <Field label="Weight">
              <div className="flex gap-2">
                <input className={`${inputCls} flex-1`} type="number" min="0" step="any" value={form.weightValue} onChange={set("weightValue")} placeholder="0" />
                <select className={`${inputCls} w-24`} value={form.weightUnit} onChange={set("weightUnit")}>
                  <option value="kg">kg</option>
                  <option value="lb">lb</option>
                </select>
              </div>
            </Field>

            <Field label="Emergency contact: relationship">
              <input className={inputCls} value={form.ecRelationship} onChange={set("ecRelationship")} placeholder="e.g. Brother" />
            </Field>
            <Field label="Emergency contact: phone">
              <input className={inputCls} value={form.ecNumber} onChange={set("ecNumber")} placeholder="01XXXXXXXXX" inputMode="tel" />
            </Field>
          </div>

          <div>
            <span className="mb-2 block text-sm font-medium">Training goals</span>
            <div className="flex flex-wrap gap-2">
              {GOALS.map((goal) => {
                const on = form.goals.includes(goal);
                return (
                  <button
                    key={goal}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        goals: on ? prev.goals.filter((g) => g !== goal) : [...prev.goals, goal],
                      }))
                    }
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                      on
                        ? "border-purple bg-purple text-white"
                        : "border-line bg-white text-ink hover:border-purple/50"
                    }`}
                  >
                    {goal}
                  </button>
                );
              })}
            </div>
          </div>

          {error ? (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <p className="text-xs text-muted">
              {changeCount > 0
                ? `${changeCount} change${changeCount > 1 ? "s" : ""} to send`
                : "No changes yet"}
            </p>
            <PrimaryButton type="submit" loading={saving} disabled={changeCount === 0}>
              {saving ? "Sending..." : pending ? "Update my request" : "Send for review"}
            </PrimaryButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
