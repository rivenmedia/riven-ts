import { ProtectedLayoutWrapper } from "@/.storybook/decorators/protected-layout-wrapper";
import preview from "@/.storybook/preview";

import { LibraryPage } from "./page.client";

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
  },
  decorators: [ProtectedLayoutWrapper],
});

export const Default = meta.story({
  args: {
    items: [
      {
        id: self.crypto.randomUUID(),
        title: "The Matrix",
        posterPath: "https://picsum.photos/200/300?cache=1",
      },
      {
        id: self.crypto.randomUUID(),
        title: "The Matrix Reloaded",
        posterPath: "https://picsum.photos/200/300?cache=2",
      },
      {
        id: self.crypto.randomUUID(),
        title: "The Matrix Revolutions",
        posterPath: "https://picsum.photos/200/300?cache=3",
      },
      {
        id: self.crypto.randomUUID(),
        title: "The Matrix Resurrections",
        posterPath: "https://picsum.photos/200/300?cache=4",
      },
      {
        id: self.crypto.randomUUID(),
        title: "The Matrix Revisited",
        posterPath: "https://picsum.photos/200/300?cache=5",
      },
      {
        id: self.crypto.randomUUID(),
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
