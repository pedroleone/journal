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

describe("POST /api/notes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReset();
    authed();
    resetDb();
  });

  async function postNote(body: Record<string, unknown>) {
    const { POST } = await import("@/app/api/notes/route");
    return POST(
      new NextRequest("http://localhost/api/notes", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      }),
    );
  }

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const res = await postNote({ content: "hello" });
    expect(res.status).toBe(401);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("returns 201 with id on valid input", async () => {
    const res = await postNote({ content: "My note" });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(typeof data.id).toBe("string");
  });

  it("returns 201 with title and tags", async () => {
    const res = await postNote({ title: "My Title", content: "Content", tags: ["work"] });
    expect(res.status).toBe(201);
    expect(mockDb.values).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1", encrypted_content: "mock-ct", iv: "mock-iv" }),
    );
  });

  it("returns 400 when content is missing", async () => {
    const res = await postNote({ title: "No content" });
    expect(res.status).toBe(400);
  });

  it("encrypts content before inserting", async () => {
    await postNote({ content: "Secret note" });
    expect(mockServerCrypto.encryptServerText).toHaveBeenCalledWith("Secret note");
  });
});

describe("GET /api/notes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReset();
    authed();
    resetDb();
  });

  async function getNotes(params: Record<string, string> = {}) {
    const { GET } = await import("@/app/api/notes/route");
    const url = new URL("http://localhost/api/notes");
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    return GET(new NextRequest(url));
  }

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const res = await getNotes();
    expect(res.status).toBe(401);
  });

  it("returns 200 with array", async () => {
    mockDb.where.mockReturnThis();
    mockDb.orderBy.mockResolvedValue([
      { id: "n1", title: "Note 1", tags: null, images: null, created_at: "2026-03-07T00:00:00.000Z", updated_at: "2026-03-07T00:00:00.000Z" },
    ]);
    const res = await getNotes();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data[0].id).toBe("n1");
  });

  it("passes tag filter in query", async () => {
    mockDb.where.mockReturnThis();
    mockDb.orderBy.mockResolvedValue([]);
    const res = await getNotes({ tag: "work" });
    expect(res.status).toBe(200);
  });
});

describe("GET /api/notes/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReset();
    authed();
    resetDb();
  });

  async function getNote(id: string) {
    const { GET } = await import("@/app/api/notes/[id]/route");
    return GET(new NextRequest(`http://localhost/api/notes/${id}`), {
      params: Promise.resolve({ id }),
    });
  }

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const res = await getNote("note-1");
    expect(res.status).toBe(401);
  });

  it("returns 404 when note not found", async () => {
    mockDb.where.mockResolvedValueOnce([]);
    const res = await getNote("missing");
    expect(res.status).toBe(404);
  });

  it("returns note with decrypted content and subnotes", async () => {
    mockDb.where
      .mockResolvedValueOnce([
        {
          id: "note-1",
          userId: "user-1",
          title: "My Note",
          tags: ["work"],
          images: null,
          encrypted_content: "cipher",
          iv: "iv",
          created_at: "2026-03-07T00:00:00.000Z",
          updated_at: "2026-03-07T00:00:00.000Z",
        },
      ])
      .mockReturnThis();
    mockDb.orderBy.mockResolvedValueOnce([]);

    const res = await getNote("note-1");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.content).toBe("decrypted");
    expect(data.encrypted_content).toBeUndefined();
    expect(Array.isArray(data.subnotes)).toBe(true);
  });
});

describe("PUT /api/notes/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReset();
    authed();
    resetDb();
  });

  async function putNote(id: string, body: Record<string, unknown>) {
    const { PUT } = await import("@/app/api/notes/[id]/route");
    return PUT(
      new NextRequest(`http://localhost/api/notes/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id }) },
    );
  }

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const res = await putNote("note-1", { content: "updated" });
    expect(res.status).toBe(401);
  });

  it("returns 404 when note not found", async () => {
    mockDb.where.mockResolvedValueOnce({ rowsAffected: 0 });
    const res = await putNote("missing", { content: "updated" });
    expect(res.status).toBe(404);
  });

  it("returns 200 on success", async () => {
    mockDb.where.mockResolvedValueOnce({ rowsAffected: 1 });
    const res = await putNote("note-1", { content: "updated" });
    expect(res.status).toBe(200);
  });

  it("encrypts content when provided", async () => {
    mockDb.where.mockResolvedValueOnce({ rowsAffected: 1 });
    await putNote("note-1", { content: "updated" });
    expect(mockServerCrypto.encryptServerText).toHaveBeenCalledWith("updated");
  });
});

describe("DELETE /api/notes/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReset();
    authed();
    resetDb();
  });

  async function deleteNote(id: string) {
    const { DELETE } = await import("@/app/api/notes/[id]/route");
    return DELETE(new NextRequest(`http://localhost/api/notes/${id}`, { method: "DELETE" }), {
      params: Promise.resolve({ id }),
    });
  }

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const res = await deleteNote("note-1");
    expect(res.status).toBe(401);
  });

  it("returns 404 when note not found", async () => {
    const res = await deleteNote("missing");
    expect(res.status).toBe(404);
  });

  it("returns 204 on success", async () => {
    // select note → found; select subnotes → none; delete → 1 row
    mockDb.where
      .mockResolvedValueOnce([
        { id: "note-1", images: null, userId: "user-1", title: null, tags: null, encrypted_content: "c", iv: "iv", created_at: "", updated_at: "" },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({ rowsAffected: 1 });

    const res = await deleteNote("note-1");
    expect(res.status).toBe(204);
  });
});

describe("POST /api/notes/[id]/subnotes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReset();
    authed();
    resetDb();
  });

  async function postSubnote(noteId: string, body: Record<string, unknown>) {
    const { POST } = await import("@/app/api/notes/[id]/subnotes/route");
    return POST(
      new NextRequest(`http://localhost/api/notes/${noteId}/subnotes`, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: noteId }) },
    );
  }

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const res = await postSubnote("note-1", { content: "sub" });
    expect(res.status).toBe(401);
  });

  it("returns 404 when parent note not found", async () => {
    mockDb.where.mockResolvedValueOnce([]);
    const res = await postSubnote("missing", { content: "sub" });
    expect(res.status).toBe(404);
  });

  it("returns 201 with id when parent note exists", async () => {
    mockDb.where.mockResolvedValueOnce([{ id: "note-1" }]);
    const res = await postSubnote("note-1", { content: "subnote content" });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(typeof data.id).toBe("string");
  });

  it("returns 400 when content is missing", async () => {
    mockDb.where.mockResolvedValueOnce([{ id: "note-1" }]);
    const res = await postSubnote("note-1", {});
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/notes/[id]/subnotes/[subnoteId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReset();
    authed();
    resetDb();
  });

  async function deleteSubnote(noteId: string, subnoteId: string) {
    const { DELETE } = await import("@/app/api/notes/[id]/subnotes/[subnoteId]/route");
    return DELETE(
      new NextRequest(`http://localhost/api/notes/${noteId}/subnotes/${subnoteId}`, { method: "DELETE" }),
      { params: Promise.resolve({ id: noteId, subnoteId }) },
    );
  }

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const res = await deleteSubnote("note-1", "sub-1");
    expect(res.status).toBe(401);
  });

  it("returns 404 when subnote not found", async () => {
    mockDb.where.mockResolvedValueOnce([]);
    const res = await deleteSubnote("note-1", "missing");
    expect(res.status).toBe(404);
  });

  it("returns 204 on success", async () => {
    mockDb.where
      .mockResolvedValueOnce([{ id: "sub-1", images: null, userId: "user-1", noteId: "note-1", encrypted_content: "c", iv: "iv", created_at: "", updated_at: "" }])
      .mockResolvedValueOnce({ rowsAffected: 1 });

    const res = await deleteSubnote("note-1", "sub-1");
    expect(res.status).toBe(204);
  });
});
