export type EntrySource = "web" | "telegram";

export type ImageOwnerKind = "journal" | "food";

export interface BackupImageBlob {
  key: string;
  iv: string;
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
  encrypted_content: string;
  iv: string;
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
  meal_slot: "breakfast" | "lunch" | "dinner" | "snack" | null;
  assigned_at: string | null;
  logged_at: string;
  encrypted_content: string;
  iv: string;
  images: string[] | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface BackupPayloadV1 {
  version: 1;
  exported_at: string;
  journal_entries: BackupJournalEntry[];
  food_entries: BackupFoodEntry[];
  image_blobs: BackupImageBlob[];
}
