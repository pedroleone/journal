import {
  sqliteTable,
  text,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    googleSub: text("google_sub").notNull(),
    email: text("email").notNull(),
    telegramChatId: text("telegram_chat_id").unique(),
    telegramLinkToken: text("telegram_link_token"),
    telegramLinkTokenExpiresAt: text("telegram_link_token_expires_at"),
    created_at: text("created_at").notNull(),
    updated_at: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("idx_users_google_sub").on(table.googleSub),
    uniqueIndex("idx_users_email").on(table.email),
  ],
);

export const entries = sqliteTable(
  "entries",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    source: text("source", {
      enum: ["web", "telegram"],
    }).notNull(),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    day: integer("day").notNull(),
    hour: integer("hour"),
    encrypted_content: text("encrypted_content").notNull(),
    iv: text("iv").notNull(),
    images: text("images", { mode: "json" }).$type<string[] | null>(),
    tags: text("tags", { mode: "json" }).$type<string[] | null>(),
    created_at: text("created_at").notNull(),
    updated_at: text("updated_at").notNull(),
  },
  (table) => [
    index("idx_entries_user_date").on(
      table.userId,
      table.year,
      table.month,
      table.day,
    ),
    uniqueIndex("idx_entries_unique_user_date").on(
      table.userId,
      table.year,
      table.month,
      table.day,
    ),
  ],
);

export const foodEntries = sqliteTable(
  "food_entries",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    source: text("source", {
      enum: ["web", "telegram"],
    }).notNull(),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    day: integer("day").notNull(),
    hour: integer("hour"),
    meal_slot: text("meal_slot", {
      enum: ["breakfast", "morning_snack", "lunch", "afternoon_snack", "dinner", "midnight_snack", "observation"],
    }),
    assigned_at: text("assigned_at"),
    logged_at: text("logged_at").notNull(),
    encrypted_content: text("encrypted_content").notNull(),
    iv: text("iv").notNull(),
    images: text("images", { mode: "json" }).$type<string[] | null>(),
    tags: text("tags", { mode: "json" }).$type<string[] | null>(),
    created_at: text("created_at").notNull(),
    updated_at: text("updated_at").notNull(),
  },
  (table) => [
    index("idx_food_user_date").on(
      table.userId,
      table.year,
      table.month,
      table.day,
    ),
    index("idx_food_assigned_logged").on(table.assigned_at, table.logged_at),
  ],
);

export const notes = sqliteTable(
  "notes",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: text("title"),
    tags: text("tags", { mode: "json" }).$type<string[] | null>(),
    images: text("images", { mode: "json" }).$type<string[] | null>(),
    encrypted_content: text("encrypted_content").notNull(),
    iv: text("iv").notNull(),
    created_at: text("created_at").notNull(),
    updated_at: text("updated_at").notNull(),
  },
  (table) => [
    index("idx_notes_user").on(table.userId),
    index("idx_notes_user_updated").on(table.userId, table.updated_at),
  ],
);

export const noteSubnotes = sqliteTable(
  "note_subnotes",
  {
    id: text("id").primaryKey(),
    noteId: text("note_id").notNull().references(() => notes.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    images: text("images", { mode: "json" }).$type<string[] | null>(),
    encrypted_content: text("encrypted_content").notNull(),
    iv: text("iv").notNull(),
    created_at: text("created_at").notNull(),
    updated_at: text("updated_at").notNull(),
  },
  (table) => [
    index("idx_note_subnotes_note").on(table.noteId),
  ],
);

export const mediaItems = sqliteTable(
  "media_items",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type", {
      enum: ["book", "album", "movie", "game", "video", "misc"],
    }).notNull(),
    title: text("title").notNull(),
    creator: text("creator"),
    url: text("url"),
    status: text("status", {
      enum: ["backlog", "in_progress", "finished", "dropped"],
    }).notNull(),
    rating: integer("rating"),
    reactions: text("reactions", { mode: "json" }).$type<string[] | null>(),
    genres: text("genres", { mode: "json" }).$type<string[] | null>(),
    metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown> | null>(),
    cover_image: text("cover_image"),
    encrypted_content: text("encrypted_content"),
    iv: text("iv"),
    added_at: text("added_at").notNull(),
    started_at: text("started_at"),
    finished_at: text("finished_at"),
    created_at: text("created_at").notNull(),
    updated_at: text("updated_at").notNull(),
  },
  (table) => [
    index("idx_media_items_user").on(table.userId),
    index("idx_media_items_user_updated").on(table.userId, table.updated_at),
    index("idx_media_items_user_type").on(table.userId, table.type),
  ],
);

export const mediaItemNotes = sqliteTable(
  "media_item_notes",
  {
    id: text("id").primaryKey(),
    mediaItemId: text("media_item_id")
      .notNull()
      .references(() => mediaItems.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    images: text("images", { mode: "json" }).$type<string[] | null>(),
    encrypted_content: text("encrypted_content").notNull(),
    iv: text("iv").notNull(),
    created_at: text("created_at").notNull(),
    updated_at: text("updated_at").notNull(),
  },
  (table) => [
    index("idx_media_item_notes_item").on(table.mediaItemId),
  ],
);
