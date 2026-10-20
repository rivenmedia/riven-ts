import { faker } from "@faker-js/faker";
import { HttpResponse } from "msw";

import preview from "#.storybook/preview.tsx";
import { api } from "#mocks/graphql.ts";

import { GET_FILTERED_TMDB_TRENDING_MOVIES } from "./_queries/get-tmdb-trending-movies.query.ts";
import TrendingMoviesPage from "./page.tsx";

import type { UUID } from "node:crypto";

const meta = preview.meta({
  title: "Pages / Trending / Movies",
  component: TrendingMoviesPage,
  beforeEach({ msw }) {
    msw.use(
      api.query(GET_FILTERED_TMDB_TRENDING_MOVIES, () =>
        HttpResponse.json({
          data: {
            tmdbTrendingMovies: Array.from({ length: 50 }).map(() => ({
              __typename: "TmdbIndexerData",
              id: faker.string.uuid() as UUID,
              posterUrl: faker.image.urlPicsumPhotos({
                width: 200,
                height: 300,
              }),
              title: faker.lorem.words(3),
              type: "movie",
              year: faker.date.past({ years: 10 }).getFullYear(),
              overview: faker.lorem.paragraph(),
              releaseDate: faker.date.past({ years: 10 }).toISOString(),
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
