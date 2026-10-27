import { faker } from "@faker-js/faker";
import { HttpResponse } from "msw";
import { expect, fn, userEvent, waitFor } from "storybook/test";

import { preview } from "#.storybook/preview.tsx";
import { GET_SEARCH_RESULTS } from "#app/(protected)/explore/_queries/get-search-results.query.ts";
import ExploreLayout from "#app/(protected)/explore/layout.tsx";
import ExplorePage from "#app/(protected)/explore/page.tsx";
import { api } from "#mocks/graphql.ts";

import type {
  GetSearchResultsQuery,
  GetSearchResultsQueryVariables,
} from "#app/(protected)/explore/_queries/get-search-results.query.typegen.ts";

const pageSize = 20;

function createResults(page: number) {
  return Array.from({ length: pageSize }).map((_, index) => {
    const position = (page - 1) * pageSize + index + 1;

    return {
      __typename: "SearchResult",
      plugin: "@repo/plugin-tmdb",
      item: {
        __typename: "TmdbIndexerData",
        id: String(position),
        title: `Matrix Result ${String(position)}`,
        posterUrl: faker.image.urlPicsumPhotos({ width: 200, height: 300 }),
        type: index % 2 === 0 ? "movie" : "show",
        year: 1999 + index,
        isRequestable: true,
      },
    } as const satisfies GetSearchResultsQuery["search"]["results"][number];
  });
}

// Created up front so the random posters are consistent between runs
const firstResultsPage = createResults(1);
const resultPages = [firstResultsPage, createResults(2)];

const searchResponse = (
  search: Partial<Omit<GetSearchResultsQuery["search"], "__typename">>,
) =>
  HttpResponse.json<{ data: GetSearchResultsQuery }>({
    data: {
      search: {
        __typename: "SearchResponse",
        errors: [],
        results: [],
        ...search,
      },
    },
  });

const meta = preview.meta({
  title: "Pages / Explore",
  component: ExplorePage,
  decorators: [
    (Story) => (
      <ExploreLayout params={Promise.resolve({})}>
        <Story />
      </ExploreLayout>
    ),
  ],
  args: {
    params: Promise.resolve({}),
    searchParams: Promise.resolve({ query: "matrix" }),
  },
  beforeEach({ msw }) {
    msw.use(
      api.query<GetSearchResultsQuery, GetSearchResultsQueryVariables>(
        GET_SEARCH_RESULTS,
        ({ variables }) =>
          searchResponse({
            // Two pages of results, then none
            results: resultPages[variables.page - 1] ?? [],
          }),
      ),
    );
  },
  parameters: {
    snapshot: {
      // Scrolling the Load More button into view would fetch the next page mid-snapshot
      fullPage: false,
    },
  },
});

export const Default = meta.story();

Default.test("Shows the search results", async ({ canvas }) => {
  await expect(
    await canvas.findByRole("link", { name: /matrix Result 1\b/iu }),
  ).toHaveAttribute("href", "/details/media/movie/1");
  await expect(
    canvas.getByRole("link", { name: /matrix Result 2\b/iu }),
  ).toHaveAttribute("href", "/details/media/show/2");
  await expect(canvas.getAllByRole("link")).toHaveLength(pageSize);
  await expect(
    canvas.queryByText(/Some sources could not be searched/u),
  ).not.toBeInTheDocument();
});

Default.test(
  "Loads more results until the search is exhausted",
  async ({ canvas }) => {
    await userEvent.click(
      await canvas.findByRole("button", { name: /load more/iu }),
    );

    await expect(
      await canvas.findByRole("link", { name: /matrix Result 21\b/iu }),
    ).toBeInTheDocument();
    await expect(canvas.getAllByRole("link")).toHaveLength(pageSize * 2);

    await userEvent.click(canvas.getByRole("button", { name: /load more/iu }));

    await waitFor(async () => {
      await expect(
        canvas.queryByRole("button", { name: /load more|loading/iu }),
      ).not.toBeInTheDocument();
    });
    await expect(canvas.getAllByRole("link")).toHaveLength(pageSize * 2);
  },
);

export const WithPluginErrors = meta.story({
  beforeEach({ msw }) {
    msw.use(
      api.query(GET_SEARCH_RESULTS, () =>
        searchResponse({
          results: firstResultsPage,
          errors: [
            {
              __typename: "QueryHandlerError",
              plugin: "@repo/plugin-tvdb",
              message: "Request timed out",
            },
            {
              __typename: "QueryHandlerError",
              plugin: "@repo/plugin-trakt",
              message: "Unauthorized",
            },
          ],
        }),
      ),
    );
  },
});

WithPluginErrors.test(
  "Lists the plugins that failed alongside the results",
  async ({ canvas }) => {
    const message = await canvas.findByText(
      "Some sources could not be searched: @repo/plugin-tvdb (Request timed out), @repo/plugin-trakt (Unauthorized)",
    );

    // Suspense briefly hides the resolved page while the async component re-renders
    await waitFor(async () => {
      await expect(message).toBeVisible();
    });

    await expect(canvas.getAllByRole("link")).toHaveLength(pageSize);
  },
);

export const NoResults = meta.story({
  args: {
    searchParams: Promise.resolve({ query: "zzzz" }),
  },
  beforeEach({ msw }) {
    msw.use(api.query(GET_SEARCH_RESULTS, () => searchResponse({})));
  },
});

NoResults.test("Shows a message naming the query", async ({ canvas }) => {
  const message = await canvas.findByText('No items found matching "zzzz"');

  // Suspense briefly hides the resolved page while the async component re-renders
  await waitFor(async () => {
    await expect(message).toBeVisible();
  });

  await expect(canvas.queryByRole("button")).not.toBeInTheDocument();
});

const unexpectedSearchHandler = fn(() => searchResponse({}));

export const WithoutQuery = meta.story({
  args: {
    searchParams: Promise.resolve({}),
  },
  beforeEach({ msw }) {
    msw.use(api.query(GET_SEARCH_RESULTS, unexpectedSearchHandler));
  },
});

WithoutQuery.test(
  "Prompts for a query and doesn't search until one is entered",
  async ({ canvas }) => {
    const message = await canvas.findByText(
      "Enter a search term to find movies and shows.",
    );

    // Suspense briefly hides the resolved page while the async component re-renders
    await waitFor(async () => {
      await expect(message).toBeVisible();
    });

    await expect(unexpectedSearchHandler).not.toHaveBeenCalled();
  },
);
