import { faker } from "@faker-js/faker";

import preview from "@/.storybook/preview";

import { ListCarousel } from "./list-carousel";

const meta = preview.meta({
  title: "Components / Media / ListCarousel",
  component: ListCarousel,
  parameters: {
    layout: "padded",
  },
  render: (args) => (
    <div className="mx-12">
      <ListCarousel {...args} />
    </div>
  ),
});

export const Default = meta.story({
  args: {
    itemsPromise: Promise.resolve(
      Array.from({ length: 10 }).map((_, i) => ({
        id: (i + 1).toString(),
        title: `Item ${(i + 1).toString()}`,
        posterPath: faker.image.url(),
        type: "movie",
        year: 2021,
      })),
    ),
    indexer: "tmdb",
  },
});

export const Loading = meta.story({
  args: {
    itemsPromise: new Promise(() => {
      /* empty */
    }),
    indexer: "tmdb",
  },
});

export const FetchError = meta.story({
  args: {
    itemsPromise: Promise.reject(new Error("Failed to load items")),
    indexer: "tmdb",
  },
});
