"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Field, Logo, PrimaryButton, fieldCls } from "@/components/ui";
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
    return <div className="min-h-dvh" />;
  }

  return (
    <main className="flex min-h-dvh w-full">
      {/* Form */}
      <section className="flex w-full flex-col justify-center px-5 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-10 lg:w-1/2 lg:px-14">
        <div className="fade-up mx-auto w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 sm:mb-10">
            <Logo size={44} />
            <div className="leading-tight">
              <p className="text-lg font-semibold tracking-tight">Silver GYM</p>
              <p className="text-xs text-muted">Member &amp; trainer portal</p>
            </div>
          </div>

          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Welcome back</h1>
          <p className="mt-2 text-base text-muted">Continue as a member or as a trainer.</p>

          {/* Role switch (same pattern as the dashboard sign-in) */}
          <div role="tablist" aria-label="Sign in as" className="mt-7 grid grid-cols-2 gap-1 rounded-lg border border-gray-200 bg-white p-1">
            {(["member", "trainer"] as const).map((t) => (
              <button
                key={t}
                role="tab"
                type="button"
                aria-selected={tab === t}
                onClick={() => switchTab(t)}
                className={`h-11 rounded-md text-sm font-medium transition-colors ${
                  tab === t ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {t === "member" ? "Member" : "Trainer"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
            {tab === "member" ? (
              <>
                <Field label="Member ID" htmlFor="memberId">
                  <input
                    id="memberId"
                    className={fieldCls("lg")}
                    value={memberId}
                    onChange={(e) => setMemberId(e.target.value)}
                    placeholder="e.g. 1042"
                    autoComplete="username"
                    inputMode="numeric"
                    enterKeyHint="next"
                  />
                </Field>
                <Field
                  label="Phone number"
                  htmlFor="phone"
                  hint="Use the phone number you gave the gym when you joined."
                >
                  <input
                    id="phone"
                    className={fieldCls("lg")}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    autoComplete="tel"
                    inputMode="tel"
                    enterKeyHint="go"
                  />
                </Field>
              </>
            ) : (
              <>
                <Field label="Username" htmlFor="username">
                  <input
                    id="username"
                    className={fieldCls("lg")}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Your trainer username"
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    enterKeyHint="next"
                  />
                </Field>
                <Field label="Password" htmlFor="password">
                  <div className="relative">
                    <input
                      id="password"
                      className={`${fieldCls("lg")} pr-20`}
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Your password"
                      autoComplete="current-password"
                      enterKeyHint="go"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 flex w-20 items-center justify-center text-sm font-medium text-primary"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </Field>
              </>
            )}

            {error ? (
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            <PrimaryButton type="submit" size="lg" loading={loading} className="w-full">
              {loading ? "Signing in..." : tab === "member" ? "Continue as member" : "Continue as trainer"}
            </PrimaryButton>
          </form>

          <p className="mt-8 text-center text-sm text-muted">
            Having trouble signing in? Please contact the gym front desk.
          </p>
        </div>
      </section>

      {/* Brand panel (large screens), orange like the dashboard sign-in */}
      <aside className="relative hidden w-1/2 overflow-hidden bg-primary lg:flex lg:flex-col lg:justify-center lg:px-16">
        <div className="pointer-events-none absolute -right-20 -top-20 h-[420px] w-[420px] rounded-full bg-[#f89238] blur-[210px]" />
        <div className="relative z-10 max-w-lg text-white">
          <h2 className="text-5xl font-bold leading-[1.15] tracking-tight">Your membership, always at hand.</h2>
          <p className="mt-5 text-lg text-white/90">
            Check your payment history, download receipts and keep your profile up to date, from your phone or
            computer.
          </p>
          <div className="mt-8 h-px w-64 bg-white" />
          <ul className="mt-8 space-y-3 text-base text-[#ffded7]">
            <li>Payment history and receipts</li>
            <li>Update your details, any time</li>
            <li>Diet and workout plans, coming soon</li>
          </ul>
        </div>
      </aside>
    </main>
  );
}
