import {
  sqliteTable,
  text,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const journalEntries = sqliteTable(
  "journal_entries",
  {
    id: text("id").primaryKey(),
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
    index("idx_journal_date").on(table.year, table.month, table.day),
    uniqueIndex("idx_journal_unique_date").on(table.year, table.month, table.day),
  ],
);

export const foodEntries = sqliteTable(
  "food_entries",
  {
    id: text("id").primaryKey(),
    source: text("source", {
      enum: ["web", "telegram"],
    }).notNull(),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    day: integer("day").notNull(),
    hour: integer("hour"),
    meal_slot: text("meal_slot", {
      enum: ["breakfast", "lunch", "dinner", "snack"],
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
    index("idx_food_date").on(table.year, table.month, table.day),
    index("idx_food_assigned_logged").on(table.assigned_at, table.logged_at),
  ],
);
