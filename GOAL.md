# FarmDirect B2B – Goal Document

**Status:** Live API + D1; next focus = **authentication** and **listing publication**  
**Repo:** JohanCrazy2005/farmdirect-b2b  
**Live Worker:** https://farmdirect-b2b.fehrjohan65.workers.dev  
**Frontend:** https://farmdirect-b2b-yjzt.vercel.app  
**Database:** Cloudflare D1 `b2bistening` (id `ad22b284-cafd-4f74-a8bc-6205056d38f8`, binding `DB`)

*Last updated: 2026-10-22 – Shift priority to P3 auth + publish workflow.*

---

## Done (baseline)

| Item | Status |
|------|--------|
| Canonical listing shape + D1 schema | Done |
| Worker API CRUD + health | Done (interim `X-Seller-Id`) |
| Frontend map / list / filters / RFQ (demo-capable) | Done |
| Live Worker + D1 binding | Done |
| Sample data (incl. Cuauhtémoc, Chihuahua) | Available via seed SQL |

---

## Current priority: P3 – Authentication & listing publications

### P3.1 – Seller authentication (in progress – deploy migration + new Worker)

**Goal:** Real seller accounts so create/edit/delete/publish are tied to a logged-in identity, not a free-form `X-Seller-Id` header.

| Step | Owner | Notes |
|------|--------|--------|
| D1 migration: `sellers` password fields + `sessions` table | You (SQL in dashboard) | `schema/auth-migration.sql` |
| Worker: register / login / logout / me | You (redeploy Worker) | Same Worker `farmdirect-b2b` – **no new Worker required** |
| Session token in `Authorization: Bearer …` | Code | Opaque token; hash stored in D1 |
| Frontend login/register UI + store token | Next code pass | After Worker is redeployed |
| Optional later: Cloudflare Access / OAuth | Optional | Can replace password auth later |

**Auth endpoints (after redeploy):**

- `POST /api/v1/auth/register` – `{ sellerid, password, name?, email?, contact? }`
- `POST /api/v1/auth/login` – `{ sellerid, password }` → `{ token, seller, expiresAt }`
- `POST /api/v1/auth/logout` – Bearer token
- `GET /api/v1/auth/me` – Bearer token

Passwords: PBKDF2-SHA-256 (Web Crypto). Sessions expire in 30 days.

### P3.2 – Listing publication workflow

**Goal:** Listings are **draft → published → archived**, not always public.

| Step | Notes |
|------|--------|
| Column `status` (`draft` \| `published` \| `archived`) | Migration SQL |
| Column `published_at` | Set on first publish |
| Public `GET /listings` | **Only `published`** |
| `GET /listings/mine` | All statuses for logged-in seller |
| `POST /listings` | Creates as **draft** by default (`status` override allowed) |
| `POST /listings/:id/publish` | Owner only → `published` |
| `POST /listings/:id/unpublish` | Owner only → `draft` |
| `POST /listings/:id/archive` | Owner only → `archived` |

### P3.3 – Frontend (after Worker live)

1. Login / register modal; persist token in `localStorage`
2. Attach `Authorization: Bearer <token>` on mutations
3. Dashboard: drafts vs published vs archived; Publish / Unpublish buttons
4. Map/list show only published from API
5. Remove reliance on interim `X-Seller-Id` once sessions work

---

## Later priorities (unchanged direction)

| Priority | Topic |
|----------|--------|
| P4 | Cloudflare Access or stronger identity (optional upgrade) |
| P5 | R2 for durable images |
| P5 | Custom domain for API |
| P5 | CI deploy secrets on GitHub Actions |
| P6 | RFQ persistence in D1 (today RFQ is mostly client-side) |

---

## Workers you need

**Only one Worker:** `farmdirect-b2b` (already exists).

- **No second Worker** for auth – auth routes live on the same `workers/api.js`.
- Same D1 binding `DB`.
- Optional later: separate Worker only if you split image upload (R2) for size limits; not required for P3.

### Manual install checklist (phone/dashboard OK)

1. **Run migration** on D1 `b2bistening` → paste `schema/auth-migration.sql` in D1 Console.
2. **Replace Worker script** with the new `workers/api.js` from this repo (or `npx wrangler deploy`).
3. **Confirm bindings:** D1 binding name still `DB` → database `b2bistening`.
4. **Smoke test:**
   - `GET …/api/v1/health`
   - `POST …/api/v1/auth/register`
   - `POST …/api/v1/auth/login`
   - `GET …/api/v1/listings` (published only)
5. Set frontend API base to `https://farmdirect-b2b.fehrjohan65.workers.dev` if not already.

---

## Architecture (target after P3)

```
Browser
  → Authorization: Bearer <session token>
  → Worker farmdirect-b2b (workers/api.js)
       → D1 b2bistening
            sellers | sessions | listings (status)
```

Public map reads published listings only. Sellers manage drafts and publish when ready.
