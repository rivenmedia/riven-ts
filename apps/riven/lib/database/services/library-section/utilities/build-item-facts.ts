import { Movie } from "@repo/util-plugin-sdk/dto/entities";

import {
  normaliseCountry,
  normaliseLanguage,
  normaliseText,
  normaliseTextList,
} from "./normalise.ts";

import type { ItemFacts, StreamFacts } from "./item-facts.ts";
import type { EntityManager } from "@mikro-orm/core";
import type { Show } from "@repo/util-plugin-sdk/dto/entities";
import type { UUID } from "node:crypto";

/**
 * Per-item aggregates that cannot be read off the entity itself.
 *
 * Movies carry their own file size, but a show's size and runtime live on its
 * episodes, two levels down. Both are collected in one grouped query rather
 * than by walking collections per item.
 */
export interface ItemAggregates {
  fileSize: Map<UUID, number>;
  runtime: Map<UUID, number>;
}

interface AggregateRow {
  id: string;
  file_size: string | number | null;
  runtime: string | number | null;
}

/** Postgres returns numerics as strings; SQLite returns numbers. */
const toNumber = (value: string | number | null) => {
  if (value === null) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
};

const collectAggregates = (rows: AggregateRow[]): ItemAggregates => {
  const fileSize = new Map<UUID, number>();
  const runtime = new Map<UUID, number>();

  for (const row of rows) {
    const id = row.id as UUID;
    const size = toNumber(row.file_size);
    const duration = toNumber(row.runtime);

    if (size !== null) {
      fileSize.set(id, size);
    }

    if (duration !== null) {
      runtime.set(id, duration);
    }
  }

  return { fileSize, runtime };
};

/**
 * Total media file size per movie.
 *
 * Summed rather than taken from a single row because a movie may legitimately
 * have more than one media entry.
 */
export async function loadMovieAggregates(
  em: EntityManager,
): Promise<ItemAggregates> {
  const rows = (await em.getConnection("read").execute(
    `select movie.id as id,
            sum(entry.file_size) as file_size,
            movie.runtime as runtime
     from media_item movie
     join file_system_entry entry
       on entry.media_item_id = movie.id and entry.type = 'media'
     where movie.type = 'movie'
     group by movie.id, movie.runtime`,
  )) as AggregateRow[];

  return collectAggregates(rows);
}

/**
 * Mean episode file size and runtime per show.
 *
 * The mean rather than the sum, so that a size or runtime rule means the same
 * thing whether it is matched against a movie or a ten-season show.
 */
export async function loadShowAggregates(
  em: EntityManager,
): Promise<ItemAggregates> {
  const rows = (await em.getConnection("read").execute(
    `select show.id as id,
            avg(entry.file_size) as file_size,
            avg(episode.runtime) as runtime
     from media_item show
     join media_item season on season.show_id = show.id and season.type = 'season'
     join media_item episode on episode.season_id = season.id and episode.type = 'episode'
     join file_system_entry entry
       on entry.media_item_id = episode.id and entry.type = 'media'
     where show.type = 'show'
     group by show.id`,
  )) as AggregateRow[];

  return collectAggregates(rows);
}

const buildStreamFacts = (
  parsedData: Record<string, unknown> | undefined,
): StreamFacts | null => {
  if (!parsedData) {
    return null;
  }

  return {
    resolution: normaliseText(parsedData["resolution"] as string | undefined),
    quality: normaliseText(parsedData["quality"] as string | undefined),
    codec: normaliseText(parsedData["codec"] as string | undefined),
    hdr: normaliseTextList(parsedData["hdr"] as string[] | undefined),
    audio: normaliseTextList(parsedData["audio"] as string[] | undefined),
    remux: parsedData["remux"] === true,
    group: normaliseText(parsedData["group"] as string | undefined),
  };
};

/**
 * Flattens a media item into the shape the rule evaluator consumes.
 *
 * Everything provider-specific is normalised here so that `evaluateRule` can
 * stay a pure comparison over plain values. `activeStream` must already be
 * populated; nothing in this function touches the database.
 */
export function buildItemFacts(
  item: Movie | Show,
  aggregates: ItemAggregates,
): ItemFacts {
  const activeStream = item.activeStream?.isInitialized()
    ? item.activeStream.getEntity()
    : null;

  return {
    id: item.id,
    type: item instanceof Movie ? "movie" : "show",
    title: normaliseText(item.title),
    genres: normaliseTextList(item.genres),
    year: item.year ?? null,
    releaseDate: item.releaseDate?.getTime() ?? null,
    createdAt: item.createdAt.getTime(),
    language: normaliseLanguage(item.language),
    country: normaliseCountry(item.country),
    network: normaliseText(item.network),
    contentRating: normaliseText(item.contentRating),
    state: item.state,
    // Uses the entity's own definition so sections agree with the rest of the
    // app. Note it compares `language !== "en"` against the raw column, which
    // is always true for shows since those are indexed as ISO 639-3.
    isAnime: item.isAnime,
    runtime:
      aggregates.runtime.get(item.id) ??
      (item instanceof Movie ? (item.runtime ?? null) : null),
    fileSize: aggregates.fileSize.get(item.id) ?? null,
    stream: buildStreamFacts(activeStream?.parsedData),
  };
}
