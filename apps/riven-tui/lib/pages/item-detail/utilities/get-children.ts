import type {
  MediaItemState,
  MediaItemType,
} from "../../../types/__generated__/graphql.ts";
import type { RivenTuiGetMediaItemChildrenQuery } from "../queries/get-media-item-children.query.typegen.ts";

export interface ChildItem {
  id: string;
  number: number;
  state: MediaItemState;
  title: string;
  type: MediaItemType;
  isRequested: boolean;
}

/**
 * Shows and seasons expose their children (seasons and episodes,
 * respectively) inline on the same query - this pulls them out into a
 * uniform shape the detail screen can render as a navigable list.
 */
export function getChildren(
  item: RivenTuiGetMediaItemChildrenQuery["mediaItemById"],
): ChildItem[] {
  switch (item.__typename) {
    case "Show": {
      return item.seasons.map(({ __typename, ...season }) => season);
    }

    case "Season": {
      return item.episodes.map(({ __typename, ...episode }) => episode);
    }

    case "Episode":
    case "Movie": {
      return [];
    }
  }
}
