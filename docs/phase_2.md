# Phase 2 — Gap Analysis

## Scope Reviewed

- `docs/IDEA.md`
- `docs/redesign.md`
- Current app code (routes, pages, components, schema, crypto, key manager, tests)

Date of review: 2026-03-06.

---

## What Is Already Implemented

- Password login/logout with JWT cookie sessions and middleware protection.
- Client-side passphrase-derived AES-GCM encryption for web journal/food text.
- In-memory key manager with inactivity wipe + visibility lock flow.
- Journal write flow with autosave and date picker.
- Journal browse flow with year/month/day sidebar and client-side decryption on selection.
- Food quick log (text only), uncategorized triage, per-entry assignment, assign-all by date, meal slot suggestion, and date tree with day counts/empty days.
- Base API test coverage for existing auth/journal/food routes and crypto helpers.

---

## Missing From `docs/IDEA.md` (High Priority)

1. Encrypted image pipeline is not implemented.
- No `encryptBuffer` / `decryptBuffer` utilities.
- No R2 client wiring and no image API routes (`/api/images/upload`, `/api/images/[key]`).
- No image upload/decrypt/render UI in journal or food flows.

2. Telegram integration is not implemented.
- No `/api/telegram/webhook`.
- No webhook secret validation, chat-id allowlist, Telegram media fetch, or confirmation reply.
- No server-side encryption path for Telegram-origin entries.

3. Server key flow for Telegram decryption is not implemented.
- No `GET /api/auth/server-key`.
- Key manager stores one key only (no separate server-derived key lifecycle).
- Client decryption does not branch by `source` key strategy.

4. Backup/restore is not implemented.
- No `/api/backup` and `/api/backup/restore`.
- No encrypted JSON backup export including R2 image blobs.

5. Export feature is only partially implemented.
- Modal export exists for markdown/plain text, but no dedicated `/export` page.
- No encrypted backup export option from UI.

6. Entry model is narrower than IDEA spec.
- IDEA expects generalized entry types (`journal`, `food`, `idea`, `note`) under one entry model.
- Current code split into `journal_entries` + `food_entries` and does not support `idea`/`note`.

---

## Missing From `docs/redesign.md` (Medium Priority)

1. Settings surface is missing.
- Redesign includes a settings action (`[⚙]`) for export/key/Telegram-related actions.
- Current nav has logout but no settings route/panel.

2. Journal export UX is partial.
- No custom range picker.
- No PDF export option.
- No hierarchy-driven multi-select/select-all by month/year from browse tree.

3. Image affordances in write/log flows are missing.
- Journal write bar does not include image attach.
- Food quick log has no optional photo action.

4. “New entry for today already exists” behavior is implicit, not explicit.
- Current write page auto-loads entry for selected day.
- Redesign mentions explicit append/view confirmation as a possible UX decision.

---

## Technical/Documentation Gaps

1. README is still the default Next.js template and does not document actual architecture, env vars, or setup.
2. Middleware public route list will need adjustment once Telegram webhook is added (webhook should bypass session auth and use header secret auth).
3. Test suite does not yet cover Phase 2 features (images, Telegram, server-key route, backup/restore, R2 integration paths).

---

## Suggested Phase 2 Build Order

1. Image encryption + R2 routes + UI attach/render.
2. Server encryption key utilities + `/api/auth/server-key` + dual-key manager support.
3. Telegram webhook ingest pipeline (text + photo).
4. Backup/restore API + encrypted backup export.
5. Redesign polish items (settings, export UX, optional photo affordances).

