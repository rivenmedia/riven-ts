import { Field, Float, ID, InterfaceType } from "type-graphql";

import { MediaItemType } from "../enums/media-item-type.enum.ts";
import { Genre } from "./genre.type.ts";
import { Ratings } from "./ratings.type.ts";

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
  @Field(() => String, { nullable: true })
  public logoUrl?: string | null;

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
}
