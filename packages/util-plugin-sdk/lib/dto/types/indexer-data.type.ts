import { Field, Float, ID, Int, InterfaceType } from "type-graphql";

import { IndexerDataStatus } from "../enums/indexer-data-status.enum.ts";
import { MediaItemType } from "../enums/media-item-type.enum.ts";
import { CastMember } from "./cast-member.type.ts";
import { Genre } from "./genre.type.ts";
import { ItemImage } from "./item-image.type.ts";
import { Ratings } from "./ratings.type.ts";
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
})
export abstract class IndexerData {
  /**
   * The unique identifier for the media item on the indexer.
   */
  @Field(() => ID)
  public id!: string;

  /**
   * The title of the media item.
   */
  @Field()
  public title!: string;

  /**
   * The overview or summary of the media item.
   */
  @Field()
  public overview!: string;

  /**
   * The URL of the poster image for the media item.
   */
  @Field(() => String, { nullable: true })
  public posterUrl?: string | null;

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

  @Field(() => MediaItemType.enum)
  public type!: MediaItemType;

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
}
