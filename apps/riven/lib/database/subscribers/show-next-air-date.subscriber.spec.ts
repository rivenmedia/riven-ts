import { DateTime } from "luxon";
import { expect } from "vitest";

import { it } from "../../__tests__/test-context.ts";

const indexedAt = DateTime.utc().toJSDate();

it("sets nextAirDate to the next unreleased episode's release date", async ({
  em,
  factories: { showFactory, seasonFactory, episodeFactory },
}) => {
  const show = await showFactory.createOne({
    title: "The Great Show",
    nextAirDate: null,
    indexedAt,
  });

  const season = await seasonFactory.createOne({
    show,
    itemRequest: show.itemRequest,
    number: 1,
    indexedAt,
  });

  const releaseDate = DateTime.utc().plus({ weeks: 1 }).toJSDate();

  const episode = await episodeFactory.createOne({
    season,
    show,
    itemRequest: show.itemRequest,
    number: 1,
    isSpecial: false,
    releaseDate,
    indexedAt,
  });

  show.episodes.add(episode);

  await em.upsert(show);

  expect(show.nextAirDate).toStrictEqual(releaseDate);
});

it("recalculates nextAirDate when the current value is in the past", async ({
  em,
  factories: { showFactory, seasonFactory, episodeFactory },
}) => {
  const show = await showFactory.createOne({
    title: "The Great Show",
    nextAirDate: DateTime.utc().minus({ weeks: 1 }).toJSDate(),
    indexedAt,
  });

  const season = await seasonFactory.createOne({
    show,
    itemRequest: show.itemRequest,
    number: 1,
    indexedAt,
  });

  const releaseDate = DateTime.utc().plus({ weeks: 2 }).toJSDate();

  const episode = await episodeFactory.createOne({
    season,
    show,
    itemRequest: show.itemRequest,
    number: 1,
    isSpecial: false,
    releaseDate,
    indexedAt,
  });

  show.episodes.add(episode);

  await em.upsert(show);

  expect(show.nextAirDate).toStrictEqual(releaseDate);
});

it("does not recalculate nextAirDate when it is already set to a future date", async ({
  em,
  factories: { showFactory, seasonFactory, episodeFactory },
}) => {
  const existingNextAirDate = DateTime.utc().plus({ weeks: 1 }).toJSDate();

  const show = await showFactory.createOne({
    title: "The Great Show",
    nextAirDate: existingNextAirDate,
    indexedAt,
  });

  const season = await seasonFactory.createOne({
    show,
    itemRequest: show.itemRequest,
    number: 1,
    indexedAt,
  });

  const episode = await episodeFactory.createOne({
    season,
    show,
    itemRequest: show.itemRequest,
    number: 1,
    isSpecial: false,
    releaseDate: DateTime.utc().plus({ weeks: 3 }).toJSDate(),
    indexedAt,
  });

  show.episodes.add(episode);

  await em.upsert(show);

  expect(show.nextAirDate).toStrictEqual(existingNextAirDate);
});

it("sets nextAirDate to null when the show has episodes but none are upcoming", async ({
  em,
  factories: { showFactory, seasonFactory, episodeFactory },
}) => {
  const show = await showFactory.createOne({
    title: "The Great Show",
    nextAirDate: DateTime.utc().minus({ weeks: 1 }).toJSDate(),
    indexedAt,
  });

  const season = await seasonFactory.createOne({
    show,
    itemRequest: show.itemRequest,
    number: 1,
    indexedAt,
  });

  const episode = await episodeFactory.createOne({
    season,
    show,
    itemRequest: show.itemRequest,
    number: 1,
    isSpecial: false,
    releaseDate: DateTime.utc().minus({ weeks: 2 }).toJSDate(),
    indexedAt,
  });

  show.episodes.add(episode);

  await em.upsert(show);

  expect(show.nextAirDate).toBeNull();
});

it("does not set nextAirDate when the show has no episodes", async ({
  em,
  factories: { showFactory },
}) => {
  const show = await showFactory.createOne({
    title: "The Great Show",
    nextAirDate: null,
    indexedAt,
  });

  await em.upsert(show);

  expect(show.nextAirDate).toBeNull();
});
