import { Field, Int, InterfaceType } from "type-graphql";

@InterfaceType()
export class PaginationResult {
  @Field(() => Int)
  totalCount!: number;

  @Field(() => Int)
  length!: number;

  @Field(() => String, { nullable: true })
  startCursor!: string | null;

  @Field(() => String, { nullable: true })
  endCursor!: string | null;

  @Field(() => Boolean)
  hasNextPage!: boolean;

  @Field(() => Boolean)
  hasPrevPage!: boolean;
}
