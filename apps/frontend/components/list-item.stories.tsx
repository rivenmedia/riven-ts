import preview from "@/.storybook/preview";

import { faker } from "@faker-js/faker";

import { ListItem } from "./list-item";

const meta = preview.meta({
  title: "Components / List Item",
  component: ListItem,
  render: (args) => (
    <div className="w-96">
      <ListItem {...args} />
    </div>
  ),
});

export const Default = meta.story({
  args: {
    mediaItem: {
      id: "1",
      title: "The Matrix",
      posterPath: faker.image.url(),
      type: "movie",
      year: 1999,
    },
    indexer: "tmdb",
  },
});

export const WithBadge = meta.story({
  args: {
    mediaItem: {
      id: "1",
      title: "The Matrix",
      posterPath: faker.image.url(),
      type: "movie",
      year: 1999,
    },
    indexer: "tmdb",
    badge: {
      text: "New",
      variant: "success",
    },
  },
});

export const Selectable = meta.story({
  args: {
    mediaItem: {
      id: "1",
      title: "The Matrix",
      posterPath: faker.image.url(),
      type: "movie",
      year: 1999,
    },
    isSelectable: true,
  },
});
