"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, session, type PortalKind } from "./api";

/**
 * Inner pages: send the visitor to the sign-in page unless they are signed in as `kind`.
 * Returns true once the check passed (render nothing before that).
 */
export function useRequireSession(kind: PortalKind) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = session.get();
    if (!stored) router.replace("/");
    else if (stored.kind !== kind) router.replace(stored.kind === "member" ? "/member" : "/trainer");
    else setReady(true);
  }, [kind, router]);

  return ready;
}

/** A 401 means the session ended: go back to sign-in. Returns true when it handled the error. */
export function handleSignedOut(err: unknown, router: ReturnType<typeof useRouter>) {
  if (err instanceof ApiError && err.status === 401) {
    router.replace("/");
    return true;
  }
  return false;
}

export const errorText = (err: unknown, fallback = "Something went wrong. Please try again.") =>
  err instanceof ApiError ? err.message : fallback;
