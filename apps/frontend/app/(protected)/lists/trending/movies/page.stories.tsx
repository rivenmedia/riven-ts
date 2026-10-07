import preview from "@/.storybook/preview";

import { faker } from "@faker-js/faker";
import { graphql, HttpResponse } from "msw";

import { GET_DISCOVERY_ITEMS } from "../_components/trending-discovery-page/_components/trending-discovery-item-list";
import TrendingMoviesPage from "./page";

import type { UUID } from "node:crypto";

const meta = preview.meta({
  title: "Pages / Trending / Movies",
  component: TrendingMoviesPage,
  beforeEach({ msw }) {
    msw.use(
      graphql.query(GET_DISCOVERY_ITEMS, () =>
        HttpResponse.json({
          data: {
            discoveryItems: Array.from({ length: 50 }).map(() => ({
              __typename: "TmdbIndexerData",
              id: faker.string.uuid() as UUID,
              posterUrl: faker.image.urlPicsumPhotos({
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
  parameters: {
    snapshot: {
      fullPage: false,
    },
  },
});

export const Default = meta.story();
