import type { TabData } from "../../ui/tab-bar/tab-bar.tsx";

interface LibraryItemCounts {
  totalMovies: number;
  totalShows: number;
}

export function getLibraryTabs({ totalMovies, totalShows }: LibraryItemCounts) {
  return {
    "/library": {
      label: `All (${(totalMovies + totalShows).toString()})`,
    },
    "/library/type/movie": {
      label: `Movies (${totalMovies.toString()})`,
    },
    "/library/type/show": {
      label: `Shows (${totalShows.toString()})`,
    },
    "/search": {
      label: "Search",
    },
  } satisfies Record<string, TabData>;
}
