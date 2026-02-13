import { describe, expect, it } from "vitest";

import { normaliseTitle } from "./normalise.ts";

describe("normaliseTitle", () => {
  it("should lowercase by default", () => {
    expect(normaliseTitle("The Matrix")).toBe("the matrix");
  });

  it("should not lowercase when disabled", () => {
    expect(normaliseTitle("The Matrix", false)).toBe("The Matrix");
  });

  it("should convert accented characters", () => {
    expect(normaliseTitle("café")).toBe("cafe");
    expect(normaliseTitle("naïve")).toBe("naive");
    expect(normaliseTitle("über")).toBe("uber");
  });

  it("should handle special character mappings", () => {
    expect(normaliseTitle("Rock & Roll")).toBe("rock and roll");
    expect(normaliseTitle("Hello_World")).toBe("hello world");
    expect(normaliseTitle("Mr. Robot")).toBe("mr robot");
  });

  it("should strip punctuation", () => {
    expect(normaliseTitle("What's Up?")).toBe("whats up");
    expect(normaliseTitle("Yes! No?")).toBe("yes no");
    expect(normaliseTitle("A: B; C")).toBe("a b c");
  });

  it("should handle empty string", () => {
    expect(normaliseTitle("")).toBe("");
  });

  it("should normalise unicode (NFKC)", () => {
    // fullwidth characters should be normalized
    expect(normaliseTitle("Ｈｅｌｌｏ")).toBe("hello");
  });

  it("should collapse multiple spaces", () => {
    expect(normaliseTitle("The   Matrix")).toBe("the matrix");
  });
});
