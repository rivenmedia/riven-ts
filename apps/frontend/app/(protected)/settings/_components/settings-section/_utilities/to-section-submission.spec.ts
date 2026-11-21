import { describe, expect, it as baseIt } from "vitest";

import { toSectionSubmission } from "./to-section-submission.ts";

const it = baseIt.extend("clearableFields", () => [
  "scraping.maximumFailedAttempts",
  "scraping.minimumAverageBitrate",
  "logging.logDirectory",
]);

describe(toSectionSubmission, () => {
  it("resets an emptied field that had a value and leaves it out of the values", ({
    clearableFields,
  }) => {
    expect(
      toSectionSubmission(
        {
          scraping: { maximumFailedAttempts: undefined },
          logging: { logDirectory: "./logs" },
        },
        {
          scraping: { maximumFailedAttempts: 10 },
          logging: { logDirectory: "./logs" },
        },
        clearableFields,
      ),
    ).toStrictEqual({
      values: { scraping: {}, logging: { logDirectory: "./logs" } },
      reset: ["scraping.maximumFailedAttempts"],
    });
  });

  it("keeps an emptied nullable field in the values as null", ({
    clearableFields,
  }) => {
    expect(
      toSectionSubmission(
        { scraping: { maximumFailedAttempts: null } },
        { scraping: { maximumFailedAttempts: 10 } },
        clearableFields,
      ),
    ).toStrictEqual({
      values: { scraping: { maximumFailedAttempts: null } },
      reset: [],
    });
  });

  it("neither saves nor resets a field that had no value", ({
    clearableFields,
  }) => {
    // `undefined` isn't serialised, so the field isn't saved
    expect(
      toSectionSubmission(
        { scraping: { minimumAverageBitrate: undefined } },
        { scraping: { minimumAverageBitrate: undefined } },
        clearableFields,
      ),
    ).toStrictEqual({
      values: { scraping: { minimumAverageBitrate: undefined } },
      reset: [],
    });
  });

  it("never resets a field that can't be cleared, such as a secret", ({
    clearableFields,
  }) => {
    expect(
      toSectionSubmission(
        { apiKey: undefined },
        { apiKey: "" },
        clearableFields,
      ),
    ).toStrictEqual({ values: { apiKey: undefined }, reset: [] });
  });

  it("does not change the form's values", ({ clearableFields }) => {
    const formValues = { logging: { logDirectory: undefined } };

    toSectionSubmission(
      formValues,
      { logging: { logDirectory: "./logs" } },
      clearableFields,
    );

    expect(formValues).toStrictEqual({ logging: { logDirectory: undefined } });
  });
});
