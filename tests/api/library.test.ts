import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as serverCrypto from "@/lib/server-crypto";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb = vi.mocked(db) as any;
const mockServerCrypto = vi.mocked(serverCrypto);
const mockAuth = auth as unknown as {
  mockReset: () => void;
  mockResolvedValue: (value: unknown) => void;
  mockResolvedValueOnce: (value: unknown) => void;
};

function authed() {
  mockAuth.mockResolvedValue({ user: { id: "user-1", email: "user@example.com" } });
}

function resetDb() {
  mockDb.select.mockReturnThis();
  mockDb.from.mockReturnThis();
  mockDb.where.mockResolvedValue([]);
  mockDb.insert.mockReturnThis();
  mockDb.values.mockResolvedValue(undefined);
  mockDb.update.mockReturnThis();
  mockDb.set.mockReturnThis();
  mockDb.delete.mockReturnThis();
  mockDb.orderBy.mockResolvedValue([]);
}

describe("POST /api/library", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReset();
    authed();
    resetDb();
  });

  async function postItem(body: Record<string, unknown>) {
    const { POST } = await import("@/app/api/library/route");
    return POST(
      new NextRequest("http://localhost/api/library", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      }),
    );
  }

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const res = await postItem({ type: "book", title: "Test" });
    expect(res.status).toBe(401);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("returns 201 with id on valid input", async () => {
    const res = await postItem({ type: "book", title: "My Book" });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(typeof data.id).toBe("string");
  });

  it("returns 400 when title is missing", async () => {
    const res = await postItem({ type: "book" });
    expect(res.status).toBe(400);
  });

  it("encrypts content when provided", async () => {
    await postItem({ type: "album", title: "Album", content: "Great album" });
    expect(mockServerCrypto.encryptServerText).toHaveBeenCalledWith("Great album");
  });

  it("defaults status to backlog", async () => {
    await postItem({ type: "movie", title: "Movie" });
    expect(mockDb.values).toHaveBeenCalledWith(
      expect.objectContaining({ status: "backlog" }),
    );
  });

  it("sets added_at timestamp", async () => {
    await postItem({ type: "game", title: "Game" });
    expect(mockDb.values).toHaveBeenCalledWith(
      expect.objectContaining({ added_at: expect.any(String) }),
    );
  });
});

describe("GET /api/library", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReset();
    authed();
    resetDb();
  });

  async function getItems(params: Record<string, string> = {}) {
    const { GET } = await import("@/app/api/library/route");
    const url = new URL("http://localhost/api/library");
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    return GET(new NextRequest(url));
  }

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const res = await getItems();
    expect(res.status).toBe(401);
  });

  it("returns 200 with array", async () => {
    mockDb.where.mockReturnThis();
    mockDb.orderBy.mockResolvedValue([
      { id: "m1", type: "book", title: "Book 1", creator: null, status: "backlog", rating: null, updated_at: "2026-03-07T00:00:00.000Z" },
    ]);
    const res = await getItems();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data[0].id).toBe("m1");
  });

  it("does not include encrypted_content in list", async () => {
    mockDb.where.mockReturnThis();
    mockDb.orderBy.mockResolvedValue([
      { id: "m1", type: "book", title: "Book", status: "backlog" },
    ]);
    const res = await getItems();
    const data = await res.json();
    expect(data[0].encrypted_content).toBeUndefined();
  });

  it("filters by type param", async () => {
    mockDb.where.mockReturnThis();
    mockDb.orderBy.mockResolvedValue([]);
    const res = await getItems({ type: "movie" });
    expect(res.status).toBe(200);
  });

  it("filters by platform param", async () => {
    mockDb.where.mockReturnThis();
    mockDb.orderBy.mockResolvedValue([]);
    const res = await getItems({ platform: "PS5" });
    expect(res.status).toBe(200);
  });

  it("filters by rating param", async () => {
    mockDb.where.mockReturnThis();
    mockDb.orderBy.mockResolvedValue([]);
    const res = await getItems({ rating: "3" });
    expect(res.status).toBe(200);
  });

  it("filters by search param", async () => {
    mockDb.where.mockReturnThis();
    mockDb.orderBy.mockResolvedValue([]);
    const res = await getItems({ search: "tolkien" });
    expect(res.status).toBe(200);
  });

  it("combines multiple filters", async () => {
    mockDb.where.mockReturnThis();
    mockDb.orderBy.mockResolvedValue([]);
    const res = await getItems({ type: "book", status: "finished", genre: "sci-fi", rating: "4" });
    expect(res.status).toBe(200);
  });

  it("returns 400 for invalid rating", async () => {
    const res = await getItems({ rating: "6" });
    expect(res.status).toBe(400);
  });

  it("treats empty search as no filter", async () => {
    mockDb.where.mockReturnThis();
    mockDb.orderBy.mockResolvedValue([]);
    const res = await getItems({ search: "" });
    expect(res.status).toBe(200);
  });
});

describe("GET /api/library/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReset();
    authed();
    resetDb();
  });

  async function getItem(id: string) {
    const { GET } = await import("@/app/api/library/[id]/route");
    return GET(new NextRequest(`http://localhost/api/library/${id}`), {
      params: Promise.resolve({ id }),
    });
  }

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const res = await getItem("item-1");
    expect(res.status).toBe(401);
  });

  it("returns 404 when not found", async () => {
    mockDb.where.mockResolvedValueOnce([]);
    const res = await getItem("missing");
    expect(res.status).toBe(404);
  });

  it("returns item with decrypted content and notes array", async () => {
    mockDb.where
      .mockResolvedValueOnce([
        {
          id: "item-1",
          userId: "user-1",
          type: "book",
          title: "My Book",
          creator: "Author",
          url: null,
          status: "in_progress",
          rating: 4,
          reactions: ["interesting"],
          genres: ["fiction"],
          metadata: null,
          cover_image: null,
          encrypted_content: "cipher",
          iv: "iv",
          added_at: "2026-03-07T00:00:00.000Z",
          started_at: null,
          finished_at: null,
          created_at: "2026-03-07T00:00:00.000Z",
          updated_at: "2026-03-07T00:00:00.000Z",
        },
      ])
      .mockReturnThis();
    mockDb.orderBy.mockResolvedValueOnce([]);

    const res = await getItem("item-1");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.content).toBe("decrypted");
    expect(data.encrypted_content).toBeUndefined();
    expect(Array.isArray(data.notes)).toBe(true);
  });
});

describe("PUT /api/library/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReset();
    authed();
    resetDb();
  });

  async function putItem(id: string, body: Record<string, unknown>) {
    const { PUT } = await import("@/app/api/library/[id]/route");
    return PUT(
      new NextRequest(`http://localhost/api/library/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id }) },
    );
  }

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const res = await putItem("item-1", { title: "Updated" });
    expect(res.status).toBe(401);
  });

  it("returns 404 when not found", async () => {
    mockDb.where.mockResolvedValueOnce({ rowsAffected: 0 });
    const res = await putItem("missing", { title: "Updated" });
    expect(res.status).toBe(404);
  });

  it("returns 200 on success", async () => {
    mockDb.where.mockResolvedValueOnce({ rowsAffected: 1 });
    const res = await putItem("item-1", { title: "Updated" });
    expect(res.status).toBe(200);
  });

  it("encrypts content when provided", async () => {
    mockDb.where.mockResolvedValueOnce({ rowsAffected: 1 });
    await putItem("item-1", { content: "new content" });
    expect(mockServerCrypto.encryptServerText).toHaveBeenCalledWith("new content");
  });
});

describe("DELETE /api/library/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReset();
    authed();
    resetDb();
  });

  async function deleteItem(id: string) {
    const { DELETE } = await import("@/app/api/library/[id]/route");
    return DELETE(new NextRequest(`http://localhost/api/library/${id}`, { method: "DELETE" }), {
      params: Promise.resolve({ id }),
    });
  }

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const res = await deleteItem("item-1");
    expect(res.status).toBe(401);
  });

  it("returns 404 when not found", async () => {
    const res = await deleteItem("missing");
    expect(res.status).toBe(404);
  });

  it("returns 204 on success", async () => {
    mockDb.where
      .mockResolvedValueOnce([
        { id: "item-1", cover_image: null, userId: "user-1", type: "book", title: "Book", status: "backlog", encrypted_content: null, iv: null, created_at: "", updated_at: "" },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({ rowsAffected: 1 });

    const res = await deleteItem("item-1");
    expect(res.status).toBe(204);
  });
});

describe("POST /api/library/[id]/notes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReset();
    authed();
    resetDb();
  });

  async function postNote(itemId: string, body: Record<string, unknown>) {
    const { POST } = await import("@/app/api/library/[id]/notes/route");
    return POST(
      new NextRequest(`http://localhost/api/library/${itemId}/notes`, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: itemId }) },
    );
  }

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const res = await postNote("item-1", { content: "thought" });
    expect(res.status).toBe(401);
  });

  it("returns 404 when parent item not found", async () => {
    mockDb.where.mockResolvedValueOnce([]);
    const res = await postNote("missing", { content: "thought" });
    expect(res.status).toBe(404);
  });

  it("returns 201 with id when parent item exists", async () => {
    mockDb.where.mockResolvedValueOnce([{ id: "item-1" }]);
    const res = await postNote("item-1", { content: "thought content" });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(typeof data.id).toBe("string");
  });

  it("returns 400 when content is missing", async () => {
    mockDb.where.mockResolvedValueOnce([{ id: "item-1" }]);
    const res = await postNote("item-1", {});
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/library/[id]/notes/[noteId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReset();
    authed();
    resetDb();
  });

  async function deleteNote(itemId: string, noteId: string) {
    const { DELETE } = await import("@/app/api/library/[id]/notes/[noteId]/route");
    return DELETE(
      new NextRequest(`http://localhost/api/library/${itemId}/notes/${noteId}`, { method: "DELETE" }),
      { params: Promise.resolve({ id: itemId, noteId }) },
    );
  }

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const res = await deleteNote("item-1", "note-1");
    expect(res.status).toBe(401);
  });

  it("returns 404 when note not found", async () => {
    mockDb.where.mockResolvedValueOnce([]);
    const res = await deleteNote("item-1", "missing");
    expect(res.status).toBe(404);
  });

  it("returns 204 on success", async () => {
    mockDb.where
      .mockResolvedValueOnce([{ id: "note-1", images: null, userId: "user-1", mediaItemId: "item-1", encrypted_content: "c", iv: "iv", created_at: "", updated_at: "" }])
      .mockResolvedValueOnce({ rowsAffected: 1 });

    const res = await deleteNote("item-1", "note-1");
    expect(res.status).toBe(204);
  });
});
