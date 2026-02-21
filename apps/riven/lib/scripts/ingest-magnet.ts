import {
  Episode,
  ItemRequest,
  MediaItem,
  Movie,
  Season,
  Show,
  Stream,
} from "@repo/util-plugin-sdk/dto/entities";

import { type EntityManager } from "@mikro-orm/postgresql";
import { setTimeout as sleep } from "node:timers/promises";

import { initORM } from "../database/database.ts";
import { createDownloadItemJob } from "../message-queue/flows/download-item/download-item.schema.ts";
import { createFindValidTorrentContainerJob } from "../message-queue/flows/download-item/steps/find-valid-torrent-container/find-valid-torrent-container.schema.ts";

const DEFAULT_DOWNLOADER = "@repo/plugin-realdebrid";
const DEFAULT_WAIT_SECONDS = 120;

interface ParsedArgs {
  magnet?: string;
  infoHash?: string;
  mediaItemId?: number;
  title?: string;
  tmdbId?: string;
  tvdbId?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  year?: number;
  rawTitle?: string;
  noBootstrapIfMissing: boolean;
  waitSeconds: number;
  downloader: string;
  noEnqueue: boolean;
  help: boolean;
}

function usage() {
  console.log(
    [
      "Manual magnet ingest for riven.",
      "",
      "Usage:",
      "  pnpm --filter @repo/riven ingest:magnet -- \\",
      '    --magnet "magnet:?xt=urn:btih:..." \\',
      '    --title "Anime Name" \\',
      "    --tmdb-id 12345",
      "",
      "Or attach to an existing media item:",
      "  pnpm --filter @repo/riven ingest:magnet -- \\",
      '    --magnet "magnet:?xt=urn:btih:..." \\',
      "    --media-item-id 42",
      "",
      "Options:",
      "  --magnet <uri>               Full magnet URI",
      "  --info-hash <sha1>           40-char hex info hash (alternative to --magnet)",
      "  --media-item-id <id>         Existing media item ID",
      "  --title <title>              Movie title (required when creating a movie)",
      "  --tmdb-id <id>               TMDB ID (required when creating a movie)",
      "  --tvdb-id <id>               TVDB ID (for existing show/season/episode)",
      "  --season-number <n>          Season number (with --tvdb-id)",
      "  --episode-number <n>         Episode number (with --tvdb-id and --season-number)",
      "  --year <year>                Optional release year",
      "  --raw-title <title>          Optional raw stream title override",
      "  --wait-seconds <seconds>     Wait timeout when auto-indexing missing show",
      `                               default: ${DEFAULT_WAIT_SECONDS.toString()}`,
      "  --no-bootstrap-if-missing    Do not auto-create/index show when missing",
      "  --downloader <plugin-name>   Downloader plugin name",
      "                               default: @repo/plugin-realdebrid",
      "  --no-enqueue                 Persist stream but do not enqueue download flow",
      "  --help                       Show this help",
    ].join("\n"),
  );
}

function readValue(
  args: string[],
  index: number,
  key: string,
): [string, number] {
  const value = args[index + 1];

  if (!value || value.startsWith("--")) {
    throw new Error(`Missing value for ${key}`);
  }

  return [value, index + 1];
}

function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = {
    downloader: DEFAULT_DOWNLOADER,
    noBootstrapIfMissing: false,
    waitSeconds: DEFAULT_WAIT_SECONDS,
    noEnqueue: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];

    switch (token) {
      case "--":
        break;
      case "--help":
      case "-h":
        parsed.help = true;
        break;
      case "--magnet": {
        const [value, nextIndex] = readValue(argv, i, token);
        parsed.magnet = value;
        i = nextIndex;
        break;
      }
      case "--info-hash": {
        const [value, nextIndex] = readValue(argv, i, token);
        parsed.infoHash = value;
        i = nextIndex;
        break;
      }
      case "--media-item-id": {
        const [value, nextIndex] = readValue(argv, i, token);
        const id = Number.parseInt(value, 10);

        if (!Number.isInteger(id) || id <= 0) {
          throw new Error("Expected a positive integer for --media-item-id");
        }

        parsed.mediaItemId = id;
        i = nextIndex;
        break;
      }
      case "--title": {
        const [value, nextIndex] = readValue(argv, i, token);
        parsed.title = value;
        i = nextIndex;
        break;
      }
      case "--tmdb-id": {
        const [value, nextIndex] = readValue(argv, i, token);
        parsed.tmdbId = value;
        i = nextIndex;
        break;
      }
      case "--tvdb-id": {
        const [value, nextIndex] = readValue(argv, i, token);
        parsed.tvdbId = value;
        i = nextIndex;
        break;
      }
      case "--season-number": {
        const [value, nextIndex] = readValue(argv, i, token);
        const seasonNumber = Number.parseInt(value, 10);

        if (!Number.isInteger(seasonNumber) || seasonNumber <= 0) {
          throw new Error("Expected a positive integer for --season-number");
        }

        parsed.seasonNumber = seasonNumber;
        i = nextIndex;
        break;
      }
      case "--episode-number": {
        const [value, nextIndex] = readValue(argv, i, token);
        const episodeNumber = Number.parseInt(value, 10);

        if (!Number.isInteger(episodeNumber) || episodeNumber <= 0) {
          throw new Error("Expected a positive integer for --episode-number");
        }

        parsed.episodeNumber = episodeNumber;
        i = nextIndex;
        break;
      }
      case "--year": {
        const [value, nextIndex] = readValue(argv, i, token);
        const year = Number.parseInt(value, 10);

        if (!Number.isInteger(year) || year <= 0) {
          throw new Error("Expected a positive integer for --year");
        }

        parsed.year = year;
        i = nextIndex;
        break;
      }
      case "--raw-title": {
        const [value, nextIndex] = readValue(argv, i, token);
        parsed.rawTitle = value;
        i = nextIndex;
        break;
      }
      case "--wait-seconds": {
        const [value, nextIndex] = readValue(argv, i, token);
        const waitSeconds = Number.parseInt(value, 10);

        if (!Number.isInteger(waitSeconds) || waitSeconds <= 0) {
          throw new Error("Expected a positive integer for --wait-seconds");
        }

        parsed.waitSeconds = waitSeconds;
        i = nextIndex;
        break;
      }
      case "--no-bootstrap-if-missing":
        parsed.noBootstrapIfMissing = true;
        break;
      case "--downloader": {
        const [value, nextIndex] = readValue(argv, i, token);
        parsed.downloader = value;
        i = nextIndex;
        break;
      }
      case "--no-enqueue":
        parsed.noEnqueue = true;
        break;
      default:
        throw new Error(`Unknown argument: ${token}`);
    }
  }

  return parsed;
}

function base32ToHex(base32: string): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleaned = base32.toUpperCase().replace(/=+$/g, "");
  let bits = "";

  for (const char of cleaned) {
    const index = alphabet.indexOf(char);

    if (index === -1) {
      throw new Error(`Invalid base32 character in btih: ${char}`);
    }

    bits += index.toString(2).padStart(5, "0");
  }

  const bytes: number[] = [];

  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(Number.parseInt(bits.slice(i, i + 8), 2));
  }

  return Buffer.from(bytes).toString("hex");
}

function normaliseInfoHash(input: string): string {
  const candidate = input.trim();

  if (/^[a-fA-F0-9]{40}$/.test(candidate)) {
    return candidate.toLowerCase();
  }

  if (/^[a-zA-Z2-7]{32}$/.test(candidate)) {
    const decoded = base32ToHex(candidate);

    if (!/^[a-f0-9]{40}$/.test(decoded)) {
      throw new Error("Decoded base32 hash is not a valid SHA1 hash");
    }

    return decoded;
  }

  throw new Error(
    "Info hash must be a 40-char hex SHA1 hash or a 32-char base32 btih hash",
  );
}

function extractInfoHashFromMagnet(magnetUri: string): string {
  const url = new URL(magnetUri);

  if (url.protocol !== "magnet:") {
    throw new Error("Provided URI is not a magnet URI");
  }

  const xtCandidates = url.searchParams.getAll("xt");

  for (const xt of xtCandidates) {
    const lowered = xt.toLowerCase();
    const prefix = "urn:btih:";

    if (!lowered.startsWith(prefix)) {
      continue;
    }

    const rawHash = xt.slice(prefix.length);
    return normaliseInfoHash(rawHash);
  }

  throw new Error("No btih hash found in magnet URI");
}

function displayNameFromMagnet(magnetUri: string): string | undefined {
  const url = new URL(magnetUri);
  return url.searchParams.get("dn") ?? undefined;
}

async function findTvdbTarget(
  em: EntityManager,
  args: ParsedArgs,
): Promise<MediaItem | null> {
  if (!args.tvdbId) {
    return null;
  }

  if (args.episodeNumber != null && args.seasonNumber != null) {
    return em.findOne(
      Episode,
      {
        tvdbId: args.tvdbId,
        number: args.episodeNumber,
        season: { number: args.seasonNumber },
      },
      { populate: ["streams:ref"] },
    );
  }

  if (args.seasonNumber != null) {
    return em.findOne(
      Season,
      {
        tvdbId: args.tvdbId,
        number: args.seasonNumber,
      },
      { populate: ["streams:ref"] },
    );
  }

  return em.findOne(
    Show,
    { tvdbId: args.tvdbId },
    { populate: ["streams:ref"] },
  );
}

async function bootstrapShowIndex(
  em: EntityManager,
  tvdbId: string,
  waitSeconds: number,
) {
  const { enqueueIndexItem } =
    await import("../message-queue/flows/index-item/enqueue-index-item.ts");
  const tvdbSubscriber = {
    name: Symbol("@repo/plugin-tvdb"),
  } as Parameters<typeof enqueueIndexItem>[0]["subscribers"][number];

  let itemRequest = await em.findOne(ItemRequest, {
    tvdbId,
    type: "show",
  });

  if (!itemRequest) {
    itemRequest = em.create(ItemRequest, {
      requestedBy: "manual-ingest",
      state: "requested",
      type: "show",
      imdbId: null,
      tmdbId: null,
      tvdbId,
      externalRequestId: null,
    });

    await em.persistAndFlush(itemRequest);
  } else if (itemRequest.state !== "requested") {
    itemRequest.state = "requested";
    itemRequest.completedAt = null;
    await em.persistAndFlush(itemRequest);
  }

  await enqueueIndexItem({
    item: itemRequest,
    subscribers: [tvdbSubscriber],
  });

  const deadline = Date.now() + waitSeconds * 1000;

  while (Date.now() < deadline) {
    em.clear();

    const show = await em.findOne(
      Show,
      { tvdbId },
      { populate: ["streams:ref"] },
    );

    if (show) {
      return show;
    }

    await sleep(2000);
  }

  throw new Error(
    `Show tvdbId=${tvdbId} was not indexed after ${waitSeconds.toString()} seconds`,
  );
}

async function resolveTargetMediaItem(
  em: EntityManager,
  args: ParsedArgs,
): Promise<MediaItem> {
  if (args.mediaItemId) {
    return em.findOneOrFail(MediaItem, args.mediaItemId, {
      populate: ["streams:ref"],
    });
  }

  if (args.tvdbId) {
    if (args.episodeNumber != null && args.seasonNumber == null) {
      throw new Error(
        "--episode-number requires --season-number when using --tvdb-id",
      );
    }

    let target = await findTvdbTarget(em, args);

    if (!target) {
      if (args.noBootstrapIfMissing) {
        throw new Error(
          `No matching item found for tvdbId=${args.tvdbId}. Remove --no-bootstrap-if-missing to auto-index it.`,
        );
      }

      await bootstrapShowIndex(em, args.tvdbId, args.waitSeconds);
      target = await findTvdbTarget(em, args);
    }

    if (!target) {
      throw new Error(
        `No matching show/season/episode found for tvdbId=${args.tvdbId}.`,
      );
    }

    return target;
  }

  if (!args.title || !args.tmdbId) {
    throw new Error(
      "Provide one of: --media-item-id, --tvdb-id, or (--title and --tmdb-id for a movie)",
    );
  }

  const existingMovie = await em.findOne(
    Movie,
    { tmdbId: args.tmdbId },
    { populate: ["streams:ref"] },
  );

  if (existingMovie) {
    if (args.year) {
      existingMovie.year = args.year;
    }

    existingMovie.title = args.title;
    existingMovie.state = "scraped";
    existingMovie.scrapedAt = new Date();

    return existingMovie;
  }

  return em.create(Movie, {
    title: args.title,
    tmdbId: args.tmdbId,
    year: args.year ?? null,
    contentRating: "unknown",
    state: "scraped",
    scrapedAt: new Date(),
    imdbId: null,
    failedAttempts: 0,
  });
}

async function upsertStream(
  em: EntityManager,
  infoHash: string,
  rawTitle: string,
): Promise<Stream> {
  const existing = await em.findOne(Stream, { infoHash });

  if (existing) {
    if (!existing.rawTitle) {
      existing.rawTitle = rawTitle;
    }

    if (!existing.parsedTitle) {
      existing.parsedTitle = rawTitle;
    }

    if (!Number.isFinite(existing.rank)) {
      existing.rank = 1;
    }

    return existing;
  }

  return em.create(Stream, {
    infoHash,
    rawTitle,
    parsedTitle: rawTitle,
    rank: 1,
  });
}

async function collectItemsToAttachStream(
  mediaItem: MediaItem,
): Promise<MediaItem[]> {
  if (mediaItem instanceof Show) {
    return [mediaItem];
  }

  if (mediaItem instanceof Season || mediaItem instanceof Episode) {
    const show = await mediaItem.getShow();
    return [mediaItem, show];
  }

  return [mediaItem];
}

async function enqueueDownload(
  mediaItemId: number,
  infoHash: string,
  downloader: string,
) {
  const { flow } = await import("../message-queue/flows/producer.ts");

  const findValidTorrentContainerNode = createFindValidTorrentContainerJob(
    `Manual ingest torrent lookup for media item ${mediaItemId.toString()}`,
    {
      id: mediaItemId,
      availableDownloaders: [downloader],
      infoHashes: [infoHash],
      failedInfoHashes: [],
    },
  );

  const rootNode = createDownloadItemJob(
    `Manual ingest download for media item ${mediaItemId.toString()}`,
    { id: mediaItemId },
    { children: [findValidTorrentContainerNode] },
  );

  await flow.add(rootNode);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    usage();
    return;
  }

  if (!args.magnet && !args.infoHash) {
    throw new Error("Provide either --magnet or --info-hash");
  }

  const infoHash = args.infoHash
    ? normaliseInfoHash(args.infoHash)
    : extractInfoHashFromMagnet(args.magnet as string);
  const titleFromMagnet = args.magnet
    ? displayNameFromMagnet(args.magnet)
    : undefined;
  const rawTitle = args.rawTitle ?? titleFromMagnet ?? args.title ?? infoHash;

  const { databaseConfig } = await import("../database/config.ts");
  const db = await initORM(databaseConfig);
  const em = db.orm.em.fork();
  const mediaItem = await resolveTargetMediaItem(em, args);
  const stream = await upsertStream(em, infoHash, rawTitle);
  const itemsToAttach = await collectItemsToAttachStream(mediaItem);

  mediaItem.state = "scraped";
  mediaItem.scrapedAt = new Date();

  for (const item of itemsToAttach) {
    if (!item.streams.contains(stream)) {
      item.streams.add(stream);
    }
  }

  await em.persistAndFlush([...itemsToAttach, stream]);
  await em.refreshOrFail(mediaItem, {
    populate: ["streams:ref"],
  });

  if (!args.noEnqueue) {
    await enqueueDownload(mediaItem.id, infoHash, args.downloader);
  }

  console.log(
    [
      "Manual magnet ingest complete.",
      `mediaItemId=${mediaItem.id.toString()}`,
      `infoHash=${infoHash}`,
      `downloader=${args.downloader}`,
      `enqueued=${(!args.noEnqueue).toString()}`,
    ].join(" "),
  );

  await db.orm.close(true);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`ingest-magnet failed: ${message}`);
  usage();
  process.exit(1);
});
