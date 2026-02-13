import { describe, expect, it } from "vitest";

import { normalizeTitle } from "./normalize.ts";

describe("normalizeTitle", () => {
  it("should lowercase by default", () => {
    expect(normalizeTitle("The Matrix")).toBe("the matrix");
  });

  it("should not lowercase when disabled", () => {
    expect(normalizeTitle("The Matrix", false)).toBe("The Matrix");
  });

  it("should convert accented characters", () => {
    expect(normalizeTitle("café")).toBe("cafe");
    expect(normalizeTitle("naïve")).toBe("naive");
    expect(normalizeTitle("über")).toBe("uber");
  });

  it("should handle special character mappings", () => {
    expect(normalizeTitle("Rock & Roll")).toBe("rock and roll");
    expect(normalizeTitle("Hello_World")).toBe("hello world");
    expect(normalizeTitle("Mr. Robot")).toBe("mr robot");
  });

  it("should strip punctuation", () => {
    expect(normalizeTitle("What's Up?")).toBe("whats up");
    expect(normalizeTitle("Yes! No?")).toBe("yes no");
    expect(normalizeTitle("A: B; C")).toBe("a b c");
  });

  it("should handle empty string", () => {
    expect(normalizeTitle("")).toBe("");
  });

  it("should normalize unicode (NFKC)", () => {
    // fullwidth characters should be normalized
    expect(normalizeTitle("Ｈｅｌｌｏ")).toBe("hello");
  });

  it("should collapse multiple spaces", () => {
    expect(normalizeTitle("The   Matrix")).toBe("the matrix");
  });
});
