# silver-gym-portal

Member and trainer portal for Silver GYM, live at https://portal.silvergym-bd.com.

- **Members** sign in with Member ID + phone number (active members only). They see their profile and
  billing history, download receipts, and send profile-update **requests**. A request never changes the
  member until staff approve it in the dashboard. The phone number is read-only.
- **Trainers** sign in with the username and password staff create on the dashboard's Trainers page.
  Their page is an "under construction" placeholder for now.

This app has **no database of its own**. It only calls the SilverGym backend API (`/api/v1/portal/...`),
which lives in the `silver-gym` repo (backend) and is scoped to one account by `PORTAL_BUSINESS_ID`.
The staff-facing screens (Trainers page, Update Request review) live in `silver-gym-frontend`.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind 4 · pnpm. No server code here: all data goes through the API.

## Run locally

```bash
pnpm install
cp .env.example .env.local      # then adjust
pnpm dev                        # http://localhost:3000
```

The backend must be running and allow this origin (CORS), or you must proxy `/api/` to it.

## Environment (build time)

| Variable | Meaning |
|---|---|
| `NEXT_PUBLIC_API_URL` | API base. Production uses the relative `/api/v1` (the gateway proxies `/api/` to the backend on the same host). |
| `NEXT_PUBLIC_MINIO_URL` | Public base URL of photo storage, same value the dashboard uses. |

`NEXT_PUBLIC_*` values are baked into the build, so changing them needs a rebuild.

## Deploy (production VPS)

Lives in `/opt/projects/silvergym-portal/` on the VPS (compose project `silvergym-portal`, container
`silvergym-portal`, joined to the shared `proxy` network, no published ports). The shared gateway serves
`portal.silvergym-bd.com` (conf `/opt/projects/gateway/conf.d/silvergym-portal.conf`): `/` goes to this
container and `/api/` goes to `silvergym-backend`.

Update after pushing to `main`:

```bash
ssh -p 2222 deploy@72.61.246.98
cd /opt/projects/silvergym-portal
git -C app pull --ff-only
docker compose build && docker compose up -d
/opt/projects/gateway/check.sh
```

Read the repo-level `SERVER_INFRASTRUCTURE.md` (workspace root) before any server work.
