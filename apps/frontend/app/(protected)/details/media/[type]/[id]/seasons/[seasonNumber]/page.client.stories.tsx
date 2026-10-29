import { HttpResponse } from "msw";
import { expect, waitFor, within } from "storybook/test";

import preview from "#.storybook/preview.tsx";
import { GET_ITEM_SEASONS } from "#app/(protected)/details/media/[type]/[id]/_components/item-seasons/_queries/get-item-seasons.query.ts";
import { api } from "#mocks/graphql.ts";
import { createSeasonStateHandlers } from "#mocks/handlers/season-state.handler.ts";

import { SeasonDetailsPage } from "./page.client.tsx";
import { season, show } from "./season.fixtures.ts";

import type { MockedSeasonState } from "#mocks/handlers/season-state.handler.ts";

const meta = preview.meta({
  title: "Pages / SeasonDetails",
  component: SeasonDetailsPage,
  args: {
    show,
    season,
  },
  beforeEach({ msw }) {
    msw.use(
      ...createSeasonStateHandlers(null),
      api.query(GET_ITEM_SEASONS, () =>
        HttpResponse.json({
          data: {
            tmdbItem: {
              __typename: "TmdbIndexerData",
              id: show.id,
              type: show.type,
              seasons: [season],
            },
          },
        }),
      ),
    );
  },
});

export const Unrequested = meta.story();

Unrequested.test("Shows the season and its episodes", async ({ canvas }) => {
  await expect(
    canvas.getByRole("heading", { level: 1, name: "Season 1" }),
  ).toBeInTheDocument();

  await expect(canvas.getByText("9 episodes")).toBeInTheDocument();
  await expect(canvas.getByText(season.overview)).toBeInTheDocument();

  const episodeList = await canvas.findByRole("list");

  await expect(within(episodeList).getAllByRole("listitem")).toHaveLength(9);
});

Unrequested.test("Links back to the show", async ({ canvas }) => {
  await expect(canvas.getByRole("link", { name: "Arcane" })).toHaveAttribute(
    "href",
    "/details/media/show/371028",
  );
});

Unrequested.test("Links each episode to its page", async ({ canvas }) => {
  await expect(
    await canvas.findByRole("link", { name: /the boy savior/iu }),
  ).toHaveAttribute("href", "/details/media/show/371028/seasons/1/episodes/7");
});

Unrequested.test(
  "Shows the season and episodes as unrequested",
  async ({ canvas }) => {
    const episodeList = await canvas.findByRole("list");

    await expect(
      within(episodeList).getAllByLabelText(/unrequested/iu),
    ).toHaveLength(9);
  },
);

const createIndexedSeasonState = (): MockedSeasonState => ({
  id: crypto.randomUUID(),
  number: season.number,
  isRequested: true,
  state: "partially_completed",
  episodes: new Map(
    season.episodes.map(({ number }) => [
      number,
      {
        id: crypto.randomUUID(),
        isRequested: true,
        state: number <= 3 ? "completed" : "indexed",
      },
    ]),
  ),
});

export const Indexed = meta.story({
  beforeEach({ msw }) {
    msw.use(...createSeasonStateHandlers(createIndexedSeasonState()));
  },
});

Indexed.test("Shows each episode's state", async ({ canvas }) => {
  await expect(
    await canvas.findAllByRole("status", { name: /^completed$/iu }),
  ).toHaveLength(3);

  await expect(
    canvas.getAllByRole("status", { name: /^indexed$/iu }),
  ).toHaveLength(6);
});

Indexed.test("Shows the season's state", async ({ canvas }) => {
  await expect(
    await canvas.findByRole("status", { name: /partially completed/iu }),
  ).toBeInTheDocument();
});

export const EpisodeStateChanged = meta.story({
  beforeEach({ msw }) {
    msw.use(
      ...createSeasonStateHandlers(
        createIndexedSeasonState(),
        new Map([[4, "completed"]]),
      ),
    );
  },
});

EpisodeStateChanged.test(
  "Shows the latest episode states from the subscription",
  async ({ canvas }) => {
    await waitFor(async () => {
      await expect(
        canvas.getAllByRole("status", { name: /^completed$/iu }),
      ).toHaveLength(4);
    });
  },
);
