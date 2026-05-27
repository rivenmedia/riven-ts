import { describe, expect, it } from "vitest";

import { NewznabSettings } from "../newznab-settings.schema.ts";

describe("NewznabSettings", () => {
  it("accepts a valid minimal configuration (only required fields)", () => {
    const result = NewznabSettings.safeParse({
      indexerUrl: "https://indexer.example.com",
      apiKey: "my-key",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.minSizeBytes).toBe(100 * 1024 * 1024);
      expect(result.data.maxSizeBytes).toBe(100 * 1024 * 1024 * 1024);
      expect(result.data.movieCategories).toEqual([2040, 2045]);
      expect(result.data.tvCategories).toEqual([5040, 5045]);
    }
  });

  it("accepts a fully specified configuration", () => {
    const result = NewznabSettings.safeParse({
      indexerUrl: "https://my-indexer.com/",
      apiKey: "abc123",
      minSizeBytes: 50 * 1024 * 1024,
      maxSizeBytes: 20 * 1024 * 1024 * 1024,
      movieCategories: [2000, 2040],
      tvCategories: [5000, 5040],
    });

    expect(result.success).toBe(true);
  });

  it("rejects a non-URL indexerUrl", () => {
    const result = NewznabSettings.safeParse({
      indexerUrl: "not-a-url",
      apiKey: "key",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty apiKey", () => {
    const result = NewznabSettings.safeParse({
      indexerUrl: "https://indexer.example.com",
      apiKey: "",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a negative minSizeBytes", () => {
    const result = NewznabSettings.safeParse({
      indexerUrl: "https://indexer.example.com",
      apiKey: "key",
      minSizeBytes: -1,
    });

    expect(result.success).toBe(false);
  });

  it("rejects a float minSizeBytes", () => {
    const result = NewznabSettings.safeParse({
      indexerUrl: "https://indexer.example.com",
      apiKey: "key",
      minSizeBytes: 1.5,
    });

    expect(result.success).toBe(false);
  });

  it("accepts zero for minSizeBytes (no lower bound)", () => {
    const result = NewznabSettings.safeParse({
      indexerUrl: "https://indexer.example.com",
      apiKey: "key",
      minSizeBytes: 0,
    });

    expect(result.success).toBe(true);
  });

  it("rejects a missing indexerUrl", () => {
    const result = NewznabSettings.safeParse({
      apiKey: "key",
    });

    expect(result.success).toBe(false);
  });
});
