import { json } from "@repo/util-plugin-sdk/validation";

import dedent from "dedent";
import z from "zod";

import { CorePlugins } from "./schemas/core-plugins.schema.ts";

export const RivenSettings = z
  .object({
    attemptUnknownDownloads: json(z.boolean())
      .default(false)
      .describe(
        dedent`
        If true, Riven will attempt to download torrents whose contents cannot be verified without first attempting to download.

        **Note**: Enabling this will degrade performance as more download attempts will be made for all items,
        however it may be useful to enable if Riven's plugins are unable to find your requested items.
      `,
      )
      .meta({ "wiki.section": "scraping" }),
    dubbedAnimeOnly: json(z.boolean())
      .default(false)
      .describe("Only scrape dubbed anime.")
      .meta({ "wiki.section": "scraping" }),
    maximumScrapeAttempts: json(z.int().nonnegative())
      .default(Number.MAX_SAFE_INTEGER)
      .describe(
        "The maximum number of scrape attempts before giving up on an item.",
      )
      .meta({ "wiki.section": "scraping" }),
    minimumAverageBitrateMovies: json(z.int().positive())
      .optional()
      .describe("The minimum average bitrate for movies.")
      .meta({ "wiki.section": "scraping" }),
    minimumAverageBitrateEpisodes: json(z.int().positive())
      .optional()
      .describe("The minimum average bitrate for episodes.")
      .meta({ "wiki.section": "scraping" }),
    preferSeasonPacks: json(z.boolean())
      .default(false)
      .describe(
        "If true, Riven will prefer to download season packs over show packs.",
      )
      .meta({ "wiki.section": "scraping" }),
    scheduleOffsetMinutes: json(z.int().nonnegative())
      .default(30)
      .describe(
        "The number of minutes to wait after an item's air date before attempting to re-index it.",
      )
      .meta({ "wiki.section": "scheduling" }),
    scrapeCooldownHours: json(
      z.tuple([
        z.int().nonnegative().default(2),
        z.int().nonnegative().default(6),
        z.int().nonnegative().default(24),
      ]),
    )
      .default([2, 6, 24])
      .describe(
        dedent`
          The cooldown periods (in hours) to apply after failed scrape attempts,
          in the format [> 2 attempts, > 5 attempts, > 10 attempts].
        `,
      )
      .meta({ "wiki.section": "scraping" }),
    unknownAirDateOffsetDays: json(z.int().nonnegative())
      .default(7)
      .describe(
        "When an episode has no air date, this number of days will be added to the current date to estimate a release date for scheduling purposes.",
      )
      .meta({ "wiki.section": "scheduling" }),
    enabledPlugins: json(z.array(CorePlugins))
      .default([])
      .describe("A list of core plugins to enable.")
      .meta({ "wiki.section": "plugins" }),
  })
  .describe(
    'Core Riven settings. These settings relate mainly to user preferences and affect how Riven behaves whilst running. They are configured via environment variables prefixed with "RIVEN_SETTING__".',
  );

export type RivenSettings = z.infer<typeof RivenSettings>;
