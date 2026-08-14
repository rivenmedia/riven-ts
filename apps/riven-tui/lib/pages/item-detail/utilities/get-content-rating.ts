import type { GetMediaItemQuery } from "../item-detail.page.typegen.ts";

/** Movies and shows/seasons/episodes use different content rating enums. */
export function getContentRating(
  item: GetMediaItemQuery["mediaItemById"],
): string | null {
  switch (item.__typename) {
    case "Movie": {
      return item.movieContentRating;
    }

    case "Show": {
      return item.showContentRating;
    }

    case "Episode":
    case "Season": {
      return null;
    }
  }
}
