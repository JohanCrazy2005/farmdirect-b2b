# FarmDirect B2B – Goal Document

**Status:** Live API + D1; next focus = **authentication** and **listing publication**  
**Repo:** JohanCrazy2005/farmdirect-b2b  
**Live Worker:** https://farmdirect-b2b.fehrjohan65.workers.dev  
**Frontend:** https://farmdirect-b2b-yjzt.vercel.app  
**Database:** Cloudflare D1 `b2bistening` (id `ad22b284-cafd-4f74-a8bc-6205056d38f8`, binding `DB`)

*Last updated: 2026-10-22 13:05 MDT – Richer seller cards now list real products via getListings(). Sole remaining blocker for live sessions remains the user-owned D1 auth migration (`schema/auth-migration.sql`). All code is ready. Run the SQL (ignore duplicate-column / table-exists errors).*

---

## Done (baseline)

| Item | Status |
|------|--------|
| Canonical listing shape + D1 schema | Done |
| Worker API CRUD + health | Done (interim `X-Seller-Id`) |
| Frontend map / list / filters / RFQ (demo-capable) | Done |
| Live Worker + D1 binding | Done |
| Sample data (incl. Cuauhtémoc, Chihuahua) | Available via seed SQL |
| Frontend login/register modal + Bearer token | Done |
| Dashboard drafts / published / archived + publish controls | Done (demo + live-ready) |
| Auth migration SQL executable + documented commands | Done |
| In-app deploy modal with exact wrangler commands | Done |
| Auth column-error UX opens deploy modal | Done |
| Seed listings explicitly status: published | Done |
| Dynamic seed banner on API fallback | Done |
| CI deploy workflow + secrets instructions | Documented |
| Distance shown in list items after Locate me | Done |
| getListings exported for search typeahead | Done |
| RFQ schema + Worker create/mine routes + frontend API prefer | Done (user runs migration when ready) |
| Dashboard RFQ inbox + badge prefer live API | Done (normalizes API/local shapes) |
| Richer seller cards listing real products | Done |

---

## Current priority: P3 – Authentication & listing publications

### P3.1 – Seller authentication (in progress – run migration on D1)

**Goal:** Real seller accounts so create/edit/delete/publish are tied to a logged-in identity, not a free-form `X-Seller-Id` header.

| Step | Owner | Notes |
|------|--------|--------|
| D1 migration: `sellers` password fields + `sessions` table | You (SQL in dashboard) | `schema/auth-migration.sql` (ALTERs now active). **This is the sole remaining blocker.** |
| Worker: register / login / logout / me | Done (already redeployed) | Same Worker `farmdirect-b2b` – **no new Worker required** |
| Session token in `Authorization: Bearer …` | Code | Opaque token; hash stored in D1 |
| Frontend login/register UI + store token | Done (modal + token storage) | Bearer preferred; interim ID still available |
| Optional later: Cloudflare Access / OAuth | Optional | Can replace password auth later |

**Auth endpoints (live):**

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

1. Login / register modal; persist token in `localStorage` – **Done**
2. Attach `Authorization: Bearer <token>` on mutations – **Done**
3. Dashboard: drafts vs published vs archived; Publish / Unpublish buttons – **Done**
4. Map/list show only published from API – already on Worker (and in demo fallback)
5. Remove reliance on interim `X-Seller-Id` once sessions work – after migration

---

## Later priorities (unchanged direction)

| Priority | Topic |
|----------|--------|
| P4 | Cloudflare Access or stronger identity (optional upgrade) |
| P5 | R2 for durable images |
| P5 | Custom domain for API |
| P5 | CI deploy secrets on GitHub Actions | Documented (add `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`) |
| P6 | RFQ persistence in D1 (schema + routes ready; user runs `schema/rfq-migration.sql` after auth) |

---

## Workers you need

**Only one Worker:** `farmdirect-b2b` (already exists).

- **No second Worker** for auth or RFQ – routes live on the same `workers/api.js`.
- Same D1 binding `DB`.
- Optional later: separate Worker only if you split image upload (R2) for size limits; not required for P3/P6.

### Manual install checklist (phone/dashboard OK)

1. **Run migration** on D1 `b2bistening` → paste `schema/auth-migration.sql` in D1 Console **or** `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql`. Ignore "duplicate column name" errors.
2. (Optional next) Run `schema/rfq-migration.sql` the same way for live RFQ storage.
3. Worker is already redeployed with auth + publication + RFQ routes.
4. **Confirm bindings:** D1 binding name still `DB` → database `b2bistening`.
5. **Smoke test:**
   - `GET …/api/v1/health`
   - `POST …/api/v1/auth/register`
   - `POST …/api/v1/auth/login`
   - `GET …/api/v1/listings` (published only)
   - `GET …/api/v1/listings/mine` (Bearer token)
   - `POST …/api/v1/rfqs` (after RFQ migration)
6. Frontend API base is already set to `https://farmdirect-b2b.fehrjohan65.workers.dev`.

---

## Architecture (target after P3)

```
Browser
  → Authorization: Bearer <session token>
  → Worker farmdirect-b2b (workers/api.js)
       → D1 b2bistening
            sellers | sessions | listings (status) | rfqs
```

Public map reads published listings only. Sellers manage drafts and publish when ready. Quote requests persist to D1 once the RFQ migration is applied.
