## Journal

Encrypted journal web app built with Next.js, TypeScript, Drizzle, Turso, and Cloudflare R2.

## Auth And Encryption

- Server auth uses Auth.js with Google sign-in.
- Google login creates the server session only.
- Users still unlock the journal separately with a client-side encryption passphrase at `/unlock`.
- The server never receives the raw passphrase or plaintext web journal content.

## Environment Variables

Create a local `.env` file with:

```bash
AUTH_SECRET="replace-me"
AUTH_GOOGLE_ID="replace-me"
AUTH_GOOGLE_SECRET="replace-me"
NEXT_PUBLIC_PBKDF2_SALT="base64-random-salt"
SERVER_ENCRYPTION_SECRET="replace-me"
TURSO_DATABASE_URL="file:local.db"
# Required when using a remote Turso database:
TURSO_AUTH_TOKEN="replace-me"
R2_ENDPOINT="https://<account>.r2.cloudflarestorage.com"
R2_ACCESS_KEY="replace-me"
R2_SECRET_KEY="replace-me"
R2_BUCKET="journal-images"
TELEGRAM_BOT_TOKEN="replace-me"
TELEGRAM_CHAT_ID="replace-me"
TELEGRAM_WEBHOOK_SECRET="replace-me"
```

Configure Google OAuth redirect URIs:

```text
http://localhost:3000/api/auth/callback/google
https://<your-domain>/api/auth/callback/google
```

## Development

Start the app:

```bash
pnpm dev
```

Generate and apply schema changes:

```bash
pnpm db:generate
pnpm db:push
```

Run checks:

```bash
pnpm lint
pnpm test
pnpm exec tsc --noEmit
pnpm build
```

## Notes

- Entries are user-scoped in the database.
- `SERVER_ENCRYPTION_SECRET` is required for unlock because the browser also derives the Telegram food-entry decryption key from it.
- Because the encryption key only lives in memory, refreshes and inactivity locks send the user back to `/unlock` instead of requiring a new Google login while the server session is still valid.
