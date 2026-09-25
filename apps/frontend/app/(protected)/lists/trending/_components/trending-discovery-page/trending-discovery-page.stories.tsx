import { preview } from "@/.storybook/preview";

import { faker } from "@faker-js/faker";
import { graphql, HttpResponse } from "msw";

import { GET_DISCOVERY_ITEMS } from "./_components/trending-discovery-item-list";
import { TrendingDiscoveryPage } from "./trending-discovery-page";

import type { UUID } from "node:crypto";

const meta = preview.meta({
  title: "Pages / Trending / Components / TrendingDiscoveryPage",
  component: TrendingDiscoveryPage,
  parameters: {
    layout: "fullscreen",
  },
});

export const Movies = meta.story({
  args: {
    emptyMessage: "No movies found",
    mediaType: "movie" as const,
    title: "Trending Movies",
  },
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

export const Shows = meta.story({
  args: {
    emptyMessage: "No shows found",
    mediaType: "show" as const,
    title: "Trending Shows",
  },
  beforeEach({ msw }) {
    msw.use(
      graphql.query(GET_DISCOVERY_ITEMS, () =>
        HttpResponse.json({
          data: {
            discoveryItems: Array.from({ length: 50 }).map(() => ({
              id: faker.string.uuid() as UUID,
              posterPath: faker.image.urlPicsumPhotos({
                height: 300,
                width: 200,
              }),
              title: faker.lorem.words(3),
              type: "show",
              year: faker.date.past({ years: 10 }).getFullYear(),
            })),
          },
        }),
      ),
    );
  },
});
