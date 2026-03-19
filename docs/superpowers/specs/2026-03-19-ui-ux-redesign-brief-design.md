# UI/UX Redesign Brief

## Objective

Create a new UI/UX for the app that preserves all current functionality while rethinking the product structure from first principles.

This document is intended as a neutral product requirements handoff for design work. It describes what the product must enable, not how the current implementation is laid out.

The redesign should not treat the current navigation, page boundaries, screen groupings, or interaction patterns as requirements.

## Product Summary

This is a private single-user journal app centered on personal record-keeping. It currently supports four main content domains:

- Journal
- Food log
- Notes
- Library

It also includes:

- Authentication and app entry
- Export and encrypted backup tools
- Settings and personal preferences
- Mobile-friendly behavior and installable PWA support
- Language and theme support

The product is privacy-first. The experience should consistently communicate trust, clarity, and personal ownership.

## Core User Jobs

The product must support these jobs:

- Capture private personal records quickly
- Return later to read, organize, and edit those records
- Attach and view images as part of records
- Move between quick capture and deeper management workflows
- Export readable versions of content
- Download and restore encrypted backups
- Use the product comfortably on desktop and mobile
- Adjust personal preferences such as language, theme, and startup view

## Functional Requirements

### 1. Entry And Access

The product must support:

- A pre-authentication entry experience
- Authentication into the app
- A default landing experience after entering the app
- Clear movement into the main product areas

Current implemented authentication is Google sign-in. The redesign may rethink how the entry experience is presented, but it should preserve a Google-based sign-in path unless product scope changes separately.

The redesign is free to change how these are organized, but it must preserve the ability to enter the product and reach the main areas reliably.

### 2. Journal

The journal domain must support:

- Creating written journal content for a date
- Editing existing journal content when editable
- A writing experience suitable for long-form personal writing
- Attaching multiple images to a journal entry
- Browsing journal content by date
- Reading past journal entries with text and images
- Continuing work on an existing entry for the current date instead of creating accidental duplicates
- Low-friction saving behavior suitable for active writing sessions
- Clear handling of offline or connection-limited situations

Additional current behavior to preserve:

- Journal writing uses markdown-capable editing
- The current product expectation is effectively one web-created journal entry per day

The redesign should also account for the fact that not all journal entries behave the same way:

- Some journal entries are editable
- Some journal entries are read-only

### 3. Food Log

The food domain must support:

- Extremely fast capture from the app
- Text-only entries
- Image-only entries
- Entries that include both text and images
- Viewing recent uncategorized food entries
- Organizing uncategorized entries later
- Assigning an uncategorized entry to a specific day
- Assigning an uncategorized entry to a meal slot
- Bulk organization of uncategorized entries
- Browsing food history by date
- Viewing a day as a set of meal slots
- Editing an existing food entry
- Deleting an existing food entry
- Representing intentionally skipped meal slots
- Supporting food entries created through the product's capture flows

Current meal-slot structure includes:

- Breakfast
- Morning snack
- Lunch
- Afternoon snack
- Dinner
- Midnight snack
- Observation

The experience should make it easy to switch between:

- Capture now
- Organize later
- Review a day in a structured way

### 4. Notes

The notes domain must support:

- Creating notes
- Viewing notes
- Editing notes
- Deleting notes
- Note titles
- Note body content
- Note tags
- Note images
- Filtering or narrowing notes by tag
- Nested follow-up content within a note
- Creating subnotes
- Editing subnotes
- Deleting subnotes

The redesign should preserve a writing-first feel rather than forcing heavy structure.

### 5. Library

The library domain must support:

- Creating and managing catalog items across multiple item/media types
- A quick-add path
- A fuller-detail creation path
- Browsing all items
- Searching items
- Filtering items by multiple criteria
- Viewing item details
- Editing item details
- Deleting items
- Tracking an item's status over time
- Recording personal notes or thoughts attached to an item
- Creating, editing, and deleting item-level notes
- Adding, changing, and removing a cover image

Current supported item/media types include:

- Book
- Album
- Movie
- Game
- Video
- Miscellaneous

Supported filtering and organization capabilities currently include:

- Type
- Status
- Genre
- Reaction
- Platform
- Rating
- Search

The redesign should preserve the ability to manage different metadata depending on the item type.

Current status lifecycle to preserve:

- Backlog
- In progress
- Finished
- Dropped

Current type-specific metadata examples include:

- Platform for games
- Page count for books
- Duration for movies
- Channel for videos

### 6. Export And Backup

The export and backup area must support:

- Selecting content to export by time range
- Selecting content to export manually
- Exporting readable content in multiple formats
- Exporting journal and food content
- Downloading a full encrypted backup file
- Restoring from a backup file

Current readable export formats include:

- Markdown
- Plain text
- Print-friendly/PDF-style export

The redesign should make backup restore feel safe, understandable, and hard to trigger accidentally.

### 7. Settings And Preferences

The product must support:

- Changing language
- Changing theme
- Choosing a default landing area after entering the app
- Opening export and backup tools

Current implemented preferences to preserve include:

- English and Brazilian Portuguese language support
- Light and dark theme support

### 8. Global Navigation And Cross-Product Movement

The product must support movement across these major areas:

- Journal
- Food
- Notes
- Library
- Settings
- Export/backup access

The redesign may completely rethink how this navigation works, but it must preserve fast access to the full product surface on both desktop and mobile.

### 9. Responsive And Installed-App Use

The redesign must support:

- Desktop use
- Mobile use
- Installable app behavior where available
- Clear install affordances when supported by the device/browser
- Sensible behavior when the app is opened without a connection

## Required States And Edge Cases

The design work must account for:

- Empty states for first use
- Loading states
- Error states
- Success feedback
- Destructive actions
- Confirmations
- Read-only content
- Offline states
- Reconnect-required states
- Content with images
- Content without images
- Items with incomplete data
- Long-form text content
- Fast capture flows on small screens

Important edge cases the redesign must preserve:

- Existing current-day journal writing should resume instead of unnecessarily creating duplicates
- Food entries may begin uncategorized and be organized later
- Meal slots may be intentionally skipped
- Some content can be edited while some related content is read-only
- Restore and delete actions need stronger safeguards than ordinary edits

## UX Constraints And Guardrails

### Must Preserve

- Full capability coverage across all implemented product areas
- A privacy-first feel
- Mobile viability as a first-class experience
- Clear support for image-based content where relevant
- Clear handling of editable versus read-only content where relevant
- Support for both quick entry and deep review/organization
- Support for localization and theme variation
- Usable states for loading, empty data, errors, confirmations, destructive actions, and offline behavior

### Must Not Assume

- The current page boundaries are correct
- The current navigation structure is correct
- The current browse-versus-create separation is correct
- The current sidebars, top bars, bottom bars, split views, or drawers should be preserved
- The current terminology is final
- The current workflows are ideal

### Should Optimize For

- Low friction for daily repeat use
- Fast capture on mobile
- Calm, focused reading and writing
- Easy movement between capture and organization
- Strong orientation so the user always understands where they are and what actions are available
- Reduced cognitive overhead for export and backup/restore flows

### Sensitive UX Areas

- Restore should feel safe and explicit
- Delete actions should be clear and deliberate
- Offline states should not feel like data loss
- Privacy messaging should build confidence without overwhelming the experience

## Current Scope Boundaries

The redesign should preserve current implemented scope.

Included in current scope:

- Journal
- Food
- Notes
- Library
- Export
- Encrypted backup download and restore
- Settings and preferences
- Theme support
- Language support
- Installable PWA support

This section is meant to prevent accidental over-design into unsupported domains, not to limit structural redesign inside the existing product surface.

## Deliverables Expected From Design

Expected design outputs:

- A new information architecture for the product
- A navigation model that works across desktop and mobile
- Key user flows covering capture, browse, edit, organize, export, restore, and settings
- Core screen concepts or templates covering the full product surface
- Treatment for major states including empty, loading, success, error, offline, confirmation, destructive, and read-only
- A rationale for how the redesign improves clarity, speed, and coherence without losing capability coverage

Recommended artifacts:

- App map or product map
- Primary user flows
- Low- or mid-fidelity wireframes
- Responsive behavior notes
- Component/state inventory for recurring patterns

## Explicit Freedom To Rethink Structure

This brief is intentionally structured around capabilities and user jobs rather than current screens.

The designer should:

- Invent the information architecture from scratch
- Propose new navigation patterns if they improve the experience
- Reorganize flows if that improves clarity and speed
- Combine or split experiences differently from the current implementation when justified

The designer should not:

- Mirror the current UI by default
- Treat current routes or page structure as design requirements
- Assume current layout choices are correct simply because they exist

The only hard requirement is preserving the full implemented functionality and the core product constraints described above.
