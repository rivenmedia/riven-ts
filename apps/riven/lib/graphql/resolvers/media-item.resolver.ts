import { MediaItem } from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemType } from "@repo/util-plugin-sdk/dto/enums/media-item-type.enum";
import { MediaItemUnion } from "@repo/util-plugin-sdk/dto/unions/media-item.union";

import { type FilterQuery, sql } from "@mikro-orm/core";
import { Arg, FieldResolver, ID, Int, Query, Resolver } from "type-graphql";

import { CoreContext } from "../decorators/core-context.ts";
import { LibraryCounts } from "../types/library-counts.type.ts";

import type { UUID } from "node:crypto";

/** Hard upper bound on `mediaItems(limit)` to keep abusive payloads bounded. */
const MAX_MEDIA_ITEMS_LIMIT = 100;

@Resolver(() => MediaItem)
export class MediaItemResolver {
  @Query(() => MediaItemUnion, {
    description:
      "Fetches a media item by its ID. The returned type will be one of the specific media item types (e.g., Movie, Episode) based on the underlying data.",
  })
  mediaItemById(
    @CoreContext() { em }: CoreContext,
    @Arg("id", () => ID) id: UUID,
  ) {
    return em.findOneOrFail(MediaItem, id);
  }

  @Query(() => [MediaItem], {
    description:
      "Lists media items with optional search, type filter, and pagination.",
  })
  mediaItems(
    @CoreContext() { em }: CoreContext,
    @Arg("limit", () => Int, {
      defaultValue: 25,
      description: `Maximum number of items to return. Hard-capped at ${String(MAX_MEDIA_ITEMS_LIMIT)} to keep payloads bounded.`,
    })
    limit: number,
    @Arg("offset", () => Int, {
      defaultValue: 0,
      description: "Zero-based offset for pagination.",
    })
    offset: number,
    @Arg("search", () => String, {
      nullable: true,
      description:
        "Case-insensitive substring match against `title`. Trimmed; empty strings are treated as no filter.",
    })
    search: string | null = null,
    @Arg("type", () => MediaItemType.enum, {
      nullable: true,
      description: "Restrict results to a single MediaItem subtype.",
    })
    type: MediaItemType | null = null,
  ): Promise<MediaItem[]> {
    const clampedLimit = Math.min(
      Math.max(1, Math.trunc(limit)),
      MAX_MEDIA_ITEMS_LIMIT,
    );
    const clampedOffset = Math.max(0, Math.trunc(offset));

    // Compose filters in a dialect-portable way. `$ilike` would be cleaner but
    // is PostgreSQL-only; mikro-orm does not translate it for SQLite (which
    // the test fixtures use). The documented pattern for case-insensitive
    // search is `{ [sql`lower(column)`]: { $like: pattern } }`, which emits
    // `lower(column) LIKE ?` in both dialects.
    const where: Record<string | symbol, unknown> = {};
    if (type) {
      where["type"] = type;
    }
    const trimmedSearch = search?.trim();
    if (trimmedSearch && trimmedSearch.length > 0) {
      where[sql`lower(title)`] = {
        $like: `%${trimmedSearch.toLowerCase()}%`,
      };
    }

    return em.find(MediaItem, where as FilterQuery<MediaItem>, {
      limit: clampedLimit,
      offset: clampedOffset,
      overfetch: true,
    });
  }

  @Query(() => LibraryCounts, {
    description:
      "Aggregate counts across the media library, partitioned by `MediaItem.type`. Useful for dashboards and health checks.",
  })
  async libraryCounts(
    @CoreContext() { em }: CoreContext,
  ): Promise<LibraryCounts> {
    const [movies, shows, seasons, episodes] = await Promise.all([
      em.count(MediaItem, { type: MediaItemType.enum.movie }),
      em.count(MediaItem, { type: MediaItemType.enum.show }),
      em.count(MediaItem, { type: MediaItemType.enum.season }),
      em.count(MediaItem, { type: MediaItemType.enum.episode }),
    ]);

    return {
      movies,
      shows,
      seasons,
      episodes,
      total: movies + shows + seasons + episodes,
    };
  }

  @FieldResolver(() => Int)
  expectedFileCount() {
    throw new Error(
      "expectedFileCount field resolver must be implemented in child resolvers",
    );
  }
}
