import preview from "@/.storybook/preview";

import { faker } from "@faker-js/faker";
import { ListChecks, Loader2, Trash } from "lucide-react";
import { fn } from "storybook/test";

import { CardSelectionProvider } from "../providers/card-selection-provider";
import { ListCarousel } from "./list-carousel";

const meta = preview.meta({
  title: "Components / ListCarousel",
  component: ListCarousel,
  parameters: {
    layout: "padded",
  },
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
        <div className="mx-12">
          <Story />
        </div>
      </CardSelectionProvider>
    ),
  ],
});

export const Default = meta.story({
  args: {
    itemsPromise: Promise.resolve(
      Array.from({ length: 10 }).map((_, i) => ({
        id: (i + 1).toString(),
        title: `Item ${(i + 1).toString()}`,
        posterPath: faker.image.url(),
        type: faker.helpers.arrayElement(["movie", "show"]),
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
    // oxlint-disable-next-line typescript/no-explicit-any
    itemsPromise: Promise.resolve<any>("invalid data"),
    indexer: "tmdb",
  },
});
