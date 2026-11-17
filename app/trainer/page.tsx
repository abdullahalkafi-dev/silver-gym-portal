"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Avatar } from "@/components/member/OverviewTab";
import TrainerShell from "@/components/trainer/TrainerShell";
import {
  Chip,
  ChevronRightIcon,
  ClipboardIcon,
  SearchIcon,
  SecondaryButton,
  Spinner,
  StatusPill,
  fieldCls,
  selectCls,
} from "@/components/ui";
import { apiPage, type PageMeta } from "@/lib/api";
import { fmtDate } from "@/lib/format";
import { CUSTOM_TOPIC_FILTER, PLAN_TOPICS, STATUS_LABEL, STATUS_TONE } from "@/lib/plans";
import type { PlanCounts, PlanRequest, PlanStatus, TrainerInbox } from "@/lib/types";
import { errorText, handleSignedOut } from "@/lib/useSession";

type StatusFilter = PlanStatus | "all";

const STATUS_CHIPS: { key: StatusFilter; label: string }[] = [
  { key: "pending", label: "Waiting" },
  { key: "answered", label: "Answered" },
  { key: "declined", label: "Declined" },
  { key: "all", label: "All" },
];

// Filters survive opening a request and coming back.
const FILTER_KEY = "sg_trainer_filters";
type Filters = { status: StatusFilter; topic: string; search: string };
const DEFAULT_FILTERS: Filters = { status: "pending", topic: "", search: "" };

const loadFilters = (): Filters => {
  try {
    return { ...DEFAULT_FILTERS, ...JSON.parse(sessionStorage.getItem(FILTER_KEY) || "{}") };
  } catch {
    return DEFAULT_FILTERS;
  }
};

export default function TrainerRequestsPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<Filters | null>(null);
  const [searchText, setSearchText] = useState("");
  const [items, setItems] = useState<PlanRequest[]>([]);
  const [counts, setCounts] = useState<PlanCounts | null>(null);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestNo = useRef(0);

  useEffect(() => {
    const saved = loadFilters();
    setFilters(saved);
    setSearchText(saved.search);
  }, []);

  const fetchPage = useCallback(
    async (f: Filters, page: number) => {
      const params = new URLSearchParams({ status: f.status, page: String(page), limit: "20" });
      if (f.topic) params.set("topic", f.topic);
      if (f.search) params.set("search", f.search);
      return apiPage<TrainerInbox>(`/trainer/requests?${params}`);
    },
    [],
  );

  // Reload from page 1 whenever the filters change.
  useEffect(() => {
    if (!filters) return;
    try {
      sessionStorage.setItem(FILTER_KEY, JSON.stringify(filters));
    } catch {
      /* ignore */
    }
    const no = ++requestNo.current;
    setLoading(true);
    fetchPage(filters, 1)
      .then(({ data, meta: m }) => {
        if (no !== requestNo.current) return; // a newer search already started
        setItems(data.items);
        setCounts(data.counts);
        setMeta(m);
        setError(null);
      })
      .catch((err) => {
        if (no === requestNo.current && !handleSignedOut(err, router)) {
          setError(errorText(err, "Could not load requests."));
        }
      })
      .finally(() => no === requestNo.current && setLoading(false));
  }, [filters, fetchPage, router]);

  // Search as the trainer types (short pause first).
  useEffect(() => {
    if (!filters || searchText === filters.search) return;
    const t = setTimeout(() => setFilters((f) => (f ? { ...f, search: searchText.trim() } : f)), 350);
    return () => clearTimeout(t);
  }, [searchText, filters]);

  const loadMore = async () => {
    if (!filters || !meta) return;
    setLoadingMore(true);
    try {
      const { data, meta: m } = await fetchPage(filters, meta.page + 1);
      setItems((list) => [...list, ...data.items]);
      setMeta(m);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setLoadingMore(false);
    }
  };

  const setFilter = (patch: Partial<Filters>) => setFilters((f) => (f ? { ...f, ...patch } : f));

  const countFor = (key: StatusFilter) =>
    counts ? (key === "all" ? counts.total : counts[key]) : undefined;

  return (
    <TrainerShell section="requests" badge={counts?.pending}>
      <h1 className="px-1 text-xl font-semibold tracking-tight">Member requests</h1>
      <p className="px-1 text-sm text-muted">Members of your branch who asked you for a plan.</p>

      {/* Status */}
      <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {STATUS_CHIPS.map(({ key, label }) => {
          const n = countFor(key);
          return (
            <Chip key={key} active={filters?.status === key} onClick={() => setFilter({ status: key })}>
              {label}
              {n !== undefined ? (
                <span className={`text-xs ${filters?.status === key ? "text-white/85" : "text-gray-400"}`}>{n}</span>
              ) : null}
            </Chip>
          );
        })}
      </div>

      {/* Search + topic */}
      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_14rem]">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search name, member ID or topic"
            aria-label="Search"
            className={`${fieldCls()} pl-11`}
          />
        </div>
        <select
          aria-label="Topic"
          value={filters?.topic ?? ""}
          data-empty={!filters?.topic}
          onChange={(e) => setFilter({ topic: e.target.value })}
          className={selectCls()}
        >
          <option value="">All topics</option>
          {PLAN_TOPICS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
          <option value={CUSTOM_TOPIC_FILTER}>Custom titles</option>
        </select>
      </div>

      {/* List */}
      <div className="mt-4">
        {error ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : loading && !items.length ? (
          <div className="flex justify-center py-16 text-primary">
            <Spinner className="h-6 w-6" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
            <ClipboardIcon className="h-8 w-8 text-gray-300" />
            <p className="mt-2 text-sm text-muted">
              {filters?.status === "pending" && !filters.search && !filters.topic
                ? "No one is waiting for a plan right now."
                : "No requests match these filters."}
            </p>
          </div>
        ) : (
          <ul className={`space-y-2.5 transition-opacity ${loading ? "opacity-60" : ""}`}>
            {items.map((r) => (
              <li key={r._id}>
                <Link
                  href={`/trainer/request/${r._id}`}
                  className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3.5 transition-colors active:bg-gray-50"
                >
                  <Avatar name={r.memberSnapshot.fullName || "?"} photo={r.memberSnapshot.photo} size={48} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold">{r.memberSnapshot.fullName || "Member"}</p>
                      {filters?.status === "all" || filters?.status !== r.status ? (
                        <StatusPill tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</StatusPill>
                      ) : null}
                    </div>
                    <p className="truncate text-sm text-gray-700">{r.topic}</p>
                    <p className="text-xs text-muted">
                      ID {r.memberSnapshot.memberId || "-"} · {fmtDate(r.createdAt)}
                    </p>
                  </div>
                  <ChevronRightIcon className="h-5 w-5 shrink-0 text-gray-400" />
                </Link>
              </li>
            ))}
          </ul>
        )}

        {meta && meta.page < meta.totalPage && !error ? (
          <div className="mt-4 flex justify-center">
            <SecondaryButton size="sm" loading={loadingMore} onClick={loadMore}>
              Show more
            </SecondaryButton>
          </div>
        ) : null}
      </div>
    </TrainerShell>
  );
}
