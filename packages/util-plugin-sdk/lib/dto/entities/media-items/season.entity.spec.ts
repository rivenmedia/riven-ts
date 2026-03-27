import { expect } from "vitest";

import { it as baseIt } from "../../../__tests__/test-context.ts";
import { ItemRequest, Season, Show } from "../index.ts";

const test = baseIt
  .extend("itemRequest", ({ em }) => {
    return em.create(ItemRequest, {
      requestedBy: "@repo/plugin-test",
      state: "completed",
      type: "show",
    });
  })
  .extend("show", async ({ em, itemRequest }) => {
    const show = em.create(Show, {
      title: "Test Show",
      fullTitle: "Test Show",
      contentRating: "tv-14",
      status: "ended",
      tvdbId: "1",
      itemRequest,
      isRequested: true,
    });

    await em.flush();

    return show;
  });

test("isSpecial is true if the season number is 0", async ({
  em,
  show,
  itemRequest,
}) => {
  const season = em.create(Season, {
    title: "Test Season",
    fullTitle: "Test Show - Season 0",
    isRequested: true,
    number: 0,
    show,
    itemRequest,
  });

  await em.flush();

  expect(season.isSpecial).toBe(true);
});
