# Server-Side Encryption Migration

## Context

The app currently uses client-side E2E encryption (PBKDF2 + AES-GCM) where the server never sees plaintext. This blocks AI coaching features, which require the server to read content. The decision is to move to server-side encryption (content encrypted at rest in the DB, but the server can decrypt). Since this is early development, no data migration is needed.

Auth stays as Google OAuth + NextAuth.js (no Clerk). The passphrase prompt and all client-side key management are removed entirely.

---

## Files to Delete

- `lib/crypto.ts` — client-side PBKDF2/AES (replaced by server-side only)
- `lib/key-manager.ts` — in-memory key store (no longer needed)
- `lib/unlock.ts` — unlock helper
- `lib/client-entry.ts` — `decryptEntryContent()` (entries come back as plaintext `content`)
- `components/passphrase-prompt.tsx`
- `app/unlock/page.tsx`
- `hooks/use-require-unlock.ts`
- `app/api/entries/oldest/route.ts` — was only used for passphrase validation
- `app/api/auth/server-key/route.ts` — leaked SERVER_ENCRYPTION_SECRET to client
- `tests/lib/crypto.test.ts`
- `tests/lib/key-manager.test.ts` (if exists)
- `tests/components/passphrase-prompt.test.tsx` (if exists)

---

## Step 1 — `lib/server-crypto.ts`: Add `decryptServerBuffer`

Add alongside the existing `decryptServerText`:

```ts
export async function decryptServerBuffer(ciphertext: Uint8Array, iv: string): Promise<Uint8Array> {
  const key = await getServerCryptoKey();
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(iv) },
    key,
    ciphertext,
  );
  return new Uint8Array(decrypted);
}
```

## Step 2 — `lib/validators.ts`: Replace encrypted fields with `content`

- `createEntrySchema`: remove `encrypted_content` + `iv`, add `content: z.string()`
- `updateEntrySchema`: same
- `createFoodEntrySchema`: same
- `backupJournalEntrySchema` / `backupFoodEntrySchema`: replace `encrypted_content`/`iv` with `content: z.string()`
- `backupImageBlobSchema`: remove `iv`
- Bump `backupPayloadSchema` version literal: `z.literal(1)` → `z.literal(2)`

## Step 3 — `lib/types.ts`: Update backup types

- `BackupJournalEntry`, `BackupFoodEntry`: remove `encrypted_content`/`iv`, add `content: string`
- `BackupImageBlob`: remove `iv`
- Rename `BackupPayloadV1` → `BackupPayloadV2` with `version: 2`

## Step 4 — API routes: entries

**`app/api/entries/route.ts`**
- POST: receive `content`, call `encryptServerText(content)`, store `encrypted_content` + `iv`
- GET: fetch rows, `decryptServerText(row.encrypted_content, row.iv)` per row, return `{ ...row, content }` (drop `encrypted_content`/`iv` from response)

**`app/api/entries/[id]/route.ts`**
- GET: decrypt before returning
- PUT: receive `content`, encrypt, store

## Step 5 — API routes: food

**`app/api/food/route.ts`**
- POST: receive `content`, encrypt, store
- GET: decrypt each row, return `content`
- Telegram webhook (`app/api/telegram/webhook/route.ts`): already uses `encryptServerText` — no changes needed

## Step 6 — API routes: images

**`app/api/images/upload/route.ts`**
- Remove `iv` from form data validation
- Receive raw file bytes, encrypt server-side with `encryptServerBuffer`, store to R2

**`app/api/images/[key]/route.ts`**
- GET: fetch from R2, `decryptServerBuffer(object.body, object.iv)`, return plain bytes with real `Content-Type`
- Remove `X-Encryption-IV` and `X-Original-Content-Type` headers

## Step 7 — API routes: backup

**`app/api/backup/route.ts`**
- Decrypt content before exporting (plaintext backup, version 2)
- For images: `decryptServerBuffer` before base64-encoding, omit `iv` from blob

**`app/api/backup/restore/route.ts`**
- Receive `content` (plaintext), encrypt server-side on import
- For images: `base64ToBytes`, `encryptServerBuffer`, store to R2

## Step 8 — Client hooks

**`hooks/use-auto-save.ts`**
- Remove `getUserKey`, `encrypt` calls
- POST/PUT body: `{ content: currentContent, ... }` (plaintext)

**`hooks/use-decrypted-images.ts`** → rename to `hooks/use-images.ts`
- Remove `source` param, IV reading, `decryptBuffer` call
- Just `fetch` → `response.blob()` → `URL.createObjectURL(blob)`

## Step 9 — Client components and pages

**`components/encrypted-image-gallery.tsx`**
- Remove `source: EntrySource` prop
- Update call to `useImages(imageKeys)` (no source)
- Change "Decrypting..." → "Loading..."

**`components/journal/entry-viewer.tsx`**
- Remove `decryptEntryContent`, use `entry.content` directly
- Collapse `RawEntry`/`DecryptedEntry` into one type with `content: string`

**`app/journal/write/page.tsx`**
- Remove `useRequireUnlock`, `getUserKey`, `encrypt`, `decryptEntryContent`
- POST/PUT plain `content`; load and display `entry.content`

**`app/journal/browse/page.tsx`**
- Remove `useRequireUnlock`

**`app/food/page.tsx`**
- Remove `useRequireUnlock`, `encrypt`, `decryptEntryContent`
- POST plain `content`; display `entry.content`

**`app/food/browse/page.tsx`**
- Remove `useRequireUnlock`, `decryptEntryContent`
- `RawFoodEntry`: swap `encrypted_content`/`iv` for `content`

**`app/export/page.tsx`**
- Remove client-side decrypt; entries arrive with `content`
- `fetchImageDataUrls`: plain fetch → blob → base64 data URI

**`app/settings/page.tsx`**
- Remove "Security" section (wipe keys / lock now)

**`components/app-nav.tsx`**
- Remove `wipeKeys()` from logout handler

**`components/nav-wrapper.tsx`**
- Remove `/unlock` from pathname exclusions

## Step 10 — Environment variables

Remove `NEXT_PUBLIC_PBKDF2_SALT` from `.env`, `.env.local`, `.env.example` (if present).
`SERVER_ENCRYPTION_SECRET` remains.

## Step 11 — Tests

**Delete:** `tests/lib/crypto.test.ts`, key-manager and passphrase-prompt tests if they exist.

**Add:** `tests/lib/server-crypto.test.ts` — roundtrip tests for `decryptServerBuffer`.

**Update:**
- `tests/setup.ts`: remove `NEXT_PUBLIC_PBKDF2_SALT`, add `vi.mock` for `lib/server-crypto` returning `{ ciphertext: "mock-ct", iv: "mock-iv" }` for encrypt and `"decrypted"` for decrypt
- `tests/lib/validators.test.ts`: replace `encrypted_content`/`iv` fixtures with `content`
- `tests/api/entries.test.ts`: update fixtures, mock `encryptServerText`/`decryptServerText`
- `tests/api/entries-id.test.ts`: same
- `tests/hooks/use-auto-save.test.tsx`: remove crypto mocks, verify plaintext body sent

## Step 12 — DB reset (dev only)

```sh
rm local.db && pnpm db:push
```

For Turso: drop + recreate via dashboard or CLI, then push schema.

---

## Verification

1. `pnpm test` — all tests pass
2. `pnpm lint` + `pnpm build` — no TS errors, no remaining imports of deleted modules
3. Manual: Google login → journal write page loads immediately (no passphrase prompt) → type text → autosave fires → browse shows decrypted entries → food log works → image upload/display works → backup export produces plaintext JSON v2 → backup restore re-encrypts and imports correctly
4. Grep for leftover references: `encrypted_content` on client, `getUserKey`, `useRequireUnlock`, `/unlock` route
