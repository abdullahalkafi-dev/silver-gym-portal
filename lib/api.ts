const BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
const TOKEN_KEY = "sg_portal_token";
const KIND_KEY = "sg_portal_kind";

export type PortalKind = "member" | "trainer";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export const session = {
  get(): { token: string; kind: PortalKind } | null {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const kind = localStorage.getItem(KIND_KEY) as PortalKind | null;
      return token && kind ? { token, kind } : null;
    } catch {
      return null;
    }
  },
  set(token: string, kind: PortalKind) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(KIND_KEY, kind);
    } catch {
      /* private mode: the user just has to sign in again */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(KIND_KEY);
    } catch {
      /* ignore */
    }
  },
};

type Options = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  form?: FormData;
  auth?: boolean;
};

export type PageMeta = { page: number; limit: number; total: number; totalPage: number };

/** Calls the portal API and returns `data` from the standard `{ success, message, data }` envelope. */
export async function api<T>(path: string, options: Options = {}): Promise<T> {
  const json = await request(path, options);
  return json?.data as T;
}

/** Same as `api`, plus the paging `meta` of list endpoints. */
export async function apiPage<T>(path: string, options: Options = {}): Promise<{ data: T; meta: PageMeta }> {
  const json = await request(path, options);
  return {
    data: json?.data as T,
    meta: json?.meta ?? { page: 1, limit: 20, total: 0, totalPage: 1 },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function request(path: string, options: Options): Promise<any> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const stored = session.get();
  if (options.auth !== false && stored) {
    headers.Authorization = `Bearer ${stored.token}`;
  }

  let body: BodyInit | undefined;
  if (options.form) {
    body = options.form;
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(`${BASE}/portal${path}`, {
      method: options.method ?? "GET",
      headers,
      body,
      cache: "no-store",
    });
  } catch {
    throw new ApiError("Cannot reach the server. Check your internet connection.", 0);
  }

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      json?.errorMessages?.[0]?.message ||
      json?.errorSources?.[0]?.message ||
      json?.message ||
      "Something went wrong. Please try again.";

    if (response.status === 401 && options.auth !== false) {
      session.clear();
    }
    throw new ApiError(message, response.status);
  }

  return json;
}

const MINIO = process.env.NEXT_PUBLIC_MINIO_URL || "";

/** Turns a stored photo key into a public URL. */
export const photoUrl = (key?: string | null) => {
  if (!key) return undefined;
  if (/^https?:\/\//.test(key)) return key;
  return `${MINIO}/${key.replace(/^\/+/, "")}`;
};
