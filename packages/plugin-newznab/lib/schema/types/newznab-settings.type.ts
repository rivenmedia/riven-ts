import { BigIntResolver } from "graphql-scalars";
import { Field, Int, ObjectType } from "type-graphql";

@ObjectType()
export class NewznabSettings {
  @Field()
  indexerUrl!: string;

  @Field()
  apiKey!: string;

  // GraphQL Int is 32-bit signed (max ~2.1B); 100 GB (107_374_182_400) overflows
  // it. We follow the SDK pattern (filesystem-entry.entity.ts FileSize) and use
  // BigIntResolver, which serialises as a string and safely represents the full
  // 64-bit range that NZB file sizes can reach.
  @Field(() => BigIntResolver)
  minSizeBytes!: number;

  @Field(() => BigIntResolver)
  maxSizeBytes!: number;

  @Field(() => [Int])
  movieCategories!: number[];

  @Field(() => [Int])
  tvCategories!: number[];
}
