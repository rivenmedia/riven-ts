import { faker } from "@faker-js/faker";
import { ListChecks, Loader2, Trash } from "lucide-react";
import { expect, fn } from "storybook/test";

import preview from "#.storybook/preview.tsx";
import { CardSelectionProvider } from "#components/providers/card-selection-provider.tsx";

import { ListItem } from "./list-item.tsx";

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
      posterUrl: faker.image.url(),
      type: "movie",
      year: 1999,
    },
    indexer: "tmdb",
  },
});

export const WithBadge = Default.extend({
  args: {
    badge: {
      text: "New",
      variant: "success",
    },
  },
});

export const WithHref = Default.extend({
  args: {
    href: `/details/media/movie/1`,
  },
});

WithHref.test("Links to the correct page", async ({ args, canvas }) => {
  const link = await canvas.findByRole("link");

  await expect(link).toHaveAttribute("href", args.href);
});

export const Selectable = Default.extend({
  args: {
    isSelectable: true,
  },
});
