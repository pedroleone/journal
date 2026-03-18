import type { MealSlot } from "./food";

export type EntrySource = "web" | "telegram";

export type ImageOwnerKind = "journal" | "food" | "note" | "note_subnote" | "library" | "library_note";

export interface BackupImageBlob {
  key: string;
  content_type: string;
  data: string;
}

export interface BackupJournalEntry {
  id: string;
  userId: string;
  source: EntrySource;
  year: number;
  month: number;
  day: number;
  hour: number | null;
  content: string;
  images: string[] | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface BackupFoodEntry {
  id: string;
  userId: string;
  source: EntrySource;
  year: number;
  month: number;
  day: number;
  hour: number | null;
  meal_slot: MealSlot | "snack" | null;
  assigned_at: string | null;
  logged_at: string;
  content: string;
  images: string[] | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface BackupPayloadV2 {
  version: 2;
  exported_at: string;
  journal_entries: BackupJournalEntry[];
  food_entries: BackupFoodEntry[];
  image_blobs: BackupImageBlob[];
}

export interface BackupLibraryItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  creator: string | null;
  url: string | null;
  status: string;
  rating: number | null;
  reactions: string[] | null;
  genres: string[] | null;
  metadata: Record<string, unknown> | null;
  cover_image: string | null;
  content: string | null;
  added_at: string;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BackupLibraryNote {
  id: string;
  mediaItemId: string;
  userId: string;
  content: string;
  images: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface BackupPayloadV3 {
  version: 3;
  exported_at: string;
  journal_entries: BackupJournalEntry[];
  food_entries: BackupFoodEntry[];
  image_blobs: BackupImageBlob[];
  library_items: BackupLibraryItem[];
  library_notes: BackupLibraryNote[];
}
