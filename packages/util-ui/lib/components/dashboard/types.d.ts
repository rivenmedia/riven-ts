export interface DashboardStatistics {
  totalMovies: number;
  totalShows: number;
  totalSeasons: number;
  totalEpisodes: number;
  totalItems: number;
  incompleteItems: number;
  completionRate: number;
  states: Record<string, number>;
  activity: Record<string, number>;
  mediaYearReleases: { year: number; count: number }[];
}
