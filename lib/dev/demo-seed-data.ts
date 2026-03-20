import type { MealSlot } from "@/lib/food";
import type { MediaStatus, MediaType } from "@/lib/library";

type DemoSeedBaseRecord = {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

export type DemoSeedJournalEntry = DemoSeedBaseRecord & {
  year: number;
  month: number;
  day: number;
  hour: number | null;
  content: string;
  imageRefs: string[];
};

export type DemoSeedFoodEntry = DemoSeedBaseRecord & {
  year: number;
  month: number;
  day: number;
  hour: number | null;
  mealSlot: MealSlot | null;
  content: string;
  imageRefs: string[];
  tags: string[];
  loggedAt: string;
  assignedAt: string | null;
};

export type DemoSeedNote = DemoSeedBaseRecord & {
  title: string;
  content: string;
  tags: string[];
  imageRefs: string[];
};

export type DemoSeedNoteSubnote = DemoSeedBaseRecord & {
  noteId: string;
  content: string;
  imageRefs: string[];
};

export type DemoSeedLibraryItem = DemoSeedBaseRecord & {
  type: MediaType;
  title: string;
  creator: string | null;
  url: string | null;
  status: MediaStatus;
  rating: number | null;
  reactions: string[];
  genres: string[];
  metadata: Record<string, unknown> | null;
  content: string;
  coverImageRef: string | null;
  addedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
};

export type DemoSeedLibraryNote = DemoSeedBaseRecord & {
  mediaItemId: string;
  content: string;
  imageRefs: string[];
};

export type DemoSeedData = {
  journalEntries: DemoSeedJournalEntry[];
  foodEntries: DemoSeedFoodEntry[];
  notes: DemoSeedNote[];
  noteSubnotes: DemoSeedNoteSubnote[];
  libraryItems: DemoSeedLibraryItem[];
  libraryNotes: DemoSeedLibraryNote[];
  imageRefs: Set<string>;
};

const IMAGE_IDS = [
  "desk-book",
  "meal-bowl",
  "street-night",
  "vinyl-corner",
  "movie-theater",
  "game-handheld",
  "notebook-flatlay",
  "coffee-window",
  "sunset-walk",
  "shelf-detail",
] as const;

const JOURNAL_OPENERS = [
  "Slow start, but the day got better after lunch.",
  "Felt unusually clear-headed this morning.",
  "Spent most of the afternoon bouncing between small tasks.",
  "Had one of those days where the right playlist fixed everything.",
  "The evening was quieter than expected, which helped.",
  "Work moved in bursts instead of one clean stretch.",
];

const JOURNAL_CLOSERS = [
  "I want to keep the momentum from this one.",
  "Worth repeating the parts that worked.",
  "Need a cleaner version of this routine tomorrow.",
  "Nothing dramatic, just a solid ordinary day.",
  "I should not overcomplicate what was obviously helping.",
  "This felt more balanced than last week.",
];

const NOTE_TOPICS = [
  "Studio refresh ideas",
  "Small rituals that improve focus",
  "Albums worth replaying on quiet mornings",
  "Ways to make the week feel less fragmented",
  "Places I want to revisit",
  "Books to pair with rainy weekends",
  "Recipes that are reliable under low energy",
  "Games that felt good in short sessions",
  "Film scenes I keep thinking about",
  "Loose plans for the apartment",
  "Writing prompts that still work",
  "Pocket list for good solo afternoons",
  "Things the current UI still hides too much",
  "Signals that a day is going off-track",
];

const LIBRARY_ITEMS: Array<{
  id: string;
  type: MediaType;
  title: string;
  creator: string | null;
  status: MediaStatus;
  rating: number | null;
  reactions: string[];
  genres: string[];
  metadata: Record<string, unknown> | null;
  content: string;
  coverImageRef: string | null;
}> = [
  { id: "library-book-1", type: "book", title: "The Left Hand of Darkness", creator: "Ursula K. Le Guin", status: "finished", rating: 5, reactions: ["thought-provoking", "beautiful"], genres: ["science fiction"], metadata: { pages: 304 }, content: "Finished this recently and kept thinking about the restraint in how it explains itself.", coverImageRef: "desk-book" },
  { id: "library-book-2", type: "book", title: "Bluets", creator: "Maggie Nelson", status: "in_progress", rating: null, reactions: ["intense"], genres: ["essay"], metadata: { pages: 96 }, content: "Reading this in small pieces works better than trying to rush it.", coverImageRef: "coffee-window" },
  { id: "library-book-3", type: "book", title: "A Psalm for the Wild-Built", creator: "Becky Chambers", status: "backlog", rating: null, reactions: ["cozy"], genres: ["science fiction"], metadata: { pages: 160 }, content: "Queued up for a low-stress weekend read.", coverImageRef: null },
  { id: "library-album-1", type: "album", title: "Vespertine", creator: "Björk", status: "finished", rating: 5, reactions: ["beautiful", "virtuoso"], genres: ["art pop"], metadata: { platform: ["vinyl"] }, content: "The production still feels meticulous without sounding cold.", coverImageRef: "vinyl-corner" },
  { id: "library-album-2", type: "album", title: "Promises", creator: "Floating Points / Pharoah Sanders", status: "in_progress", rating: null, reactions: ["beautiful"], genres: ["jazz", "ambient"], metadata: { platform: ["streaming"] }, content: "Using this as focus music for late afternoon work blocks.", coverImageRef: "shelf-detail" },
  { id: "library-album-3", type: "album", title: "Titanic Rising", creator: "Weyes Blood", status: "backlog", rating: null, reactions: ["interesting"], genres: ["indie pop"], metadata: { platform: ["streaming"] }, content: "I know I will like this; just have not made room for it yet.", coverImageRef: null },
  { id: "library-movie-1", type: "movie", title: "In the Mood for Love", creator: "Wong Kar-wai", status: "finished", rating: 5, reactions: ["beautiful", "thought-provoking"], genres: ["drama"], metadata: { runtime_minutes: 98 }, content: "Every frame is so controlled that even the pauses feel composed.", coverImageRef: "movie-theater" },
  { id: "library-movie-2", type: "movie", title: "Perfect Days", creator: "Wim Wenders", status: "finished", rating: 4, reactions: ["cozy"], genres: ["drama"], metadata: { runtime_minutes: 123 }, content: "Quiet in a way that makes everyday routines feel generous.", coverImageRef: "street-night" },
  { id: "library-movie-3", type: "movie", title: "Decision to Leave", creator: "Park Chan-wook", status: "dropped", rating: 3, reactions: ["interesting"], genres: ["thriller"], metadata: { runtime_minutes: 138 }, content: "Liked parts of it, but I was never in the right mood to finish.", coverImageRef: null },
  { id: "library-game-1", type: "game", title: "Balatro", creator: "LocalThunk", status: "in_progress", rating: null, reactions: ["funny", "intense"], genres: ["roguelike"], metadata: { platform: ["Switch"] }, content: "Great for fifteen-minute bursts that somehow turn into an hour.", coverImageRef: "game-handheld" },
  { id: "library-game-2", type: "game", title: "Citizen Sleeper", creator: "Jump Over the Age", status: "finished", rating: 5, reactions: ["thought-provoking"], genres: ["rpg"], metadata: { platform: ["PC"] }, content: "One of the few games lately that made me want to journal afterward.", coverImageRef: "desk-book" },
  { id: "library-game-3", type: "game", title: "Mini Motorways", creator: "Dinosaur Polo Club", status: "backlog", rating: null, reactions: ["cozy"], genres: ["strategy"], metadata: { platform: ["iPad"] }, content: "Saving this for low-friction evenings.", coverImageRef: null },
  { id: "library-video-1", type: "video", title: "Tokyo Morning Walks", creator: "A Bao", status: "finished", rating: 4, reactions: ["cozy"], genres: ["travel"], metadata: { platform: ["YouTube"] }, content: "Good background viewing while planning the day.", coverImageRef: "sunset-walk" },
  { id: "library-video-2", type: "video", title: "Designing Small Interfaces", creator: "Layout Craft", status: "in_progress", rating: null, reactions: ["interesting"], genres: ["design"], metadata: { platform: ["YouTube"] }, content: "Mostly watching this for spacing and hierarchy notes.", coverImageRef: "notebook-flatlay" },
  { id: "library-video-3", type: "video", title: "Street Food Diaries: Osaka", creator: "Field Notes", status: "backlog", rating: null, reactions: ["funny"], genres: ["food"], metadata: { platform: ["YouTube"] }, content: "Queued for a weekend lunch break.", coverImageRef: null },
  { id: "library-misc-1", type: "misc", title: "Ceramic Pour-Over Set", creator: "Kinto", status: "finished", rating: 4, reactions: ["beautiful"], genres: ["home"], metadata: { platform: ["wishlist"] }, content: "Bought this after staring at it for weeks. Looks good and is easy to clean.", coverImageRef: "coffee-window" },
  { id: "library-misc-2", type: "misc", title: "Pocket Field Recorder", creator: "Zoom", status: "in_progress", rating: null, reactions: ["interesting"], genres: ["audio"], metadata: { platform: ["gear"] }, content: "Still deciding whether this is practical or just appealing in theory.", coverImageRef: "shelf-detail" },
  { id: "library-misc-3", type: "misc", title: "Weekend Exhibition Notes", creator: null, status: "finished", rating: 4, reactions: ["thought-provoking"], genres: ["art"], metadata: { venue: "IMS Paulista" }, content: "Filing the exhibition under misc makes sense for now because it is mostly references and notes.", coverImageRef: "street-night" },
];

function toIsoDate(base: Date, daysAgo: number, hour: number) {
  const date = new Date(base);
  date.setUTCDate(base.getUTCDate() - daysAgo);
  date.setUTCHours(hour, 0, 0, 0);
  return date;
}

function recordTimestamps(base: Date, daysAgo: number, hour: number) {
  const created = toIsoDate(base, daysAgo, hour);
  return {
    createdAt: created.toISOString(),
    updatedAt: new Date(created.getTime() + 45 * 60 * 1000).toISOString(),
  };
}

function dateParts(base: Date, daysAgo: number, hour: number) {
  const date = toIsoDate(base, daysAgo, hour);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour,
  };
}

function buildJournalEntries(userId: string, base: Date) {
  return Array.from({ length: 48 }, (_, index): DemoSeedJournalEntry => {
    const daysAgo = index + 1;
    const hour = [7, 9, 12, 18, 21][index % 5];
    const imageRefs = index % 4 === 0 ? [IMAGE_IDS[index % IMAGE_IDS.length]] : [];
    return {
      id: `journal-${String(index + 1).padStart(2, "0")}`,
      userId,
      ...recordTimestamps(base, daysAgo, hour),
      ...dateParts(base, daysAgo, hour),
      content: `${JOURNAL_OPENERS[index % JOURNAL_OPENERS.length]} ${JOURNAL_CLOSERS[index % JOURNAL_CLOSERS.length]}`,
      imageRefs,
    };
  });
}

function buildFoodEntries(userId: string, base: Date) {
  const mealTemplates: Array<{ mealSlot: MealSlot | null; hour: number; tags: string[]; content: string }> = [
    { mealSlot: "breakfast", hour: 8, tags: ["home"], content: "Toast, eggs, and coffee. Simple, solid start." },
    { mealSlot: "lunch", hour: 13, tags: ["workday"], content: "Rice bowl with vegetables and something quick on top." },
    { mealSlot: "dinner", hour: 20, tags: ["home"], content: "Pasta or soup depending on energy. Kept it light." },
  ];

  const structured = Array.from({ length: 36 }, (_, index): DemoSeedFoodEntry => {
    const template = mealTemplates[index % mealTemplates.length];
    const daysAgo = Math.floor(index / 3) + 1;
    const timestamps = recordTimestamps(base, daysAgo, template.hour);
    return {
      id: `food-${String(index + 1).padStart(2, "0")}`,
      userId,
      ...timestamps,
      ...dateParts(base, daysAgo, template.hour),
      mealSlot: template.mealSlot,
      content: template.content,
      imageRefs: index % 5 === 0 ? [IMAGE_IDS[(index + 1) % IMAGE_IDS.length]] : [],
      tags: template.tags,
      loggedAt: timestamps.createdAt,
      assignedAt: timestamps.createdAt,
    };
  });

  const uncategorized = Array.from({ length: 4 }, (_, index): DemoSeedFoodEntry => {
    const daysAgo = index * 5 + 2;
    const timestamps = recordTimestamps(base, daysAgo, 16);
    return {
      id: `food-note-${index + 1}`,
      userId,
      ...timestamps,
      ...dateParts(base, daysAgo, 16),
      mealSlot: null,
      content: "Quick snack note or ingredient reminder added before assigning it properly.",
      imageRefs: index % 2 === 0 ? ["meal-bowl"] : [],
      tags: ["uncategorized"],
      loggedAt: timestamps.createdAt,
      assignedAt: null,
    };
  });

  return [...structured, ...uncategorized];
}

function buildNotes(userId: string, base: Date) {
  return NOTE_TOPICS.map((title, index): DemoSeedNote => ({
    id: `note-${String(index + 1).padStart(2, "0")}`,
    userId,
    ...recordTimestamps(base, index * 2 + 1, 10),
    title,
    content: `${title}.\n\nKept this note around because it still turns into useful decisions when I revisit it.`,
    tags: [index % 2 === 0 ? "personal" : "ideas", index % 3 === 0 ? "favorite" : "reference"],
    imageRefs: index % 4 === 0 ? [IMAGE_IDS[(index + 2) % IMAGE_IDS.length]] : [],
  }));
}

function buildNoteSubnotes(userId: string, notes: DemoSeedNote[], base: Date) {
  return notes.slice(0, 7).map((note, index): DemoSeedNoteSubnote => ({
    id: `subnote-${String(index + 1).padStart(2, "0")}`,
    noteId: note.id,
    userId,
    ...recordTimestamps(base, index + 1, 19),
    content: "Small follow-up thought attached later once the original note started proving useful.",
    imageRefs: index % 3 === 0 ? ["notebook-flatlay"] : [],
  }));
}

function buildLibraryItems(userId: string, base: Date) {
  return LIBRARY_ITEMS.map((item, index): DemoSeedLibraryItem => {
    const addedAt = toIsoDate(base, index * 2 + 3, 18).toISOString();
    const startedAt = item.status === "in_progress" || item.status === "finished"
      ? toIsoDate(base, index * 2 + 2, 18).toISOString()
      : null;
    const finishedAt = item.status === "finished"
      ? toIsoDate(base, index * 2 + 1, 20).toISOString()
      : null;

    return {
      ...item,
      userId,
      createdAt: addedAt,
      updatedAt: new Date(new Date(addedAt).getTime() + 30 * 60 * 1000).toISOString(),
      addedAt,
      startedAt,
      finishedAt,
    };
  });
}

function buildLibraryNotes(userId: string, items: DemoSeedLibraryItem[], base: Date) {
  return items.slice(0, 10).map((item, index): DemoSeedLibraryNote => ({
    id: `library-note-${String(index + 1).padStart(2, "0")}`,
    mediaItemId: item.id,
    userId,
    ...recordTimestamps(base, index + 1, 22),
    content: "Short reaction note captured separately so the main item stays readable at a glance.",
    imageRefs: index % 4 === 0 ? [IMAGE_IDS[(index + 4) % IMAGE_IDS.length]] : [],
  }));
}

export function buildDemoSeedData(
  userId: string,
  now: Date = new Date("2026-03-20T12:00:00.000Z"),
): DemoSeedData {
  const journalEntries = buildJournalEntries(userId, now);
  const foodEntries = buildFoodEntries(userId, now);
  const notes = buildNotes(userId, now);
  const noteSubnotes = buildNoteSubnotes(userId, notes, now);
  const libraryItems = buildLibraryItems(userId, now);
  const libraryNotes = buildLibraryNotes(userId, libraryItems, now);

  const imageRefs = new Set<string>();
  for (const entry of journalEntries) {
    for (const imageRef of entry.imageRefs) imageRefs.add(imageRef);
  }
  for (const entry of foodEntries) {
    for (const imageRef of entry.imageRefs) imageRefs.add(imageRef);
  }
  for (const note of notes) {
    for (const imageRef of note.imageRefs) imageRefs.add(imageRef);
  }
  for (const subnote of noteSubnotes) {
    for (const imageRef of subnote.imageRefs) imageRefs.add(imageRef);
  }
  for (const item of libraryItems) {
    if (item.coverImageRef) imageRefs.add(item.coverImageRef);
  }
  for (const note of libraryNotes) {
    for (const imageRef of note.imageRefs) imageRefs.add(imageRef);
  }

  return {
    journalEntries,
    foodEntries,
    notes,
    noteSubnotes,
    libraryItems,
    libraryNotes,
    imageRefs,
  };
}
