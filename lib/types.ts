export type MemberProfile = {
  id: string;
  memberId: string | null;
  fullName: string;
  contact: string | null;
  email: string | null;
  dateOfBirth: string | null;
  country: string | null;
  nid: string | null;
  gender: string | null;
  bloodGroup: string | null;
  height: number | null;
  heightUnit: "cm" | "in" | "ft" | null;
  weight: number | null;
  weightUnit: "kg" | "lb" | null;
  address: string | null;
  photo: string | null;
  emergencyContact: { relationship?: string; contactNumber?: string } | null;
  trainingGoals: string[];
  currentPackageName: string | null;
  membershipStartDate: string | null;
  membershipEndDate: string | null;
  nextPaymentDate: string | null;
  currentDueAmount: number;
  joinedAt: string | null;
};

export type MemberMe = {
  kind: "member";
  profile: MemberProfile;
  branch: { name: string; address: string };
  business: { name: string; logo: string | null; phone: string | null };
};

export type TrainerMe = {
  kind: "trainer";
  displayName: string;
  username: string;
  phone: string | null;
  branchName: string | null;
};

export type Payment = {
  _id: string;
  invoiceNo?: string;
  paymentType?: string;
  packageName?: string;
  periodStart?: string;
  periodEnd?: string;
  paidMonths?: number;
  subTotal?: number;
  discount?: number;
  billAmount?: number;
  dueAmount?: number;
  paidTotal?: number;
  admissionFee?: number;
  exchange?: number;
  paymentMethod?: string;
  paymentDate?: string;
  status?: string;
};

export type RequestChange = { old: unknown; new: unknown };

export type UpdateRequest = {
  _id: string;
  status: string;
  changes: Record<string, RequestChange>;
  photo?: { newKey?: string; oldKey?: string };
  resolution?: Record<string, "accepted" | "rejected">;
  reviewedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type UpdateRequestState = {
  pending: UpdateRequest | null;
  latest: UpdateRequest | null;
};

/* ─── Ask a trainer ─────────────────────────────────────────────────────────── */

export type PlanStatus = "pending" | "answered" | "declined" | "cancelled";

export type TrainerOption = { id: string; displayName: string };

export type MemberSnapshot = {
  fullName?: string;
  memberId?: string;
  photo?: string;
  gender?: string;
  age?: number;
  bloodGroup?: string;
  height?: number;
  heightUnit?: string;
  weight?: number;
  weightUnit?: string;
  trainingGoals?: string[];
};

export type PlanReply = {
  title?: string;
  /** HTML cleaned by the server (formatting tags only). */
  content: string;
  sentAt: string;
  editedAt?: string;
};

export type PlanRequest = {
  _id: string;
  trainerName?: string;
  topic: string;
  isCustomTopic?: boolean;
  note?: string;
  memberSnapshot: MemberSnapshot;
  status: PlanStatus;
  reply?: PlanReply;
  declineReason?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type PlanCounts = Record<PlanStatus | "total", number>;

export type TrainerInbox = { items: PlanRequest[]; counts: PlanCounts };

export type PlanTemplate = {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};
