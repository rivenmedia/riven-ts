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
        id: self.crypto.randomUUID() as UUID,
        title: "The Matrix",
        posterPath: "https://picsum.photos/200/300?cache=1",
      },
      {
        __typename: "Movie",
        id: self.crypto.randomUUID() as UUID,
        title: "The Matrix Reloaded",
        posterPath: "https://picsum.photos/200/300?cache=2",
      },
      {
        __typename: "Movie",
        id: self.crypto.randomUUID() as UUID,
        title: "The Matrix Revolutions",
        posterPath: "https://picsum.photos/200/300?cache=3",
      },
      {
        __typename: "Movie",
        id: self.crypto.randomUUID() as UUID,
        title: "The Matrix Resurrections",
        posterPath: "https://picsum.photos/200/300?cache=4",
      },
      {
        __typename: "Movie",
        id: self.crypto.randomUUID() as UUID,
        title: "The Matrix Revisited",
        posterPath: "https://picsum.photos/200/300?cache=5",
      },
      {
        __typename: "Movie",
        id: self.crypto.randomUUID() as UUID,
        title: "The Matrix Revisited",
        posterPath: "https://picsum.photos/200/300?cache=6",
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
