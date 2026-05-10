import { describe, expect, it } from "vitest";

import { RequestRange } from "./request-range.schema.ts";

describe("RequestRange", () => {
  it("rejects when start >= fileSize", () => {
    const result = RequestRange.safeParse({
      fileName: "test.mkv",
      start: 1000,
      end: 2000,
      fileSize: 500,
      chunkSize: 1024,
    });

    expect(result.success).toBe(false);
  });

  it("rejects when effectiveEnd < start", () => {
    const result = RequestRange.safeParse({
      fileName: "test.mkv",
      start: 100,
      end: 50,
      fileSize: 200,
      chunkSize: 1024,
    });

    expect(result.success).toBe(false);
  });

  it("accepts a valid range", () => {
    const result = RequestRange.safeParse({
      fileName: "test.mkv",
      start: 0,
      end: 999,
      fileSize: 10000,
      chunkSize: 1024,
    });

    expect(result.success).toBe(true);
  });
});
