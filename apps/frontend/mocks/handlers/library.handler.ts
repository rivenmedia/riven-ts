import { faker } from "@faker-js/faker";
import { HttpResponse } from "msw";

import { GET_LIBRARY_ITEMS } from "#app/(protected)/library/_queries/get-library-items.query.ts";
import { api } from "#mocks/graphql.ts";

import type { GetLibraryItemsQuery } from "#app/(protected)/library/_queries/get-library-items.query.typegen.ts";
import type { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";

type LibraryItem = GetLibraryItemsQuery["mediaItems"]["items"][number] & {
  state: MediaItemState;
};

export const libraryItems = [
  {
    __typename: "Movie",
    id: "1",
    type: "movie",
    title: "John Wick: Chapter 4",
    releaseDate: "2023-03-24",
    year: 2023,
    posterUrl: faker.image.urlPicsumPhotos({ width: 200, height: 300 }),
    state: "completed",
    primaryExternalId: "tmdb-12345",
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
    primaryExternalId: "tvdb-12345",
  },
] as const satisfies LibraryItem[];

/**
 * Checks whether a value passes a GraphQL list filter, where an omitted filter matches everything.
 */
const matchesFilter = <T>(filter: T | T[] | null | undefined, value: T) =>
  filter == null || [filter].flat().includes(value);

/**
 * Mocks the library, filtering the given items by the search term, type and state, as Riven does.
 */
export const createLibraryItemsHandler = (
  items: readonly LibraryItem[] = libraryItems,
) =>
  api.query(GET_LIBRARY_ITEMS, ({ variables }) => {
    const search = variables.search?.toLowerCase();

    const matchingItems = items.filter(
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
          totalCount: matchingItems.length,
          endCursor: null,
          items: matchingItems,
        },
      },
    });
  });
