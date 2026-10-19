import { Field, Float, Int, InterfaceType } from "type-graphql";

import { IndexerDataStatus } from "../enums/indexer-data-status.enum.ts";
import { TopLevelMediaItemType } from "../enums/top-level-media-item-type.enum.ts";
import { CastMember } from "./cast-member.type.ts";
import { Genre } from "./genre.type.ts";
import { IndexerBaseItem } from "./indexer-base-item.type.ts";
import { IndexerSeason } from "./indexer-season.type.ts";
import { ItemImage } from "./item-image.type.ts";
import { ProductionCompany } from "./production-company.type.ts";
import { Ratings } from "./ratings.type.ts";
import { SpokenLanguage } from "./spoken-language.type.ts";
import { Trailer } from "./trailer.type.ts";

import type { Duration } from "luxon";

/**
 * Represents a media item returned from an indexer.
 *
 * This is intended to be extended by each indexer's implementation.
 *
 * @example
 * ```ts
 * ⁣@ObjectType({ implements: IndexerData })
 * class MyIndexerData implements IndexerData {
 *  // Implement the required fields from IndexerData here.
 * }
 * ```
 *
 */
@InterfaceType({
  description: "Represents a media item returned from an indexer.",
  implements: IndexerBaseItem,
})
export abstract class IndexerData extends IndexerBaseItem {
  /**
   * The overview or summary of the media item.
   */
  @Field()
  public overview!: string;

  /**
   * The URL of the backdrop image for the media item.
   */
  @Field(() => String, { nullable: true })
  public backdropUrl?: string | null;

  /**
   * The URL of the logo image for the media item.
   */
  @Field(() => ItemImage, { nullable: true })
  public logo?: ItemImage | null;

  /**
   * The language of the media item.
   */
  @Field(() => String, { nullable: true })
  public language?: string | null;

  /**
   * The release date of the media item, or null if the item is not released.
   */
  @Field(() => Date, { nullable: true })
  public releaseDate?: Date | null;

  /**
   * The genres associated with the media item.
   *
   * @see {Genre}
   */
  @Field(() => [Genre])
  public genres!: Genre[];

  @Field(() => Float, { nullable: true })
  public voteAverage?: number | null;

  /**
   * The certification of the media item.
   *
   * @example PG-13
   */
  @Field(() => String, { nullable: true })
  public certification?: string | null;

  @Field(() => Ratings, { nullable: true })
  public ratings?: Ratings | null;

  @Field(() => TopLevelMediaItemType.enum)
  public type!: TopLevelMediaItemType;

  /**
   * Whether the media item can be requested in Riven.
   *
   * Items are not requestable when the indexer cannot provide the external ID
   * that Riven uses to request that media type, e.g. a show without a TVDB ID.
   */
  @Field()
  public isRequestable!: boolean;

  @Field(() => Int, { nullable: true })
  public get year() {
    if (!this.releaseDate) {
      return null;
    }

    return this.releaseDate.getFullYear();
  }

  @Field(() => Trailer, { nullable: true })
  public trailer?: Trailer | null;

  @Field(() => [IndexerData], { nullable: true })
  public recommendations?: IndexerData[] | null;

  @Field(() => [IndexerData], { nullable: true })
  public similarItems?: IndexerData[] | null;

  @Field(() => [CastMember], { nullable: true })
  public cast?: CastMember[] | null;

  /**
   * Used to calculate the formatted runtime
   *
   * @internal
   */
  public rawRuntime?: Duration | null;

  @Field(() => String, { nullable: true })
  public get runtime() {
    if (!this.rawRuntime) {
      return null;
    }

    return this.rawRuntime.toHuman();
  }

  @Field(() => IndexerDataStatus.out.unwrap().enum)
  public status!: IndexerDataStatus;

  @Field(() => Int, { nullable: true })
  public budget?: number | null;

  @Field(() => Int, { nullable: true })
  public revenue?: number | null;

  @Field(() => [String], { nullable: true })
  public originCountry?: string[] | null;

  @Field(() => [SpokenLanguage], { nullable: true })
  public spokenLanguages?: SpokenLanguage[] | null;

  @Field(() => [ProductionCompany], { nullable: true })
  public productionCompanies?: ProductionCompany[] | null;

  @Field(() => String, { nullable: true })
  public homepage?: string | null;

  @Field(() => String, { nullable: true })
  public imdbId?: string | null;

  @Field(() => [IndexerSeason], { nullable: true })
  public seasons?: IndexerSeason[] | null;
}
