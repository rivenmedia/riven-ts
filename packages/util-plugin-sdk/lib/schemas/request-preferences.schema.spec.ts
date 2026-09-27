import { describe, expect, it } from "vitest";

import { RequestPreferencesSchema } from "./request-preferences.schema.ts";

describe("the request preferences schema", () => {
  it("accepts preferences with only resolutions", () => {
    expect(
      RequestPreferencesSchema.safeParse({ resolutions: ["1080p"] }).success,
    ).toBe(true);
  });

  it("accepts preferences with only a language", () => {
    expect(RequestPreferencesSchema.safeParse({ language: "en" }).success).toBe(
      true,
    );
  });

  it("accepts preferences with both resolutions and a language", () => {
    expect(
      RequestPreferencesSchema.safeParse({
        resolutions: ["2160p", "1080p"],
        language: "ja",
      }).success,
    ).toBe(true);
  });

  it("rejects empty preferences", () => {
    expect(RequestPreferencesSchema.safeParse({}).success).toBe(false);
  });

  it("rejects resolutions that are not supported", () => {
    expect(
      RequestPreferencesSchema.safeParse({ resolutions: ["8k"] }).success,
    ).toBe(false);
  });

  it("rejects a language that is not an ISO 639-1 code", () => {
    expect(
      RequestPreferencesSchema.safeParse({ language: "eng" }).success,
    ).toBe(false);
  });
});
