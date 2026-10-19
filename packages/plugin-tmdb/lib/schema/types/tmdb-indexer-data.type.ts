import { IndexerBaseItem } from "@repo/util-plugin-sdk/dto/types/indexer-base-item.type";
import { IndexerData } from "@repo/util-plugin-sdk/dto/types/indexer-data.type";

import { Field, ID, ObjectType } from "type-graphql";

import type { IndexerDataStatus } from "@repo/util-plugin-sdk/dto/enums/indexer-data-status.enum";
import type { MediaItemType } from "@repo/util-plugin-sdk/dto/enums/media-item-type.enum";
import type { Genre } from "@repo/util-plugin-sdk/dto/types/genre.type";
import type { ProductionCompany } from "@repo/util-plugin-sdk/dto/types/production-company.type";
import type { SpokenLanguage } from "@repo/util-plugin-sdk/dto/types/spoken-language.type";
import type { Duration } from "@repo/util-plugin-sdk/helpers/dates";

/**
 * A movie or show from TMDB.
 *
 * The `id` is the ID Riven uses to request the item:
 * - Movies: the TMDB ID
 * - Shows: the TVDB ID, or a namespaced TMDB ID (`tmdb-<id>`) when TMDB has no TVDB ID.
 *   These shows are surfaced for visibility, but are not requestable.
 *
 * TMDB lookups must always use {@link TmdbIndexerData.tmdbId}.
 */
@ObjectType({ implements: [IndexerData, IndexerBaseItem] })
export class TmdbIndexerData
  extends IndexerBaseItem
  implements Omit<IndexerData, keyof IndexerBaseItem | "runtime" | "year">
{
  @Field(() => ID)
  public tmdbId!: string;

  @Field(() => ID, { nullable: true })
  public tvdbId?: string | null;

  @Field()
  public overview!: string;

  @Field(() => String, { nullable: true })
  public backdropUrl?: string | null;

  public logoUrl?: string | null;

  @Field(() => String, { nullable: true })
  public language?: string | null;

  @Field(() => Date, { nullable: true })
  public releaseDate?: Date | null;

  public genres!: Genre[];

  /**
   * TMDB may return genres as an array of integers
   * which must then be resolved to localised {@link Genre} objects.
   */
  public genreIds?: number[];

  public certification?: string | null;

  public type!: Extract<MediaItemType, "movie" | "show">;

  public isRequestable!: boolean;

  public imdbId?: string | null;

  public rawRuntime!: Duration | null;

  public status!: IndexerDataStatus;

  public budget?: number | null;

  public revenue?: number | null;

  public homepage?: string | null;

  public spokenLanguages?: SpokenLanguage[] | null;

  public productionCompanies?: ProductionCompany[] | null;

  public originCountry?: string[] | null;
}
