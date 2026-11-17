"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  Card,
  Chip,
  Field,
  FullPageSpinner,
  PrimaryButton,
  SecondaryButton,
  SubPageHeader,
  UnitInput,
  fieldCls,
} from "@/components/ui";
import { api } from "@/lib/api";
import { HEIGHT_UNITS, WEIGHT_UNITS } from "@/lib/options";
import { CUSTOM_TOPIC_MAX, NOTE_MAX, PLAN_TOPICS } from "@/lib/plans";
import type { MemberMe, PlanRequest, TrainerOption } from "@/lib/types";
import { errorText, handleSignedOut, useRequireSession } from "@/lib/useSession";

const OTHER = "__other";

type Errors = Partial<Record<"trainer" | "topic" | "height" | "weight", string>>;

export default function AskTrainerPage() {
  const router = useRouter();
  const ready = useRequireSession("member");

  const [me, setMe] = useState<MemberMe | null>(null);
  const [trainers, setTrainers] = useState<TrainerOption[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [trainerId, setTrainerId] = useState("");
  const [topic, setTopic] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [note, setNote] = useState("");
  const [height, setHeight] = useState("");
  const [heightUnit, setHeightUnit] = useState("cm");
  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState("kg");
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);

  const back = () => router.replace("/member?tab=plans");

  useEffect(() => {
    if (!ready) return;
    (async () => {
      try {
        const [profile, list, mine] = await Promise.all([
          api<MemberMe>("/me"),
          api<TrainerOption[]>("/plan-trainers"),
          api<PlanRequest[]>("/plan-requests"),
        ]);
        if (mine.some((r) => r.status === "pending")) {
          toast.info("You already have a request waiting for a trainer.");
          router.replace("/member?tab=plans");
          return;
        }
        setMe(profile);
        setTrainers(list);
        if (list.length === 1) setTrainerId(list[0]!.id);
      } catch (err) {
        if (!handleSignedOut(err, router)) setLoadError(errorText(err, "Could not open the form."));
      }
    })();
  }, [ready, router]);

  if (loadError) {
    return (
      <main className="min-h-dvh">
        <SubPageHeader title="Ask a trainer" onBack={back} />
        <div className="mx-auto max-w-xl px-4 py-10 text-center">
          <p className="text-sm text-red-600">{loadError}</p>
          <SecondaryButton size="sm" className="mt-3" onClick={() => window.location.reload()}>
            Try again
          </SecondaryButton>
        </div>
      </main>
    );
  }

  if (!ready || !me || !trainers) return <FullPageSpinner />;

  const p = me.profile;
  const needHeight = !p.height;
  const needWeight = !p.weight;

  if (trainers.length === 0) {
    return (
      <main className="min-h-dvh">
        <SubPageHeader title="Ask a trainer" onBack={back} />
        <div className="mx-auto max-w-xl px-4 py-10 text-center text-sm text-muted">
          No trainer is available at your branch yet. Please check again later.
        </div>
      </main>
    );
  }

  const validate = () => {
    const next: Errors = {};
    if (!trainerId) next.trainer = "Please choose a trainer";
    if (!topic) next.topic = "Please choose what you need";
    else if (topic === OTHER && !customTopic.trim()) next.topic = "Please write what you need";
    const h = Number(height);
    if (needHeight && (!height || !(h > 0))) next.height = "Please enter your height";
    else if (needHeight && h > 300) next.height = "That height looks too large";
    const w = Number(weight);
    if (needWeight && (!weight || !(w > 0))) next.weight = "Please enter your weight";
    else if (needWeight && w > 700) next.weight = "That weight looks too large";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please check the highlighted fields");
      return;
    }
    setSending(true);
    try {
      await api("/plan-requests", {
        method: "POST",
        body: {
          trainerId,
          topic: topic === OTHER ? customTopic.trim() : topic,
          isCustomTopic: topic === OTHER,
          note: note.trim() || undefined,
          ...(needHeight ? { height: Number(height), heightUnit } : {}),
          ...(needWeight ? { weight: Number(weight), weightUnit } : {}),
        },
      });
      toast.success("Your request was sent to the trainer");
      router.replace("/member?tab=plans");
    } catch (err) {
      if (!handleSignedOut(err, router)) toast.error(errorText(err));
      setSending(false);
    }
  };

  return (
    <main className="min-h-dvh">
      <SubPageHeader title="Ask a trainer" subtitle={me.branch.name} onBack={back} />

      <form onSubmit={submit} noValidate className="fade-up mx-auto max-w-xl space-y-4 px-4 pb-36 pt-4">
        {/* 1. Trainer */}
        <Card>
          <h2 className="text-base font-semibold">Choose a trainer</h2>
          <div className="mt-3 space-y-2" role="radiogroup" aria-label="Trainer">
            {trainers.map((t) => {
              const active = trainerId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => {
                    setTrainerId(t.id);
                    setErrors((x) => ({ ...x, trainer: undefined }));
                  }}
                  className={`flex min-h-14 w-full items-center gap-3 rounded-xl border px-3.5 text-left transition-colors ${
                    active ? "border-primary bg-primary-50" : "border-gray-200 bg-white active:bg-gray-50"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      active ? "border-primary" : "border-gray-300"
                    }`}
                  >
                    {active ? <span className="h-2.5 w-2.5 rounded-full bg-primary" /> : null}
                  </span>
                  <span className="font-medium">{t.displayName}</span>
                </button>
              );
            })}
          </div>
          {errors.trainer ? (
            <p role="alert" className="mt-2 text-xs text-red-600">
              {errors.trainer}
            </p>
          ) : null}
        </Card>

        {/* 2. Topic */}
        <Card>
          <h2 className="text-base font-semibold">What do you need?</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {PLAN_TOPICS.map((t) => (
              <Chip
                key={t}
                active={topic === t}
                onClick={() => {
                  setTopic(t);
                  setErrors((x) => ({ ...x, topic: undefined }));
                }}
              >
                {t}
              </Chip>
            ))}
            <Chip
              active={topic === OTHER}
              onClick={() => {
                setTopic(OTHER);
                setErrors((x) => ({ ...x, topic: undefined }));
              }}
            >
              Something else
            </Chip>
          </div>
          {topic === OTHER ? (
            <div className="mt-3">
              <input
                id="customTopic"
                value={customTopic}
                maxLength={CUSTOM_TOPIC_MAX}
                autoFocus
                placeholder="e.g. Plan for back pain"
                onChange={(e) => {
                  setCustomTopic(e.target.value);
                  setErrors((x) => ({ ...x, topic: undefined }));
                }}
                className={fieldCls("md", Boolean(errors.topic))}
              />
            </div>
          ) : null}
          {errors.topic ? (
            <p role="alert" className="mt-2 text-xs text-red-600">
              {errors.topic}
            </p>
          ) : null}
        </Card>

        {/* 3. About you */}
        <Card>
          <Field
            label="About you (optional)"
            htmlFor="note"
            hint={`Health problems, injuries, food you avoid, how often you train. ${note.length}/${NOTE_MAX}`}
          >
            <textarea
              id="note"
              rows={5}
              value={note}
              maxLength={NOTE_MAX}
              placeholder="Tell the trainer anything that helps them plan for you"
              onChange={(e) => setNote(e.target.value)}
              className={fieldCls("area")}
            />
          </Field>
        </Card>

        {/* 4. Body details */}
        <Card>
          <h2 className="text-base font-semibold">Your body details</h2>
          <p className="mt-0.5 text-xs text-muted">The trainer sees these with your request.</p>

          <dl className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {!needHeight ? <Fact label="Height" value={`${p.height} ${p.heightUnit || "cm"}`} /> : null}
            {!needWeight ? <Fact label="Weight" value={`${p.weight} ${p.weightUnit || "kg"}`} /> : null}
            <Fact label="Gender" value={p.gender || "-"} />
            <Fact label="Blood group" value={p.bloodGroup || "-"} />
            {p.trainingGoals.length ? (
              <div className="col-span-2 rounded-xl bg-gray-50 px-3.5 py-3 sm:col-span-3">
                <dt className="text-xs text-muted">Goals</dt>
                <dd className="mt-0.5 text-sm font-semibold">{p.trainingGoals.join(", ")}</dd>
              </div>
            ) : null}
          </dl>

          {needHeight || needWeight ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {needHeight ? (
                <Field label="Height" htmlFor="height" error={errors.height}>
                  <UnitInput
                    id="height"
                    value={height}
                    onChange={(v) => {
                      setHeight(v);
                      setErrors((x) => ({ ...x, height: undefined }));
                    }}
                    unit={heightUnit}
                    onUnitChange={setHeightUnit}
                    units={HEIGHT_UNITS}
                    placeholder={heightUnit === "ft" ? "e.g. 5.7" : heightUnit === "in" ? "e.g. 67" : "e.g. 170"}
                    invalid={Boolean(errors.height)}
                  />
                </Field>
              ) : null}
              {needWeight ? (
                <Field label="Weight" htmlFor="weight" error={errors.weight}>
                  <UnitInput
                    id="weight"
                    value={weight}
                    onChange={(v) => {
                      setWeight(v);
                      setErrors((x) => ({ ...x, weight: undefined }));
                    }}
                    unit={weightUnit}
                    onUnitChange={setWeightUnit}
                    units={WEIGHT_UNITS}
                    placeholder={weightUnit === "lb" ? "e.g. 150" : "e.g. 68"}
                    invalid={Boolean(errors.weight)}
                  />
                </Field>
              ) : null}
            </div>
          ) : null}

          <p className="mt-3 text-xs text-muted">
            Something wrong here? Update it from your Profile tab.
          </p>
        </Card>

        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur">
          <div className="mx-auto max-w-xl">
            <PrimaryButton type="submit" loading={sending} className="w-full">
              Send request
            </PrimaryButton>
            <p className="mt-1.5 text-center text-xs text-muted">You cannot change a request after sending it.</p>
          </div>
        </div>
      </form>
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
