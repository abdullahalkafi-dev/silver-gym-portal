import type { MemberSnapshot, PlanStatus } from "./types";

/** Same list as the backend (trainerPlan.constants.ts). */
export const PLAN_TOPICS = [
  "Weight loss",
  "Weight gain",
  "Muscle building",
  "Diet plan",
  "Workout plan",
  "Stay fit",
] as const;

/** Filter value for "any custom title". */
export const CUSTOM_TOPIC_FILTER = "__custom";

export const NOTE_MAX = 2000;
export const CUSTOM_TOPIC_MAX = 60;
export const TITLE_MAX = 120;

export const STATUS_LABEL: Record<PlanStatus, string> = {
  pending: "Waiting",
  answered: "Answered",
  declined: "Declined",
  cancelled: "Cancelled",
};

export const STATUS_TONE: Record<PlanStatus, "amber" | "green" | "red" | "gray"> = {
  pending: "amber",
  answered: "green",
  declined: "red",
  cancelled: "gray",
};

export const fmtHeight = (s: MemberSnapshot) =>
  s.height ? `${s.height} ${s.heightUnit || "cm"}` : "-";

export const fmtWeight = (s: MemberSnapshot) =>
  s.weight ? `${s.weight} ${s.weightUnit || "kg"}` : "-";
