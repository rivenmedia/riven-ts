import { faker } from "@faker-js/faker";
import { HttpResponse } from "msw";

import preview from "#.storybook/preview.tsx";
import { api } from "#mocks/graphql.ts";

import { GET_FILTERED_TMDB_TRENDING_SHOWS } from "./_queries/get-tmdb-trending-shows.query.ts";
import TrendingShowsPage from "./page.tsx";

import type { UUID } from "node:crypto";

const meta = preview.meta({
  title: "Pages / Trending / Shows",
  component: TrendingShowsPage,
  beforeEach({ msw }) {
    msw.use(
      api.query(GET_FILTERED_TMDB_TRENDING_SHOWS, () =>
        HttpResponse.json({
          data: {
            tmdbTrendingShows: Array.from({ length: 50 }).map(() => ({
              __typename: "TmdbIndexerData",
              id: faker.string.uuid() as UUID,
              posterUrl: faker.image.urlPicsumPhotos({
                width: 200,
                height: 300,
              }),
              title: faker.lorem.words(3),
              type: "show",
              year: faker.date.past({ years: 10 }).getFullYear(),
              releaseDate: faker.date.past({ years: 10 }).toISOString(),
              overview: faker.lorem.paragraph(),
              isRequestable: true,
            })),
          },
        }),
      ),
    );
  },
  parameters: {
    snapshot: {
      fullPage: false,
    },
  },
});

export const Default = meta.story();
