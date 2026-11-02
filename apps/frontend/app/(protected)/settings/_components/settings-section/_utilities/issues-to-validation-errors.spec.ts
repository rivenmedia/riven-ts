import { describe, expect, it } from "vitest";

import { issuesToValidationErrors } from "./issues-to-validation-errors.ts";

describe(issuesToValidationErrors, () => {
  it("nests a dotted issue path into a validation errors object", () => {
    expect(
      issuesToValidationErrors([
        { path: "scraping.dubbedAnimeOnly", message: "m" },
      ]),
    ).toStrictEqual({ scraping: { dubbedAnimeOnly: { _errors: ["m"] } } });
  });

  it("collects every message for the same path", () => {
    expect(
      issuesToValidationErrors([
        { path: "apiKey", message: "Too short" },
        { path: "apiKey", message: "Invalid format" },
      ]),
    ).toStrictEqual({ apiKey: { _errors: ["Too short", "Invalid format"] } });
  });

  it("keeps sibling paths under the same parent", () => {
    expect(
      issuesToValidationErrors([
        { path: "scraping.dubbedAnimeOnly", message: "a" },
        { path: "scraping.scrapeCooldownHours.1", message: "b" },
      ]),
    ).toStrictEqual({
      scraping: {
        dubbedAnimeOnly: { _errors: ["a"] },
        scrapeCooldownHours: { 1: { _errors: ["b"] } },
      },
    });
  });

  it("puts an issue with an empty path on the root", () => {
    expect(
      issuesToValidationErrors([{ path: "", message: "Section invalid" }]),
    ).toStrictEqual({ _errors: ["Section invalid"] });
  });
});
