import { expect } from "storybook/test";

import preview from "#.storybook/preview.tsx";
import { api } from "#mocks/graphql.ts";

import { ON_SEASON_UPDATED } from "../../_subscriptions/on-season-updated.subscription.ts";
import { LiveSeasonCard } from "./season-card.client.tsx";

const meta = preview.meta({
  title: "Components / LiveSeasonCard",
  component: LiveSeasonCard,
  args: {
    id: crypto.randomUUID(),
    title: "Season 1",
    posterUrl:
      "https://artworks.thetvdb.com/banners/v4/season/830385/posters/6187fabf54442.jpg",
    episodeCount: 9,
    initialSeason: {
      isRequested: true,
      state: "partially_completed" as const,
      completedEpisodeCount: 3,
    },
  },
  beforeEach({ msw }) {
    msw.use(
      api.subscription(ON_SEASON_UPDATED, () => {
        // The season doesn't change
      }),
    );
  },
});

export const Default = meta.story();

Default.test(
  "Shows the season's state and completed episodes",
  async ({ canvas }) => {
    await expect(
      await canvas.findByRole("status", { name: "Partially Completed" }),
    ).toBeInTheDocument();
    await expect(canvas.getByText("3/9")).toBeInTheDocument();
  },
);

export const Unrequested = meta.story({
  args: {
    initialSeason: {
      isRequested: false,
      state: "indexed" as const,
      completedEpisodeCount: 0,
    },
  },
});

Unrequested.test("Shows the season as unrequested", async ({ canvas }) => {
  await expect(
    await canvas.findByRole("status", { name: "Unrequested" }),
  ).toBeInTheDocument();
});

export const StateChanged = meta.story({
  beforeEach({ args, msw }) {
    msw.use(
      api.subscription(ON_SEASON_UPDATED, ({ subscription }) => {
        if (subscription.variables.id !== args.id) {
          subscription.error([
            { message: `Invalid id parameter: ${subscription.variables.id}` },
          ]);

          return;
        }

        subscription.publish({
          data: {
            seasonUpdated: {
              __typename: "Season",
              state: "completed",
              completedEpisodeCount: 9,
            },
          },
        });
      }),
    );
  },
});

StateChanged.test(
  "Shows the latest state and completed episodes from the subscription",
  async ({ canvas }) => {
    await expect(
      await canvas.findByRole("status", { name: "Completed" }),
    ).toBeInTheDocument();
    await expect(await canvas.findByText("9/9")).toBeInTheDocument();
  },
);
