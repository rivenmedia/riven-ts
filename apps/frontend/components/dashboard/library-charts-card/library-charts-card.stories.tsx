import { preview } from "@/.storybook/preview";

import { LibraryChartsCard } from "./library-charts-card";

const meta = preview.meta({
  title: "Dashboard / LibraryChartsCard",
  component: LibraryChartsCard,
});

export const Default = meta.story({
  args: {
    isLoading: false,
    statistics: {
      totalMovies: 842,
      totalShows: 156,
      totalSeasons: 612,
      totalEpisodes: 11_029,
      totalItems: 998,
      incompleteItems: 47,
      completionRate: 95.29,
      states: {
        Completed: 951,
        Downloading: 12,
        Scraping: 8,
        Failed: 15,
        Requested: 12,
      },
      activity: {},
      mediaYearReleases: [
        { year: 2020, count: 62 },
        { year: 2021, count: 88 },
        { year: 2022, count: 121 },
        { year: 2023, count: 154 },
        { year: 2024, count: 178 },
      ],
    },
  },
});

export const Loading = meta.story({
  args: {
    statistics: undefined,
    isLoading: true,
  },
});
