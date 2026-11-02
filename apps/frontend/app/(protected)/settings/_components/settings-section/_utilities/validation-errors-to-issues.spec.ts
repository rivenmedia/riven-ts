import { describe, expect, it } from "vitest";

import { issuesToValidationErrors } from "./issues-to-validation-errors.ts";
import { validationErrorsToIssues } from "./validation-errors-to-issues.ts";

describe(validationErrorsToIssues, () => {
  it("flattens nested validation errors into dotted-path issues", () => {
    expect(
      validationErrorsToIssues({
        _errors: ["Section invalid"],
        scraping: {
          dubbedAnimeOnly: { _errors: ["a", "b"] },
          scrapeCooldownHours: { 1: { _errors: ["c"] } },
        },
      }),
    ).toStrictEqual([
      { path: "", message: "Section invalid" },
      { path: "scraping.dubbedAnimeOnly", message: "a" },
      { path: "scraping.dubbedAnimeOnly", message: "b" },
      { path: "scraping.scrapeCooldownHours.1", message: "c" },
    ]);
  });

  it("returns no issues for no validation errors", () => {
    expect(validationErrorsToIssues(undefined)).toStrictEqual([]);
  });

  it("reverses issuesToValidationErrors", () => {
    const issues = [
      { path: "apiKey", message: "Too short" },
      { path: "logging.logDirectory", message: "Not writable" },
    ];

    expect(
      validationErrorsToIssues(issuesToValidationErrors(issues)),
    ).toStrictEqual(issues);
  });
});
