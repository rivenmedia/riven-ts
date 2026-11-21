import { expect, it } from "vitest";

import { formatSeasonTitle } from "./format-season-title.ts";

it.for([
  [0, "Specials"],
  [1, "Season 1"],
  [12, "Season 12"],
] as const)("titles season %i as %s", ([seasonNumber, title]) => {
  expect(formatSeasonTitle(seasonNumber)).toBe(title);
});
