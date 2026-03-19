# Architecture Review

## Architectural Deepening Candidates

### 1. Image Lifecycle Module
**Cluster:** `lib/entry-images.ts`, `lib/client-images.ts`, `lib/client-image-processing.ts`, `app/api/images/upload/route.ts`, `lib/r2.ts`, `lib/server-crypto.ts`
**Why they're coupled:** A single image upload touches 7 files spanning client prep -> validation -> API -> DB dispatch -> crypto -> R2 storage. The `getOwnerImageRecord()` function dispatches across 6 entity types with inconsistent patterns (images array vs cover_image). Adding a new entity type requires changes in 2+ places.
**Dependency category:** Cross-boundary (DB + external storage + crypto)
**Test impact:** Currently untested end-to-end. A deep module could replace per-entity image tests with boundary tests on a single `ImageStore` interface.

### 2. Telegram Webhook Monolith
**Cluster:** `app/api/telegram/webhook/route.ts` (224 lines), `lib/auth/user.ts` (linking functions), `lib/server-crypto.ts`, `lib/r2.ts`
**Why they're coupled:** The webhook handler does command parsing, account linking, food entry creation, photo download/encryption/upload, and Telegram API calls -- all inline in one function. External API calls (Telegram file download, sendMessage) make it untestable.
**Dependency category:** Cross-boundary (external API + DB + crypto + storage)
**Test impact:** Currently zero test coverage. Extracting pure logic (command parsing, entry construction) behind a boundary would make most of it testable without mocking external APIs.

### 3. Encrypted Content Pipeline
**Cluster:** `lib/server-crypto.ts`, `lib/base64.ts`, `lib/r2.ts` (IV in metadata), every API route that reads/writes encrypted content
**Why they're coupled:** Every API route that touches entries, notes, or food duplicates the encrypt-on-write / decrypt-on-read pattern. The crypto details (AES-GCM, IV storage, base64 encoding) leak into every route handler. Changing the encryption scheme would require editing 10+ route files.
**Dependency category:** Same-process (crypto is a utility used everywhere)
**Test impact:** Currently tested at the crypto unit level but not at the "encrypt then store then retrieve then decrypt" level. A deep module could hide the entire encrypt/store/retrieve/decrypt cycle behind one interface.

### 4. Entity-Specific API Route Duplication
**Cluster:** `app/api/entries/`, `app/api/food/`, `app/api/notes/`, `app/api/library/` (29 routes total)
**Why they're coupled:** Journal entries, food entries, notes, and library items all follow the same pattern: auth check -> validate -> encrypt -> DB write -> respond. Each route re-implements this pattern with entity-specific variations. The auth + validation + encryption boilerplate is duplicated across all of them.
**Dependency category:** Same-process (shared patterns, not shared code)
**Test impact:** Tests currently mock the same DB/crypto chain per route. A shared handler pattern could reduce test surface to: one integration test for the pipeline + per-entity tests for business logic only.

### 5. Auto-Save State Machine
**Cluster:** `hooks/use-auto-save.ts`, `hooks/use-online-status.ts`, journal write page, food entry page
**Why they're coupled:** Complex timing logic (1.5s debounce + 30s interval + offline detection) interleaved with API calls and ref-based state. The state machine is implicit in `useEffect` chains rather than explicit.
**Dependency category:** Same-process (React hooks)
**Test impact:** Currently untested due to timing sensitivity. Extracting the state machine as a pure reducer would make it trivially testable.
