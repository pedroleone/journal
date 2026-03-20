# Demo Seed Data Design

## Summary

Add a local-only, repeatable seed command that resets the first registered user's app data and recreates a realistic medium-density dataset across journal, food, notes, and library. The seeded content should include encrypted text, encrypted image blobs in R2, and enough variety to make UX/UI changes easy to evaluate.

## Goals

- Provide a single command that produces a believable "heavy user" account across the full app.
- Keep repeated runs fast by caching a small curated image set locally.
- Preserve the current privacy model by storing seeded text encrypted and image blobs encrypted.
- Prevent accidental destructive use by requiring explicit email confirmation against the first registered user.
- Keep the seeded dataset deterministic so UI comparisons are stable between runs.

## Non-Goals

- No production-facing admin seeding flow.
- No support for seeding arbitrary users by query or selector.
- No append or merge behavior with existing user data.
- No attempt to simulate browser auth flows or client-side encryption during seeding.
- No large-scale stress-test dataset or randomized data generator.

## Current Problem

The app currently has no fast way to populate a realistic account state for design and UX work. Manually creating enough entries, notes, food logs, library items, and images is slow, inconsistent, and makes visual iteration harder.

## Proposed Approach

Add a `pnpm` script that runs a local-only TypeScript seed entrypoint. The command will:

1. Resolve the first registered user from the database.
2. Print that user's email and require `--email <value>` to match exactly before continuing.
3. Validate that execution is happening in a local/dev environment and that required DB, crypto, and R2 env vars are present.
4. Clear the target user's existing journal, food, notes, subnotes, library items, library notes, and referenced encrypted image blobs.
5. Download a fixed curated image manifest into a local cache directory if the files are not already cached.
6. Recreate a deterministic medium-density dataset using direct DB inserts plus existing server-side encryption and R2 helpers.

This keeps the tool fast, repeatable, and independent from OAuth/session flows while still matching the app's storage model.

## Architecture

### Seed Command

- Add a new script such as `pnpm seed:demo -- --email you@example.com`.
- The entrypoint should live under `scripts/` or `lib/dev/` and be clearly marked as local-only.
- The command should exit with a clear error when:
  - no user exists
  - `--email` is missing
  - the provided email does not match the first registered user
  - required env vars are missing
  - the environment is not local/dev

### Dataset Builder

Build the dataset from fixed fixtures rather than ad-hoc generation. The seed definitions should describe:

- journal entries with date, hour, content, and optional image references
- food entries with meal slots, occasional uncategorized observations, tags, and optional images
- notes with title, content, tags, optional images, and optional subnotes
- library items covering every supported media type, with varied status, ratings, reactions, genres, metadata, optional encrypted notes, and optional cover images

The builder should keep timestamps and combinations believable but deterministic.

### Image Pipeline

- Keep a small curated image manifest in source control with stable URLs and metadata.
- Cache downloaded source files locally so later runs skip network fetches.
- Reuse the existing server-side buffer encryption and R2 upload helpers to store encrypted blobs.
- Attach image keys to seeded records using the same owner patterns used by the app:
  - journal and food entries use `images`
  - notes and subnotes use `images`
  - library items use `cover_image`
  - library notes use `images`

### Reset Pipeline

The reset path should gather all existing image keys owned by the target user, delete the DB records, and remove the corresponding encrypted R2 objects. The cleanup should cover:

- `entries`
- `food_entries`
- `notes`
- `note_subnotes`
- `media_items`
- `media_item_notes`

Because the tool is destructive by design, it should prefer clarity and determinism over partial-update logic.

## Data Shape

Seed a medium-density account that feels actively used without becoming noisy:

- Journal: about 45-60 entries across the last 2-3 months, with mixed lengths and image usage
- Food: about 35-50 entries across meal slots, plus a few uncategorized observations
- Notes: about 12-18 notes, mixed tag coverage, several image-backed notes, and a handful of subnotes
- Library: about 18-24 items covering `book`, `album`, `movie`, `game`, `video`, and `misc`, with varied statuses and metadata

Images should be selective rather than universal so the UI feels credible. Reuse across domains is acceptable if the dataset stays visually varied.

## File Responsibilities

Expected implementation units:

- one seed entrypoint responsible for CLI parsing and orchestration
- one dataset module responsible for deterministic seed fixtures
- one image manifest/cache helper responsible for downloading and reusing source files
- one reset helper responsible for collecting owned image keys and deleting existing data safely
- tests for dataset building and cleanup/image-key collection logic

The split should keep the destructive reset logic separate from content generation so each is easier to verify.

## Error Handling

- Abort before deletion if the target user cannot be confirmed.
- Abort before deletion if the environment is not local/dev.
- Abort before deletion if the curated image manifest cannot be prepared.
- If image upload fails during seeding, fail the command and surface which item failed.
- If reset cleanup cannot delete image blobs, surface the failure clearly instead of silently continuing.

The command does not need rollback across the entire reseed, but failures should be explicit and early where possible.

## Testing Strategy

Add unit tests rather than real integration tests for the seed tool:

- dataset builder returns the expected spread of records and media types
- reset helper collects image keys from every supported owner shape
- reset helper issues deletes in the expected order for a target user
- image manifest/cache helper skips downloads when cached files already exist
- CLI argument validation rejects missing or mismatched email confirmation

Run the new targeted tests and then run `pnpm test` to catch regressions.

## Risks

- Curated remote image URLs can disappear over time, so the manifest should stay small and easy to refresh.
- Direct DB seeding can drift from API validation rules if responsibilities are not centralized carefully.
- Destructive reset is dangerous if environment and email checks are too loose.
- Seed realism can degrade if the dataset becomes overly synthetic or too repetitive.

## Acceptance Criteria

- A local-only `pnpm` seed command exists for demo data.
- The command only targets the first registered user and requires exact email confirmation.
- Existing app data for that user is cleared before reseeding.
- Seeded data spans journal, food, notes, note subnotes, library items, and library notes.
- Seeded text is stored encrypted using the existing server crypto helpers.
- Seeded images are downloaded from a fixed manifest, cached locally, encrypted, and stored in R2.
- The library dataset includes every supported media type.
- Re-running the command produces a consistent medium-density account state.
- Automated tests cover dataset building and reset/helper logic.
