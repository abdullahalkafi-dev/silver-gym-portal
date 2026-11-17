# silver-gym-portal

Member and trainer portal for Silver GYM, live at https://portal.silvergym-bd.com.

- **Members** sign in with Member ID + phone number (active members only). They see their profile and
  billing history, download receipts, and send profile-update **requests**. A request never changes the
  member until staff approve it in the dashboard. The phone number is read-only.
- **Trainers** sign in with the username and password staff create on the dashboard's Trainers page.
- **Ask a trainer (diet / workout plans).** A member picks an active trainer of their own branch, a topic
  (or their own title), writes about their health, and sends. Their body details go with it. The trainer
  answers with a formatted plan, starting from one of their **private templates** or from scratch, and can
  edit it later. One request gets one answer (not a chat), one waiting request per member, the member can
  cancel but not edit, and the trainer can decline with a reason. Owner/staff see it read-only on the
  dashboard Trainers page. Full rules, data and API: `docs/trainer-plans.md` in the backend repo.
  Voice notes are the planned next phase.

## Pages

| Path | Who | What |
|---|---|---|
| `/member` (`?tab=plans`) | member | Home, **Plans**, Billing, Profile tabs |
| `/member/ask` | member | Ask a trainer form |
| `/member/plan/[id]` | member | Read a plan / see request status |
| `/trainer` | trainer | Requests inbox (status chips, topic filter, search) |
| `/trainer/request/[id]` | trainer | Member details + reply editor ("Use a template", "Save as a new template", decline) |
| `/trainer/templates`, `/trainer/templates/[id]` | trainer | Private templates (`new` creates one) |

The editor is Tiptap (`components/RichTextEditor.tsx`), limited to headings, bold, italic, underline,
lists and undo/redo. The backend cleans every plan to those tags, so `components/PlanContent.tsx` can render
it directly. Shared look for the editor and the reader: `.plan-content` in `app/globals.css`.

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
