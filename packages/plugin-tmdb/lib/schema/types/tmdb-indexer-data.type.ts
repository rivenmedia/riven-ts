import { IndexerData } from "@repo/util-plugin-sdk/dto/types/indexer-data.type";

import { Field, ID, ObjectType } from "type-graphql";

import type { IndexerDataStatus } from "@repo/util-plugin-sdk/dto/enums/indexer-data-status.enum";
import type { MediaItemType } from "@repo/util-plugin-sdk/dto/enums/media-item-type.enum";
import type { Genre } from "@repo/util-plugin-sdk/dto/types/genre.type";
import type { ProductionCompany } from "@repo/util-plugin-sdk/dto/types/production-company.type";
import type { SpokenLanguage } from "@repo/util-plugin-sdk/dto/types/spoken-language.type";
import type { Duration } from "@repo/util-plugin-sdk/helpers/dates";

@ObjectType({ implements: IndexerData })
export class TmdbIndexerData implements Omit<IndexerData, "runtime" | "year"> {
  @Field(() => ID)
  public id!: string;

  @Field()
  public title!: string;

  @Field()
  public overview!: string;

  @Field(() => String, { nullable: true })
  public posterUrl?: string | null;

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
