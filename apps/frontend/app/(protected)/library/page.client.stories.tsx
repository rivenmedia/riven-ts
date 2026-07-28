import { ProtectedLayoutWrapper } from "@/.storybook/decorators/protected-layout-wrapper";
import preview from "@/.storybook/preview";

import { LibraryPage } from "./page.client";

import type { UUID } from "node:crypto";

const meta = preview.meta({
  title: "Pages / Library",
  component: LibraryPage,
  tags: ["!autodocs"],
  args: {
    items: [],
    totalItems: 0,
  },
  argTypes: {
    items: {
      control: {
        disable: true,
      },
    },
  },
  parameters: {
    layout: "fullscreen",
    nextjs: {
      navigation: {
        pathname: "/library",
      },
    },
  },
  decorators: [ProtectedLayoutWrapper],
});

export const Default = meta.story({
  args: {
    items: [
      {
        __typename: "Movie",
        id: globalThis.crypto.randomUUID() as UUID,
        title: "The Matrix",
        posterPath: "https://picsum.photos/200/300?cache=1",
        type: "movie",
      },
      {
        __typename: "Movie",
        id: globalThis.crypto.randomUUID() as UUID,
        title: "The Matrix Reloaded",
        posterPath: "https://picsum.photos/200/300?cache=2",
        type: "movie",
      },
      {
        __typename: "Movie",
        id: globalThis.crypto.randomUUID() as UUID,
        title: "The Matrix Revolutions",
        posterPath: "https://picsum.photos/200/300?cache=3",
        type: "movie",
      },
      {
        __typename: "Movie",
        id: globalThis.crypto.randomUUID() as UUID,
        title: "The Matrix Resurrections",
        posterPath: "https://picsum.photos/200/300?cache=4",
        type: "movie",
      },
      {
        __typename: "Movie",
        id: globalThis.crypto.randomUUID() as UUID,
        title: "The Matrix Revisited",
        posterPath: "https://picsum.photos/200/300?cache=5",
        type: "movie",
      },
      {
        __typename: "Movie",
        id: globalThis.crypto.randomUUID() as UUID,
        title: "The Matrix Revisited",
        posterPath: "https://picsum.photos/200/300?cache=6",
        type: "movie",
      },
    ],
    totalItems: 6,
  },
});

export const NoItemsFound = meta.story({
  args: {
    items: [],
    totalItems: 10_000,
  },
});
