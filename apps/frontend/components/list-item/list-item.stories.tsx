import preview from "@/.storybook/preview";

import { faker } from "@faker-js/faker";
import { ListChecks, Loader2, Trash } from "lucide-react";
import { fn } from "storybook/test";

import { CardSelectionProvider } from "../providers/card-selection-provider";
import { ListItem } from "./list-item";

const meta = preview.meta({
  title: "Components / List Item",
  component: ListItem,
  decorators: [
    (Story) => (
      <CardSelectionProvider
        actions={[
          {
            label: "Reset",
            icon: ListChecks,
            handleClick: fn(),
          },
          {
            label: "Retry",
            icon: Loader2,
            handleClick: fn(),
          },
          {
            label: "Remove",
            icon: Trash,
            variant: "destructive",
            handleClick: fn(),
          },
        ]}
      >
        <div className="w-48">
          <Story />
        </div>
      </CardSelectionProvider>
    ),
  ],
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
    indexer: "tmdb",
  },
});
