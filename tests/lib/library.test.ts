import { describe, it, expect } from "vitest";
import { computeStatusTimestamps } from "@/lib/library";

const NOW = "2026-03-17T12:00:00.000Z";
const EARLIER = "2026-03-10T08:00:00.000Z";

describe("computeStatusTimestamps", () => {
  it("sets started_at when transitioning to in_progress with no prior started_at", () => {
    const result = computeStatusTimestamps("in_progress", { started_at: null, finished_at: null }, NOW);
    expect(result).toEqual({ started_at: NOW });
  });

  it("does not override existing started_at when transitioning to in_progress", () => {
    const result = computeStatusTimestamps("in_progress", { started_at: EARLIER, finished_at: null }, NOW);
    expect(result).toEqual({});
  });

  it("sets both started_at and finished_at when finishing with no prior started_at", () => {
    const result = computeStatusTimestamps("finished", { started_at: null, finished_at: null }, NOW);
    expect(result).toEqual({ started_at: NOW, finished_at: NOW });
  });

  it("sets finished_at but not started_at when finishing with existing started_at", () => {
    const result = computeStatusTimestamps("finished", { started_at: EARLIER, finished_at: null }, NOW);
    expect(result).toEqual({ finished_at: NOW });
  });

  it("always overwrites finished_at when finishing even if it already exists", () => {
    const result = computeStatusTimestamps("finished", { started_at: EARLIER, finished_at: EARLIER }, NOW);
    expect(result).toEqual({ finished_at: NOW });
  });

  it("returns empty object for backlog status", () => {
    const result = computeStatusTimestamps("backlog", { started_at: EARLIER, finished_at: EARLIER }, NOW);
    expect(result).toEqual({});
  });

  it("returns empty object for dropped status", () => {
    const result = computeStatusTimestamps("dropped", { started_at: EARLIER, finished_at: EARLIER }, NOW);
    expect(result).toEqual({});
  });

  it("uses current time when now is not provided", () => {
    const before = new Date().toISOString();
    const result = computeStatusTimestamps("in_progress", { started_at: null, finished_at: null });
    const after = new Date().toISOString();
    expect(result.started_at).toBeDefined();
    expect(result.started_at! >= before).toBe(true);
    expect(result.started_at! <= after).toBe(true);
  });
});
