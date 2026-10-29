import { HttpResponse } from "msw";
import { expect, waitFor } from "storybook/test";

import preview from "#.storybook/preview.tsx";
import { GET_ITEM_SEASONS } from "#app/(protected)/details/media/[type]/[id]/_components/item-seasons/_queries/get-item-seasons.query.ts";
import { api } from "#mocks/graphql.ts";
import { createSeasonStateHandlers } from "#mocks/handlers/season-state.handler.ts";

import { cast, season, show } from "../../season.fixtures.ts";
import { GET_EPISODE_CAST } from "./_queries/get-episode-cast.query.ts";
import { EpisodeDetailsPage } from "./page.client.tsx";

import type { MockedSeasonState } from "#mocks/handlers/season-state.handler.ts";

function getEpisode(number: number) {
  const episode = season.episodes.find(
    (candidate) => candidate.number === number,
  );

  if (!episode) {
    throw new Error(`Episode ${String(number)} not found`);
  }

  return episode;
}

const meta = preview.meta({
  title: "Pages / EpisodeDetails",
  component: EpisodeDetailsPage,
  args: {
    show,
    episode: getEpisode(2),
    previousEpisode: getEpisode(1),
    nextEpisode: getEpisode(3),
  },
  beforeEach({ args, msw }) {
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
      api.query(GET_EPISODE_CAST, ({ variables }) =>
        HttpResponse.json({
          data: {
            tmdbItem: {
              __typename: "TmdbIndexerData",
              id: variables.id,
              type: "show",
              season: {
                __typename: "IndexerSeason",
                id: season.id,
                episode: {
                  __typename: "IndexerEpisode",
                  id: args.episode.id,
                  cast:
                    variables.episodeNumber === args.episode.number
                      ? cast
                      : null,
                },
              },
            },
          },
        }),
      ),
    );
  },
});

export const Unrequested = meta.story();

Unrequested.test("Shows the episode's details", async ({ canvas }) => {
  await expect(
    canvas.getByRole("heading", {
      level: 1,
      name: "Some Mysteries Are Better Left Unsolved",
    }),
  ).toBeInTheDocument();

  await expect(canvas.getByText("S01E02")).toBeInTheDocument();
  await expect(canvas.getByText("40m")).toBeInTheDocument();

  await expect(
    await canvas.findByLabelText(/unrequested/iu),
  ).toBeInTheDocument();
});

Unrequested.test("Shows the episode's cast", async ({ canvas }) => {
  await expect(await canvas.findByText("Ella Purnell")).toBeInTheDocument();
  await expect(canvas.getByText("Vi")).toBeInTheDocument();
});

Unrequested.test("Links back to the show and season", async ({ canvas }) => {
  await expect(canvas.getByRole("link", { name: "Arcane" })).toHaveAttribute(
    "href",
    "/details/media/show/371028",
  );

  await expect(canvas.getByRole("link", { name: "Season 1" })).toHaveAttribute(
    "href",
    "/details/media/show/371028/seasons/1",
  );
});

Unrequested.test(
  "Links to the previous and next episodes",
  async ({ canvas }) => {
    await expect(
      canvas.getByRole("link", { name: /welcome to the playground/iu }),
    ).toHaveAttribute(
      "href",
      "/details/media/show/371028/seasons/1/episodes/1",
    );

    await expect(
      canvas.getByRole("link", { name: /the base violence/iu }),
    ).toHaveAttribute(
      "href",
      "/details/media/show/371028/seasons/1/episodes/3",
    );
  },
);

export const FirstEpisode = meta.story({
  args: {
    episode: getEpisode(1),
    previousEpisode: null,
    nextEpisode: getEpisode(2),
  },
});

FirstEpisode.test("Only links to the next episode", async ({ canvas }) => {
  const navigation = canvas.getByRole("navigation", { name: "Episodes" });

  await expect(navigation.querySelectorAll("a")).toHaveLength(1);

  await expect(
    canvas.getByRole("link", { name: /some mysteries/iu }),
  ).toHaveAttribute("rel", "next");
});

const createIndexedSeasonState = (): MockedSeasonState => ({
  id: crypto.randomUUID(),
  number: season.number,
  isRequested: true,
  state: "indexed",
  episodes: new Map(
    season.episodes.map(({ number }) => [
      number,
      { id: crypto.randomUUID(), isRequested: true, state: "indexed" },
    ]),
  ),
});

export const Indexed = meta.story({
  beforeEach({ msw }) {
    msw.use(...createSeasonStateHandlers(createIndexedSeasonState()));
  },
});

Indexed.test("Shows the episode's state", async ({ canvas }) => {
  await expect(
    await canvas.findByRole("status", { name: /indexed/iu }),
  ).toBeInTheDocument();
});

export const StateChanged = meta.story({
  beforeEach({ msw }) {
    msw.use(
      ...createSeasonStateHandlers(
        createIndexedSeasonState(),
        new Map([[2, "completed"]]),
      ),
    );
  },
});

StateChanged.test(
  "Shows the latest state from the subscription",
  async ({ canvas }) => {
    await waitFor(async () => {
      await expect(
        canvas.getByRole("status", { name: /completed/iu }),
      ).toBeInTheDocument();
    });
  },
);
