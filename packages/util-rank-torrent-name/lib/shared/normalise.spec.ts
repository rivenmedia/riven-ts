import { describe, expect, it } from "vitest";

import { normaliseTitle } from "./normalise.ts";

describe("normaliseTitle", () => {
  it("lowercases by default", () => {
    expect(normaliseTitle("The Matrix")).toBe("the matrix");
  });

  it("does not lowercase when disabled", () => {
    expect(normaliseTitle("The Matrix", false)).toBe("The Matrix");
  });

  it("converts accented characters", () => {
    expect(normaliseTitle("café")).toBe("cafe");
    expect(normaliseTitle("naïve")).toBe("naive");
    expect(normaliseTitle("über")).toBe("uber");
  });

  it("handles special character mappings", () => {
    expect(normaliseTitle("Rock & Roll")).toBe("rock and roll");
    expect(normaliseTitle("Hello_World")).toBe("hello world");
    expect(normaliseTitle("Mr. Robot")).toBe("mr robot");
  });

  it("strips punctuation", () => {
    expect(normaliseTitle("What's Up?")).toBe("whats up");
    expect(normaliseTitle("Yes! No?")).toBe("yes no");
    expect(normaliseTitle("A: B; C")).toBe("a b c");
  });

  it("handles empty string", () => {
    expect(normaliseTitle("")).toBe("");
  });

  it("normalises unicode (NFKC)", () => {
    // fullwidth characters should be normalised
    expect(normaliseTitle("Ｈｅｌｌｏ")).toBe("hello");
  });

  it("collapses multiple spaces", () => {
    expect(normaliseTitle("The   Matrix")).toBe("the matrix");
  });
});
