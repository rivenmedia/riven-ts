import { Trash } from "lucide-react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { preview } from "#.storybook/preview.tsx";
import {
  firstPage,
  pageSize,
  pages,
} from "#app/(protected)/_components/infinite-item-grid/infinite-item-grid.fixtures.ts";
import { InfiniteItemGrid } from "#app/(protected)/_components/infinite-item-grid/infinite-item-grid.tsx";
import { ItemGrid } from "#components/item-grid/item-grid.tsx";
import { CardSelectionProvider } from "#components/providers/card-selection-provider.tsx";

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
    canvas.getByRole("link", { name: /result 1\b/iu }),
  ).toHaveAttribute("href", "/details/media/movie/movie-1");

  await expect(
    canvas.getByRole("button", { name: /load more/iu }),
  ).toBeEnabled();
});

Default.test(
  "Clicking Load More appends the next page",
  async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: /load more/iu }));

    await expect(
      await canvas.findByRole("link", { name: /result 21\b/iu }),
    ).toBeVisible();

    await expect(args.fetchPage).toHaveBeenCalledOnce();
    await expect(args.fetchPage).toHaveBeenCalledWith(2);

    await expect(canvas.getAllByRole("link")).toHaveLength(pageSize * 2);
    await expect(
      canvas.getByRole("button", { name: /load more/iu }),
    ).toBeEnabled();
  },
);

Default.test(
  "Loads the next page when the Load More button scrolls into view",
  async ({ args, canvas }) => {
    canvas.getByRole("button", { name: /load more/iu }).scrollIntoView();

    await waitFor(async () => {
      await expect(args.fetchPage).toHaveBeenCalledWith(2);
    });
    await expect(
      await canvas.findByRole("link", { name: /result 21\b/iu }),
    ).toBeInTheDocument();
  },
);

Default.test(
  "Requests successive pages on each load",
  async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: /load more/iu }));
    await canvas.findByRole("link", { name: /result 21\b/iu });

    await userEvent.click(canvas.getByRole("button", { name: /load more/iu }));
    await canvas.findByRole("link", { name: /result 41\b/iu });

    await expect(args.fetchPage).toHaveBeenNthCalledWith(1, 2);
    await expect(args.fetchPage).toHaveBeenNthCalledWith(2, 3);
  },
);

export const CustomItemHref = meta.story({
  args: {
    getItemHref: (item) => `/details/media/${item.type}/external-${item.id}`,
  },
});

CustomItemHref.test(
  "Links each item using the custom href, including loaded pages",
  async ({ canvas }) => {
    await expect(
      await canvas.findByRole("link", { name: /result 1\b/iu }),
    ).toHaveAttribute("href", "/details/media/movie/external-movie-1");

    await userEvent.click(canvas.getByRole("button", { name: /load more/iu }));

    await expect(
      await canvas.findByRole("link", { name: /result 21\b/iu }),
    ).toHaveAttribute("href", "/details/media/movie/external-movie-21");
  },
);

export const Selectable = meta.story({
  args: {
    isSelectable: true,
  },
  decorators: [
    (Story) => (
      <CardSelectionProvider
        actions={[{ label: "Remove", icon: Trash, handleClick: fn() }]}
      >
        <Story />
      </CardSelectionProvider>
    ),
  ],
});

Selectable.test("Allows items to be selected", async ({ canvas }) => {
  const link = await canvas.findByRole("link", { name: /result 1\b/iu });
  const checkbox = within(link).getByRole("checkbox", {
    name: /select item/iu,
  });

  await expect(canvas.getAllByRole("checkbox")).toHaveLength(pageSize);

  await userEvent.click(checkbox);

  await expect(checkbox).toBeChecked();
});

export const Animated = meta.story({
  args: {
    isAnimated: true,
  },
});

Animated.test(
  "Staggers each page's items from its own first item",
  async ({ canvas }) => {
    const getAnimationDelay = async (name: RegExp) => {
      const link = await canvas.findByRole("link", { name });

      return link.parentElement?.style.animationDelay;
    };

    await expect(await getAnimationDelay(/Result 2\b/u)).toBe("30ms");

    await userEvent.click(canvas.getByRole("button", { name: /load more/iu }));

    await expect(await getAnimationDelay(/Result 21\b/u)).toBe("0ms");
    await expect(await getAnimationDelay(/Result 22\b/u)).toBe("30ms");
  },
);

export const FetchingMore = meta.story({
  args: {
    // Never resolves, to hold the grid in its loading state
    fetchPage: fn(
      (_page: number) =>
        new Promise<never>(() => {
          /* never resolves */
        }),
    ),
  },
  async play({ canvas }) {
    await userEvent.click(canvas.getByRole("button", { name: /load more/iu }));
  },
});

FetchingMore.test(
  "Disables the button and shows a spinner while fetching",
  async ({ canvas }) => {
    const button = await canvas.findByRole("button", { name: /loading/iu });

    await expect(button).toBeDisabled();
    await expect(
      canvas.getByRole("status", { name: /loading/iu }),
    ).toBeVisible();
    await expect(canvas.getAllByRole("link")).toHaveLength(pageSize);
  },
);

export const NoMoreResults = meta.story({
  args: {
    fetchPage: fn((_page: number) => Promise.resolve(new Map())),
  },
});

NoMoreResults.test(
  "Hides the Load More button once a page adds no new items",
  async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: /load more/iu }));

    await waitFor(async () => {
      await expect(
        canvas.queryByRole("button", { name: /load more|loading/iu }),
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
    await userEvent.click(canvas.getByRole("button", { name: /load more/iu }));

    await waitFor(async () => {
      await expect(
        canvas.queryByRole("button", { name: /load more|loading/iu }),
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
