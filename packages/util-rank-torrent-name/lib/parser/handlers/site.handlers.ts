import type { Handler } from "@viren070/parse-torrent-title";

export const siteHandlers: Handler[] = [
  {
    field: "site",
    pattern: new RegExp(
      "^(www?[., ][\\w-]+[. ][\\w-]+(?:[. ][\\w-]+)?)\\s+-\\s*",
      "i",
    ),
    skipFromTitle: true,
    remove: true,
  },
  {
    field: "site",
    pattern: new RegExp(
      "^((?:www?[\\.,])?[\\w-]+\\.[\\w-]+(?:\\.[\\w-]+)*?)\\s+-\\s*",
      "i",
    ),
  },
  {
    field: "site",
    pattern: new RegExp("\\bwww.+rodeo\\b", "i"),
    remove: true,
  },
];
