import {
  sqliteTable,
  text,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const entries = sqliteTable(
  "entries",
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
    index("idx_date").on(table.year, table.month, table.day),
    uniqueIndex("idx_unique_date").on(table.year, table.month, table.day),
  ],
);
