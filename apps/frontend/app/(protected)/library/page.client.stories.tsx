import preview from "@/.storybook/preview";

import { LibraryPage } from "./page.client";

import type { MediaItem } from "@/app/_types/__generated__/graphql";

const meta = preview.meta({
  title: "Pages / Library",
  component: LibraryPage,
});

export const Default = meta.story({
  args: {
    totalItems: 2,
    items: [
      {
        id: "1",
        type: "movie",
        title: "John Wick: Chapter 4",
        year: 2023,
      },
      {
        id: "2",
        type: "series",
        title: "Arcane",
        year: 2024,
      },
    ] as MediaItem[],
  },
});

export const NoItems = meta.story({
  args: {
    totalItems: 0,
    items: [],
  },
});
