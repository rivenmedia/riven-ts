import { Field, Int, ObjectType } from "type-graphql";

/**
 * Aggregate counts across the media library, partitioned by `MediaItem.type`.
 *
 * `total` is the sum of all type-buckets (which equals `em.count(MediaItem)`
 * because the entity uses single-table inheritance keyed on `type`).
 */
@ObjectType({
  description:
    "Aggregate counts across the media library, partitioned by MediaItem type.",
})
export class LibraryCounts {
  @Field(() => Int)
  movies!: number;

  @Field(() => Int)
  shows!: number;

  @Field(() => Int)
  seasons!: number;

  @Field(() => Int)
  episodes!: number;

  @Field(() => Int)
  total!: number;
}
