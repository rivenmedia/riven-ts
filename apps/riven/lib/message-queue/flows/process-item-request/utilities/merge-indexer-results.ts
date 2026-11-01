import type {
  MediaItemIndexRequestedMovieResponse,
  MediaItemIndexRequestedShowResponse,
} from "@repo/util-plugin-sdk/schemas/events/media-item.index.requested.event";

/**
 * Merges the indexed item data returned by each indexer plugin into a single item.
 */
export function mergeIndexerResults(
  results: (
    | MediaItemIndexRequestedMovieResponse
    | MediaItemIndexRequestedShowResponse
    | undefined
  )[],
) {
  type IndexedItem = NonNullable<
    MediaItemIndexRequestedMovieResponse | MediaItemIndexRequestedShowResponse
  >["item"];

  const item = {} as IndexedItem;

  for (const value of results) {
    if (!value?.item) {
      continue;
    }

    Object.assign(item, value.item);
  }

  return item;
}
