import { faker } from "@faker-js/faker";
import { graphql, HttpResponse } from "msw";
import { expect, waitFor } from "storybook/test";

import preview from "#.storybook/preview.tsx";
import { getSessionHandler } from "#mocks/handlers/get-session.handler.ts";

import { GET_LIBRARY_ITEMS } from "./_queries/get-library-items.query.ts";
import { LibraryPage } from "./page.client.tsx";

import type { GetLibraryItemsQuery } from "./_queries/get-library-items.query.typegen.ts";
import type { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";
import type { StoryContext } from "@storybook/nextjs-vite";

//#region Helpers
const libraryItems = [
  {
    __typename: "Movie",
    id: "1",
    type: "movie",
    title: "John Wick: Chapter 4",
    releaseDate: "2023-03-24",
    year: 2023,
    posterUrl: faker.image.urlPicsumPhotos({ width: 200, height: 300 }),
    state: "completed",
  },
  {
    __typename: "Show",
    id: "2",
    type: "show",
    title: "Arcane",
    releaseDate: "2024-01-01",
    year: 2024,
    posterUrl: faker.image.urlPicsumPhotos({ width: 200, height: 300 }),
    state: "indexed",
  },
] as const satisfies (GetLibraryItemsQuery["mediaItems"]["items"][number] & {
  state: MediaItemState;
})[];

/**
 * Checks whether a value passes a GraphQL list filter, where an omitted filter matches everything.
 */
const matchesFilter = <T,>(filter: T | T[] | null | undefined, value: T) =>
  filter == null || [filter].flat().includes(value);

/**
 * Asserts that exactly the given library items are displayed.
 */
const expectVisibleItems = async (
  { canvas, step }: Pick<StoryContext, "canvas" | "step">,
  expectedTitles: string[],
) => {
  await step("Wait for items to update", async () => {
    await waitFor(async () => {
      for (const { title } of libraryItems) {
        await expect(canvas.queryByText(title)).toBe(
          expectedTitles.includes(title) ? canvas.getByText(title) : null,
        );
      }
    });
  });
};

/**
 * Opens a filter dropdown, then selects one of its options.
 */
const selectFilterOption = async (
  { canvas, userEvent }: Pick<StoryContext, "canvas" | "userEvent">,
  trigger: RegExp,
  option: string,
) => {
  await userEvent.type(
    canvas.getByRole("combobox", { name: trigger }),
    `${option}{Enter}`,
  );
};
//#endregion

const meta = preview.meta({
  title: "Pages / Library",
  component: LibraryPage,
  beforeEach({ msw }) {
    msw.use(
      getSessionHandler,
      graphql.query(GET_LIBRARY_ITEMS, ({ variables }) => {
        const search = variables.search?.toLowerCase();

        const items = libraryItems.filter(
          (item) =>
            (!search || item.title.toLowerCase().includes(search)) &&
            matchesFilter(variables.type, item.type) &&
            matchesFilter(variables.state, item.state),
        );

        return HttpResponse.json({
          data: {
            mediaItems: {
              __typename: "MediaItemCursor",
              hasNextPage: false,
              hasPrevPage: false,
              totalCount: items.length,
              items,
            },
          },
        });
      }),
    );
  },
});

export const Default = meta.story({
  args: {
    totalItems: libraryItems.length,
    items: libraryItems,
  },
});

Default.test(
  "Shows matching items when a search term is entered",
  async ({ canvas, userEvent, step }) => {
    await userEvent.type(canvas.getByPlaceholderText(/search/iu), "arcane");

    await expectVisibleItems({ canvas, step }, ["Arcane"]);
  },
);

Default.test(
  "Shows matching items when the type filter is changed",
  async (context) => {
    await selectFilterOption(context, /type/iu, "tv shows");

    await expectVisibleItems(context, ["Arcane"]);

    await selectFilterOption(context, /type/iu, "movies");

    await expectVisibleItems(context, ["John Wick: Chapter 4"]);
  },
);

Default.test(
  "Shows matching items when the state filter is changed",
  async (context) => {
    await selectFilterOption(context, /state/iu, "completed");

    await expectVisibleItems(context, ["John Wick: Chapter 4"]);

    await selectFilterOption(context, /state/iu, "indexed");

    await expectVisibleItems(context, ["Arcane"]);
  },
);

Default.test(
  'Resets the form when "Clear all filters" is clicked',
  async (context) => {
    const { canvas, userEvent, step } = context;

    const searchInput = canvas.getByPlaceholderText(/search/iu);

    await step("Filter out every item", async () => {
      await userEvent.type(searchInput, "nothing matches this");
      await selectFilterOption(context, /type/iu, "tv shows");
      await selectFilterOption(context, /state/iu, "completed");

      await expect(
        await canvas.findByText(/no items found/iu),
      ).toBeInTheDocument();
    });

    await step("Clear all filters", async () => {
      await userEvent.click(
        canvas.getByRole("button", { name: /clear all filters/iu }),
      );
    });

    await expect(searchInput).toHaveValue("");
    await expect(
      canvas.getByRole("combobox", { name: /type/iu }),
    ).toHaveTextContent("All types");
    await expect(
      canvas.getByRole("combobox", { name: /state/iu }),
    ).toHaveTextContent("All states");

    await expectVisibleItems(
      context,
      libraryItems.map(({ title }) => title),
    );
  },
);

export const NoItems = meta.story({
  args: {
    totalItems: 0,
    items: [],
  },
});

export const NoItemsMatchingFilter = Default.extend({
  async play({ canvas, userEvent, step, context }) {
    await step("Filter out every item", async () => {
      await userEvent.type(
        canvas.getByPlaceholderText(/search/iu),
        "nothing matches this",
      );

      await selectFilterOption(context, /type/iu, "tv shows");
      await selectFilterOption(context, /state/iu, "completed");

      await expect(
        await canvas.findByText(/no items found/iu),
      ).toBeInTheDocument();
    });
  },
});
