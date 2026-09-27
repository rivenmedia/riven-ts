import preview from "@/.storybook/preview";

import { faker } from "@faker-js/faker";
import { graphql, HttpResponse } from "msw";

import TrendingMoviesPage from "./page";

import type { UUID } from "node:crypto";

const meta = preview.meta({
  title: "Pages / Trending / Movies",
  component: TrendingMoviesPage,
  beforeEach({ msw }) {
    msw.use(
      graphql.query("GetDiscoveryItems", () =>
        HttpResponse.json({
          data: {
            discoveryItems: Array.from({ length: 50 }).map(() => ({
              id: faker.string.uuid() as UUID,
              posterPath: faker.image.urlPicsumPhotos({
                width: 200,
                height: 300,
              }),
              title: faker.lorem.words(3),
              type: "movie",
              year: faker.date.past({ years: 10 }).getFullYear(),
            })),
          },
        }),
      ),
    );
  },
});

export const Default = meta.story();
