import { expect, it } from "vitest";

import { isSupportedExtension } from "./is-supported-extension.ts";

it("supports SRT subtitle files", () => {
  expect(
    isSupportedExtension(
      "/movies/Test Movie (2026) {tmdb-1}/Test Movie (2026) {tmdb-1}.en.srt",
    ),
  ).toBe(true);
});
