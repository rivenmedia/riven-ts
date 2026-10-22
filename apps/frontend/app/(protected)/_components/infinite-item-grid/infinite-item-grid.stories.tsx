import { faker } from "@faker-js/faker";
import { expect, fn, userEvent, waitFor } from "storybook/test";

import { preview } from "#.storybook/preview.tsx";
import { InfiniteItemGrid } from "#app/(protected)/_components/infinite-item-grid/infinite-item-grid.tsx";
import { ItemGrid } from "#components/item-grid/item-grid.tsx";

import type { ListItem } from "#components/list-item/list-item.tsx";
import type { ComponentProps } from "react";

type MediaItem = ComponentProps<typeof ListItem>["mediaItem"];

const pageSize = 20;

function createPage(page: number) {
  return new Map<string, MediaItem>(
    Array.from({ length: pageSize }).map((_, index) => {
      const position = (page - 1) * pageSize + index + 1;
      const id = `movie-${String(position)}`;

      return [
        id,
        {
          id,
          title: `Result ${String(position)}`,
          posterUrl: faker.image.urlPicsumPhotos({ width: 200, height: 300 }),
          type: "movie",
          year: 2000 + index,
          isRequestable: true,
        },
      ];
    }),
  );
}

// Created up front so the random posters are consistent between runs
const firstPage = createPage(1);
const pages = [firstPage, createPage(2), createPage(3)];

const meta = preview.meta({
  title: "Components / InfiniteItemGrid",
  component: InfiniteItemGrid,
  decorators: [
    (Story) => (
      <ItemGrid>
        <Story />
      </ItemGrid>
    ),
  ],
  args: {
    initialData: firstPage,
    fetchPage: fn((page: number) =>
      Promise.resolve(pages[page - 1] ?? new Map()),
    ),
    noItemsFoundMessage: "No items found",
  },
  parameters: {
    snapshot: {
      // Scrolling the Load More button into view would fetch the next page mid-snapshot
      fullPage: false,
    },
  },
});

export const Default = meta.story();

Default.test("Renders the initial page of items", async ({ canvas }) => {
  await expect(await canvas.findAllByRole("link")).toHaveLength(pageSize);
  await expect(
    canvas.getByRole("link", { name: /Result 1\b/u }),
  ).toHaveAttribute("href", "/details/media/movie/movie-1");
  await expect(canvas.getByRole("button", { name: "Load More" })).toBeEnabled();
});

Default.test(
  "Clicking Load More appends the next page",
  async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Load More" }));

    await expect(
      await canvas.findByRole("link", { name: /Result 21\b/u }),
    ).toBeVisible();

    await expect(args.fetchPage).toHaveBeenCalledOnce();
    await expect(args.fetchPage).toHaveBeenCalledWith(2);

    await expect(canvas.getAllByRole("link")).toHaveLength(pageSize * 2);
    await expect(
      canvas.getByRole("button", { name: "Load More" }),
    ).toBeEnabled();
  },
);

Default.test(
  "Loads the next page when the Load More button scrolls into view",
  async ({ args, canvas }) => {
    canvas.getByRole("button", { name: "Load More" }).scrollIntoView();

    await waitFor(async () => {
      await expect(args.fetchPage).toHaveBeenCalledWith(2);
    });
    await expect(
      await canvas.findByRole("link", { name: /Result 21\b/u }),
    ).toBeInTheDocument();
  },
);

Default.test(
  "Requests successive pages on each load",
  async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Load More" }));
    await canvas.findByRole("link", { name: /Result 21\b/u });

    await userEvent.click(canvas.getByRole("button", { name: "Load More" }));
    await canvas.findByRole("link", { name: /Result 41\b/u });

    await expect(args.fetchPage).toHaveBeenNthCalledWith(1, 2);
    await expect(args.fetchPage).toHaveBeenNthCalledWith(2, 3);
  },
);

export const FetchingMore = meta.story({
  args: {
    // Never resolves, to hold the grid in its loading state
    fetchPage: fn(
      (_page: number) =>
        new Promise<Map<string, MediaItem>>(() => {
          /* never resolves */
        }),
    ),
  },
  async play({ canvas }) {
    await userEvent.click(canvas.getByRole("button", { name: "Load More" }));
  },
});

FetchingMore.test(
  "Disables the button and shows a spinner while fetching",
  async ({ canvas }) => {
    const button = await canvas.findByRole("button", { name: "Loading" });

    await expect(button).toBeDisabled();
    await expect(canvas.getByRole("status", { name: "Loading" })).toBeVisible();
    await expect(canvas.getAllByRole("link")).toHaveLength(pageSize);
  },
);

export const NoMoreResults = meta.story({
  args: {
    fetchPage: fn((_page: number) =>
      Promise.resolve(new Map<string, MediaItem>()),
    ),
  },
});

NoMoreResults.test(
  "Hides the Load More button once a page adds no new items",
  async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Load More" }));

    await waitFor(async () => {
      await expect(
        canvas.queryByRole("button", { name: /Load More|Loading/u }),
      ).not.toBeInTheDocument();
    });

    await expect(args.fetchPage).toHaveBeenCalledOnce();
    await expect(args.fetchPage).toHaveBeenCalledWith(2);
    await expect(canvas.getAllByRole("link")).toHaveLength(pageSize);
  },
);

NoMoreResults.test(
  "Treats a page of already-loaded items as the end of the results",
  {
    args: {
      fetchPage: fn((_page: number) => Promise.resolve(firstPage)),
    },
  },
  async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Load More" }));

    await waitFor(async () => {
      await expect(
        canvas.queryByRole("button", { name: /Load More|Loading/u }),
      ).not.toBeInTheDocument();
    });

    await expect(canvas.getAllByRole("link")).toHaveLength(pageSize);
  },
);

export const Empty = meta.story({
  args: {
    initialData: new Map(),
    noItemsFoundMessage: 'No items found matching "zzzz"',
  },
});

Empty.test(
  "Shows the empty message without a Load More button",
  async ({ args, canvas }) => {
    await expect(
      await canvas.findByText('No items found matching "zzzz"'),
    ).toBeVisible();
    await expect(canvas.queryByRole("link")).not.toBeInTheDocument();
    await expect(canvas.queryByRole("button")).not.toBeInTheDocument();
    await expect(args.fetchPage).not.toHaveBeenCalled();
  },
);
