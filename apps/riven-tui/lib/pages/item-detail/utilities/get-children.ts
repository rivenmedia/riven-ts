import type { MediaItemState } from "../../../types/__generated__/graphql.ts";
import type { RivenTuiGetMediaItemQuery } from "../queries/get-media-item.query.typegen.ts";

export interface ChildItem {
  id: string;
  number: number;
  state: MediaItemState;
  title: string;
  type: "Episode" | "Season";
}

/**
 * Shows and seasons expose their children (seasons and episodes,
 * respectively) inline on the same query - this pulls them out into a
 * uniform shape the detail screen can render as a navigable list.
 */
export function getChildren(
  item: RivenTuiGetMediaItemQuery["mediaItemById"],
): ChildItem[] {
  switch (item.__typename) {
    case "Show": {
      return item.seasons.map((season) => ({
        id: season.id,
        number: season.number,
        state: season.state,
        title: season.title,
        type: "Season" as const,
      }));
    }

    case "Season": {
      return item.episodes.map((episode) => ({
        id: episode.id,
        number: episode.number,
        state: episode.state,
        title: episode.title,
        type: "Episode" as const,
      }));
    }

    case "Episode":
    case "Movie": {
      return [];
    }
  }
}
