"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import {
  CameraIcon,
  Card,
  DatePartsInput,
  Field,
  LockIcon,
  PrimaryButton,
  SecondaryButton,
  SelectInput,
  StatusPill,
  UnitInput,
  fieldCls,
} from "@/components/ui";
import { ApiError, api, photoUrl } from "@/lib/api";
import { fmtDate } from "@/lib/format";
import { prepareProfilePhoto } from "@/lib/image";
import {
  BLOOD_GROUPS,
  COUNTRIES,
  GENDERS,
  HEIGHT_UNITS,
  RELATIONSHIPS,
  TRAINING_GOALS,
  WEIGHT_UNITS,
} from "@/lib/options";
import type { MemberMe, MemberProfile, UpdateRequest, UpdateRequestState } from "@/lib/types";
import { Avatar } from "./OverviewTab";

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

type Errors = Partial<Record<"fullName" | "email" | "dateOfBirth" | "height" | "weight" | "ecRelationship" | "ecNumber", string>>;

/** Dates are shown and compared in Bangladesh time, the same as everywhere else in the system. */
const dhakaDate = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
};

/** Starting form values: the saved profile, with anything already requested laid on top. */
const buildForm = (p: MemberProfile, pending: UpdateRequest | null): FormState => {
  const req = (key: string) => pending?.changes?.[key]?.new as any;
  const h = req("height");
  const w = req("weight");
  const ec = req("emergencyContact");
  return {
    fullName: req("fullName") ?? p.fullName ?? "",
    email: req("email") ?? p.email ?? "",
    dateOfBirth: dhakaDate(req("dateOfBirth") ?? p.dateOfBirth),
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

  if (f.dateOfBirth && f.dateOfBirth !== dhakaDate(p.dateOfBirth)) changes.dateOfBirth = f.dateOfBirth;

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

const MAX_HEIGHT: Record<string, number> = { cm: 260, in: 100, ft: 9 };
const MAX_WEIGHT: Record<string, number> = { kg: 400, lb: 880 };

/** Friendly checks before sending, shown under the field that needs fixing. */
const validate = (f: FormState): Errors => {
  const errors: Errors = {};
  if (!f.fullName.trim()) errors.fullName = "Your name cannot be empty.";
  if (f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }
  if (f.dateOfBirth && new Date(f.dateOfBirth) >= new Date()) {
    errors.dateOfBirth = "Date of birth must be in the past.";
  }
  if (f.heightValue) {
    const n = Number(f.heightValue);
    if (!(n > 0) || n > (MAX_HEIGHT[f.heightUnit] ?? 1000)) errors.height = `That height does not look right. Please check the number and unit.`;
  }
  if (f.weightValue) {
    const n = Number(f.weightValue);
    if (!(n > 0) || n > (MAX_WEIGHT[f.weightUnit] ?? 1000)) errors.weight = `That weight does not look right. Please check the number and unit.`;
  }
  const rel = f.ecRelationship.trim();
  const num = f.ecNumber.replace(/[\s-]/g, "");
  if (rel || num) {
    if (!rel) errors.ecRelationship = "Please choose the relationship.";
    if (!num) errors.ecNumber = "Please enter the phone number.";
    else if (!/^(\+?88)?01[3-9]\d{8}$/.test(num)) errors.ecNumber = "Enter a valid mobile number, like 01XXXXXXXXX.";
  }
  return errors;
};

const FIELD_IDS: Record<keyof Errors, string> = {
  fullName: "fullName",
  email: "email",
  dateOfBirth: "dob",
  height: "height",
  weight: "weight",
  ecRelationship: "ecRelationship",
  ecNumber: "ecNumber",
};

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <Card>
      <h2 className="text-base font-semibold">{title}</h2>
      {hint ? <p className="mt-0.5 text-sm text-muted">{hint}</p> : null}
      <div className="mt-4">{children}</div>
    </Card>
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
  const [photoBusy, setPhotoBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Rebuild the form when the saved request changes (after send/cancel).
  const pendingStamp = request.pending?.updatedAt ?? "none";
  useEffect(() => {
    setForm(buildForm(p, request.pending));
    setErrors({});
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

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors({});
  };

  const pickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoBusy(true);
    try {
      const ready = await prepareProfilePhoto(file);
      if (ready.size > 5 * 1024 * 1024) {
        toast.error("This photo is too large. Please choose a smaller one.");
        return;
      }
      setPhoto(ready);
    } finally {
      setPhotoBusy(false);
    }
  };

  const changes = useMemo(() => buildChanges(form, p), [form, p]);
  const changeCount = Object.keys(changes).length + (photo ? 1 : 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (changeCount === 0) {
      return setError("Change at least one detail before sending.");
    }

    const found = validate(form);
    const firstKey = (Object.keys(found) as (keyof Errors)[])[0];
    if (firstKey) {
      setErrors(found);
      document.getElementById(FIELD_IDS[firstKey])?.focus();
      return;
    }

    const body = new FormData();
    body.append("data", JSON.stringify(changes));
    if (photo) body.append("image", photo);

    setSaving(true);
    try {
      await api("/update-request", { method: "POST", form: body });
      toast.success("Sent! The gym will review your update.");
      setPhoto(null);
      await onRequestChanged();
      window.scrollTo({ top: 0, behavior: "smooth" });
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
    <form onSubmit={submit} noValidate className="space-y-4">
      {/* Pending request banner */}
      {pending ? (
        <div className="rounded-2xl border border-primary-200 bg-primary-50 p-4">
          <p className="text-sm font-semibold text-primary-800">Your update request is waiting for review</p>
          <p className="mt-0.5 text-sm text-primary-700/80">Your profile changes only after the gym confirms it.</p>
          <ul className="mt-3 space-y-1 text-sm">
            {pending.photo?.newKey ? (
              <li className="flex items-center gap-2">
                <span className="text-gray-500">New photo</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoUrl(pending.photo.newKey)} alt="" className="h-8 w-8 rounded-lg object-cover" />
              </li>
            ) : null}
            {pendingEntries.map(([key, change]) => (
              <li key={key} className="flex flex-wrap gap-x-2">
                <span className="text-gray-500">{LABELS[key] ?? key}:</span>
                <span className="font-medium">{describe(key, change.new)}</span>
              </li>
            ))}
          </ul>
          <SecondaryButton
            type="button"
            size="sm"
            onClick={cancel}
            loading={cancelling}
            disabled={pending.status === "processing"}
            className="mt-3 w-full sm:w-auto"
          >
            Cancel request
          </SecondaryButton>
        </div>
      ) : latest ? (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm">
          <span className="text-muted">Last update request:</span>
          {latest.status === "approved" ? (
            <StatusPill tone="green">Approved</StatusPill>
          ) : latest.status === "partially_approved" ? (
            <StatusPill tone="amber">Partly approved</StatusPill>
          ) : (
            <StatusPill tone="red">Not approved</StatusPill>
          )}
          <span className="text-muted">on {fmtDate(latest.reviewedAt)}</span>
        </div>
      ) : null}

      {/* Photo + locked phone */}
      <Card>
        <div className="flex items-center gap-4">
          {photoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoPreview} alt="New photo preview" className="h-20 w-20 shrink-0 rounded-2xl object-cover" />
          ) : (
            <Avatar name={p.fullName} photo={p.photo} size={80} />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Profile photo</p>
            <p className="text-xs text-muted">A clear picture of your face.</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <SecondaryButton type="button" size="sm" onClick={() => fileRef.current?.click()} loading={photoBusy}>
                <CameraIcon className="h-4 w-4" />
                {p.photo || photo ? "Change photo" : "Add photo"}
              </SecondaryButton>
              {photo ? (
                <button
                  type="button"
                  onClick={() => setPhoto(null)}
                  className="h-10 rounded-lg px-3 text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  Remove
                </button>
              ) : null}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={pickPhoto} className="hidden" />
          </div>
        </div>

        <div className="mt-5">
          <Field
            label="Phone number"
            htmlFor="phone"
            hint="Your phone number cannot be changed here. Please ask the front desk."
          >
            <div className="relative">
              <input id="phone" value={p.contact ?? "-"} disabled readOnly className={`${fieldCls("md")} pr-11`} />
              <LockIcon className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </Field>
        </div>
      </Card>

      <Section title="Personal details" hint="Fix or add anything you like. Fields you do not touch stay as they are.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" htmlFor="fullName" error={errors.fullName} className="sm:col-span-2">
            <input
              id="fullName"
              className={fieldCls("md", Boolean(errors.fullName))}
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              autoComplete="name"
            />
          </Field>
          <Field label="Email" htmlFor="email" error={errors.email}>
            <input
              id="email"
              type="email"
              className={fieldCls("md", Boolean(errors.email))}
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
              inputMode="email"
            />
          </Field>
          <Field label="Date of birth" htmlFor="dob" error={errors.dateOfBirth}>
            <DatePartsInput
              id="dob"
              value={form.dateOfBirth}
              onChange={(v) => update("dateOfBirth", v)}
              invalid={Boolean(errors.dateOfBirth)}
            />
          </Field>
          <Field label="Gender" htmlFor="gender">
            <SelectInput
              id="gender"
              value={form.gender}
              onChange={(v) => update("gender", v)}
              options={GENDERS}
              placeholder="Select gender"
            />
          </Field>
          <Field label="Blood group" htmlFor="bloodGroup">
            <SelectInput
              id="bloodGroup"
              value={form.bloodGroup}
              onChange={(v) => update("bloodGroup", v)}
              options={BLOOD_GROUPS}
              placeholder="Select blood group"
            />
          </Field>
          <Field label="Country" htmlFor="country">
            <SelectInput
              id="country"
              value={form.country}
              onChange={(v) => update("country", v)}
              options={COUNTRIES}
              placeholder="Select country"
            />
          </Field>
          <Field label="NID number" htmlFor="nid">
            <input
              id="nid"
              className={fieldCls("md")}
              value={form.nid}
              onChange={(e) => update("nid", e.target.value)}
              placeholder="National ID"
              inputMode="numeric"
            />
          </Field>
          <Field label="Address" htmlFor="address" className="sm:col-span-2">
            <textarea
              id="address"
              rows={3}
              className={`${fieldCls("area")} resize-none`}
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              placeholder="Your address"
              autoComplete="street-address"
            />
          </Field>
        </div>
      </Section>

      <Section title="Body measurements">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Height" htmlFor="height" error={errors.height}>
            <UnitInput
              id="height"
              value={form.heightValue}
              onChange={(v) => update("heightValue", v)}
              unit={form.heightUnit}
              onUnitChange={(v) => update("heightUnit", v)}
              units={HEIGHT_UNITS}
              placeholder="e.g. 170"
              invalid={Boolean(errors.height)}
            />
          </Field>
          <Field label="Weight" htmlFor="weight" error={errors.weight}>
            <UnitInput
              id="weight"
              value={form.weightValue}
              onChange={(v) => update("weightValue", v)}
              unit={form.weightUnit}
              onUnitChange={(v) => update("weightUnit", v)}
              units={WEIGHT_UNITS}
              placeholder="e.g. 70"
              invalid={Boolean(errors.weight)}
            />
          </Field>
        </div>
      </Section>

      <Section title="Emergency contact" hint="Someone the gym can call if you need help.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Relationship" htmlFor="ecRelationship" error={errors.ecRelationship}>
            <SelectInput
              id="ecRelationship"
              value={form.ecRelationship}
              onChange={(v) => update("ecRelationship", v)}
              options={RELATIONSHIPS}
              placeholder="Select relationship"
              invalid={Boolean(errors.ecRelationship)}
            />
          </Field>
          <Field label="Phone number" htmlFor="ecNumber" error={errors.ecNumber}>
            <input
              id="ecNumber"
              className={fieldCls("md", Boolean(errors.ecNumber))}
              value={form.ecNumber}
              onChange={(e) => update("ecNumber", e.target.value)}
              placeholder="01XXXXXXXXX"
              inputMode="tel"
              autoComplete="off"
            />
          </Field>
        </div>
      </Section>

      <Section title="Training goals" hint="Choose all that apply.">
        <div className="flex flex-wrap gap-2">
          {TRAINING_GOALS.map((goal) => {
            const on = form.goals.includes(goal);
            return (
              <button
                key={goal}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  update("goals", on ? form.goals.filter((g) => g !== goal) : [...form.goals, goal])
                }
                className={`min-h-10 rounded-full border px-4 text-sm font-medium transition-colors ${
                  on
                    ? "border-primary bg-primary text-white"
                    : "border-gray-300 bg-white text-gray-700 active:bg-gray-50 sm:hover:border-primary-300"
                }`}
              >
                {goal}
              </button>
            );
          })}
        </div>
      </Section>

      {error ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      {/* Stays in reach above the phone's bottom bar */}
      <div className="sticky bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-10 flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white/95 p-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur md:bottom-4">
        <p className="min-w-0 pl-1 text-sm text-gray-600">
          {changeCount > 0 ? (
            <>
              <span className="font-semibold text-ink">{changeCount}</span> change{changeCount > 1 ? "s" : ""} to send
            </>
          ) : (
            "No changes yet"
          )}
        </p>
        <PrimaryButton type="submit" loading={saving} disabled={changeCount === 0 || photoBusy} className="shrink-0">
          {saving ? "Sending..." : pending ? "Update request" : "Send for review"}
        </PrimaryButton>
      </div>
    </form>
  );
}
