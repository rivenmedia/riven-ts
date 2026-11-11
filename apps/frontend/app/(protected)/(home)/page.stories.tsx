import { expect, within } from "storybook/test";

import { preview } from "#.storybook/preview.tsx";
import HomePage from "#app/(protected)/(home)/page.tsx";
import {
  createRecentlyAddedHandler,
  createTmdbNowPlayingHandler,
  createTmdbTrendingMoviesHandler,
  createTmdbTrendingShowsHandler,
} from "#mocks/handlers/home.handler.ts";

const meta = preview.meta({
  title: "Pages / Home",
  component: HomePage,
  parameters: {
    layout: "fullscreen",
  },
});

export const Default = meta.story({
  beforeEach({ msw }) {
    msw.use(
      createTmdbNowPlayingHandler(),
      createTmdbTrendingMoviesHandler(),
      createTmdbTrendingShowsHandler(),
      createRecentlyAddedHandler([]),
    );
  },
});

Default.test(
  'Loads the correct items when the Trending Movies "This week" button is clicked',
  async ({ canvas, userEvent, step }) => {
    await step("View weekly trending movies", async () => {
      const trendingMoviesActions = await canvas.findByRole("region", {
        name: /trending movies actions/iu,
      });

      const thisWeekButton = await within(trendingMoviesActions).findByRole(
        "button",
        {
          name: /this week/iu,
        },
      );

      await userEvent.click(thisWeekButton);
    });

    const weeklyTrendingMovie = await canvas.findByRole("heading", {
      name: /the odyssey/iu,
    });

    await expect(weeklyTrendingMovie).toBeInTheDocument();
  },
);

Default.test(
  'Navigates to the Trending Movies page when the Trending Movies "View all" button is clicked',
  async ({ canvas }) => {
    const trendingMoviesActions = await canvas.findByRole("region", {
      name: /trending movies actions/iu,
    });

    const viewAllButton = await within(trendingMoviesActions).findByRole(
      "link",
      { name: /view all/iu },
    );

    await expect(viewAllButton).toHaveAttribute(
      "href",
      "/lists/trending/movies",
    );
  },
);

Default.test(
  'Loads the correct items when the Trending Shows "This week" button is clicked',
  async ({ canvas, userEvent, step }) => {
    await step("View weekly trending shows", async () => {
      const trendingShowsActions = await canvas.findByRole("region", {
        name: /trending tv shows actions/iu,
      });

      const thisWeekButton = await within(trendingShowsActions).findByRole(
        "button",
        {
          name: /this week/iu,
        },
      );

      await userEvent.click(thisWeekButton);
    });

    const weeklyTrendingShow = await canvas.findByRole("heading", {
      name: /arcane/iu,
    });

    await expect(weeklyTrendingShow).toBeInTheDocument();
  },
);

Default.test(
  'Navigates to the Trending Shows page when the Trending Shows "View all" button is clicked',
  async ({ canvas }) => {
    const trendingShowsActions = await canvas.findByRole("region", {
      name: /trending tv shows actions/iu,
    });

    const viewAllButton = await within(trendingShowsActions).findByRole(
      "link",
      { name: /view all/iu },
    );

    await expect(viewAllButton).toHaveAttribute(
      "href",
      "/lists/trending/shows",
    );
  },
);

export const WithRecentlyAdded = Default.extend({
  beforeEach({ msw }) {
    msw.use(createRecentlyAddedHandler());
  },
});
