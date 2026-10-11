import { faker } from "@faker-js/faker";
import { ListChecks, Loader2, Trash } from "lucide-react";
import { fn } from "storybook/test";

import preview from "#.storybook/preview.tsx";
import { CardSelectionProvider } from "#components/providers/card-selection-provider.tsx";

import { ListCarouselSkeleton } from "./list-carousel-skeleton.tsx";
import { ListCarouselSuspenseError } from "./list-carousel-suspense-error.tsx";
import { ListCarousel } from "./list-carousel.tsx";

const meta = preview.meta({
  title: "Components / ListCarousel",
  component: ListCarousel,
  subcomponents: {
    ListCarouselSkeleton,
    ListCarouselSuspenseError,
  },
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
    items: Array.from({ length: 10 }).map((_, i) => ({
      id: (i + 1).toString(),
      title: `Item ${(i + 1).toString()}`,
      posterUrl: faker.image.url(),
      type: faker.helpers.arrayElement(["movie", "show"]),
      year: 2021,
    })),
    indexer: "tmdb",
  },
});

export const Loading = meta.story({
  render: () => <ListCarouselSkeleton />,
});

export const FetchError = meta.story({
  render: () => (
    <ListCarouselSuspenseError
      error={new Error("Failed to load items")}
      resetErrorBoundary={fn()}
    />
  ),
});
