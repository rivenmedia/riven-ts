import { IndexerData } from "@repo/util-plugin-sdk/dto/types/indexer-data.type";

import { Field, ID, ObjectType } from "type-graphql";

import type { MediaItemType } from "@repo/util-plugin-sdk/dto/enums/media-item-type.enum";
import type { Genre } from "@repo/util-plugin-sdk/dto/types/genre.type";

@ObjectType({ implements: IndexerData })
export class TmdbIndexerData implements IndexerData {
  @Field(() => ID)
  public id!: string;

  @Field()
  public title!: string;

  @Field()
  public overview!: string;

  @Field(() => String, { nullable: true })
  public posterUrl?: string | null;

  @Field()
  public backdropUrl!: string;

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

  public type!: Extract<MediaItemType, "movie">;

  public imdbId?: string | null;
}
