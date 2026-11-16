"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { PrimaryButton, Logo, inputCls } from "@/components/ui";
import { ApiError, api, session, type PortalKind } from "@/lib/api";

type Tab = PortalKind;

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("member");
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [memberId, setMemberId] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Already signed in? go straight to the right page.
  useEffect(() => {
    const existing = session.get();
    if (existing) {
      router.replace(`/${existing.kind}`);
    } else {
      setChecking(false);
    }
  }, [router]);

  const switchTab = (next: Tab) => {
    setTab(next);
    setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (tab === "member" && (!memberId.trim() || !phone.trim())) {
      return setError("Please enter your Member ID and phone number.");
    }
    if (tab === "trainer" && (!username.trim() || !password)) {
      return setError("Please enter your username and password.");
    }

    setLoading(true);
    try {
      const result =
        tab === "member"
          ? await api<{ token: string; kind: "member" }>("/auth/member-login", {
              method: "POST",
              auth: false,
              body: { memberId: memberId.trim(), phone: phone.trim() },
            })
          : await api<{ token: string; kind: "trainer" }>("/auth/trainer-login", {
              method: "POST",
              auth: false,
              body: { username: username.trim(), password },
            });

      session.set(result.token, result.kind);
      router.replace(`/${result.kind}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not sign in. Please try again.");
      setLoading(false);
    }
  };

  if (checking) {
    return <div className="min-h-screen" />;
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel (desktop) */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-[#6527e0] via-purple to-[#9b6bff] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-white/10" />

        <div className="relative flex items-center gap-3">
          <Logo size={44} />
          <span className="text-xl font-semibold tracking-tight">Silver GYM</span>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">
            Your membership,
            <br />
            always at hand.
          </h2>
          <p className="mt-4 text-base text-white/80">
            Check your payment history, download receipts and keep your profile up to date, from
            your phone or computer.
          </p>
        </div>

        <p className="relative text-sm text-white/60">&copy; {new Date().getFullYear()} Silver GYM</p>
      </aside>

      {/* Form */}
      <section className="flex items-center justify-center px-5 py-10">
        <div className="fade-up w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Logo size={40} />
            <span className="text-lg font-semibold tracking-tight">Silver GYM</span>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-ink">Welcome back</h1>
          <p className="mt-1.5 text-sm text-muted">Continue as a member or as a trainer.</p>

          {/* Role switch */}
          <div
            role="tablist"
            aria-label="Sign in as"
            className="relative mt-7 grid grid-cols-2 rounded-xl bg-[#ececf1] p-1"
          >
            <span
              aria-hidden
              className={`absolute inset-y-1 w-[calc(50%-4px)] rounded-lg bg-white shadow-sm transition-transform duration-200 ${
                tab === "member" ? "translate-x-0" : "translate-x-full"
              }`}
            />
            {(["member", "trainer"] as const).map((t) => (
              <button
                key={t}
                role="tab"
                type="button"
                aria-selected={tab === t}
                onClick={() => switchTab(t)}
                className={`relative z-10 rounded-lg py-2.5 text-sm font-medium transition-colors ${
                  tab === t ? "text-purple" : "text-muted hover:text-ink"
                }`}
              >
                {t === "member" ? "Member" : "Trainer"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            {tab === "member" ? (
              <>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-ink">Member ID</span>
                  <input
                    className={inputCls}
                    value={memberId}
                    onChange={(e) => setMemberId(e.target.value)}
                    placeholder="e.g. 1042"
                    autoComplete="username"
                    inputMode="numeric"
                    autoFocus
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-ink">Phone number</span>
                  <input
                    className={inputCls}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    autoComplete="tel"
                    inputMode="tel"
                  />
                  <span className="mt-1.5 block text-xs text-muted">
                    Use the phone number you gave the gym when you joined.
                  </span>
                </label>
              </>
            ) : (
              <>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-ink">Username</span>
                  <input
                    className={inputCls}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Your trainer username"
                    autoComplete="username"
                    autoCapitalize="none"
                    autoFocus
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-ink">Password</span>
                  <div className="relative">
                    <input
                      className={`${inputCls} pr-16`}
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Your password"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-purple"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </label>
              </>
            )}

            {error ? (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-600"
              >
                {error}
              </div>
            ) : null}

            <PrimaryButton type="submit" loading={loading} className="w-full py-3.5">
              {loading ? "Signing in..." : tab === "member" ? "Continue as member" : "Continue as trainer"}
            </PrimaryButton>
          </form>

          <p className="mt-8 text-center text-xs text-muted">
            Having trouble signing in? Please contact the gym front desk.
          </p>
        </div>
      </section>
    </main>
  );
}
