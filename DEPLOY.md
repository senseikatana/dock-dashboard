# Deploy — Dock Dashboard

Current status:

- **Canonical deploy:** Worker `dock-dashboard` → `https://samuraicoder.dev/apps/dock-dashboard/` (pending root DNS).
- Worker direct URL: `https://dock-dashboard.senseikatanacom.workers.dev/apps/dock-dashboard/`.
- Pages project `dock-dashboard` → `https://dock-dashboard-6wu.pages.dev` (preview/mirror only; no custom subdomain).
- R2 bucket `dock-dashboard-avatars` created and bound to the Worker.
- DNS pending: `samuraicoder.dev` needs a proxied record pointing to the origin.

Deploy targets:

| Target                        | URL                                     | Build                        | Command                |
| ----------------------------- | --------------------------------------- | ---------------------------- | ---------------------- |
| Cloudflare Worker (canonical) | `samuraicoder.dev/apps/dock-dashboard/` | base `/apps/dock-dashboard/` | `bun run deploy:cf`    |
| Cloudflare Pages (preview)    | `https://dock-dashboard-6wu.pages.dev`  | base `/`                     | `bun run deploy:pages` |

## 1. Firebase

```bash
gcloud services enable identitytoolkit.googleapis.com --project=panel-ola
firebase deploy --only auth,firestore:rules,firestore:indexes
bun run purge
bun run seed
bun run auth:users        # creates Auth accounts for members without uid
bun run auth:sync-roles   # copies Firestore role → custom claim
```

Auth providers are declared in `firebase.json` and deployed with `firebase deploy --only auth`.

## 2. Cloudflare R2 (avatars)

```bash
wrangler r2 bucket create dock-dashboard-avatars
```

The Worker binds it as `AVATARS`. Uploads are limited to 5 MB and PNG/JPG/WebP; SVG is rejected because it is served from the app origin and can execute.

## 3. Worker secrets (Auth provisioning)

Create a dedicated service account with `roles/firebaseauth.admin` + `roles/datastore.user`, download its JSON key, and store it as a Worker secret:

```bash
wrangler secret put FIREBASE_SERVICE_ACCOUNT \
  --config workers/dock-dashboard/wrangler.jsonc < /path/to/key.json
rm /path/to/key.json
```

Also set the install code, required to create the first admin on an empty panel:

```bash
openssl rand -hex 32
wrangler secret put BOOTSTRAP_TOKEN --config workers/dock-dashboard/wrangler.jsonc
```

On a panel with no members, `POST /api/signup` returns `403 bootstrap_required` until the code is supplied (the login screen reveals the field). The winning slot is recorded atomically in `config/bootstrap`; the first signup with the code becomes `admin`, everyone else is `operario`.

If the panel ever ends up with zero members and `config/bootstrap` already exists, delete that document and repeat the first signup with the code.

The public Firebase web config lives in `.env`; the service account key must never be committed.

## 4. Deploy

```bash
bun run deploy:cf      # Worker + subpath assets + API
bun run deploy:pages   # Pages + subdomain assets
```

Both scripts run `tsc -b` and `vite build` with the correct base path.

- Worker: `workers/dock-dashboard/wrangler.jsonc`
- Pages project: `dock-dashboard`
- Worker route: `samuraicoder.dev/apps/dock-dashboard/*`
- Worker URL: `https://dock-dashboard.senseikatanacom.workers.dev`

## 5. DNS (manual)

The canonical URL is a subpath, so `samuraicoder.dev` itself needs a proxied DNS record pointing to the origin:

| Type  | Name               | Target             | Proxy         |
| ----- | ------------------ | ------------------ | ------------- |
| A     | `samuraicoder.dev` | your server IP     | ON            |
| CNAME | `www`              | `samuraicoder.dev` | ON (optional) |

The Worker route already matches `samuraicoder.dev/apps/dock-dashboard/*`; it does not touch the rest of the site.

If the main site is not live yet, a proxied placeholder `AAAA 100::` makes the Worker route resolve, but the rest of the domain will not serve content until you replace it with the real origin.

There is no subdomain custom domain. Pages at `https://dock-dashboard-6wu.pages.dev` is only a preview/mirror.

## 6. Local API development

```bash
# terminal 1
cd workers/dock-dashboard
bun run dev   # wrangler.dev.jsonc, port 8787

# terminal 2
bun dev
```

Vite proxies `/apps/dock-dashboard/api` to `http://localhost:8787`. For `wrangler dev`, copy `.dev.vars.example` to `.dev.vars` and fill the service account JSON (gitignored).

## Notes

- Custom claims drive Firestore Rules. After changing a role: `bun run auth:sync-roles` + re-login.
- New member flow: create in `/settings` → `bun run auth:users` → `bun run auth:sync-roles`.
- The dashboard purge removes operational data only; `members` is preserved so nobody loses access.
- Firebase Storage is **not** used. Avatars live in R2 and are served by the Worker at `/apps/dock-dashboard/api/avatars/{key}`.
