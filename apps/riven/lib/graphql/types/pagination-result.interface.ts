import { Field, Int, InterfaceType } from "type-graphql";

@InterfaceType()
export class PaginationResult {
  @Field(() => Int)
  public totalCount!: number;

  @Field(() => Int)
  public length!: number;

  @Field(() => String, { nullable: true })
  public startCursor!: string | null;

  @Field(() => String, { nullable: true })
  public endCursor!: string | null;

  @Field(() => Boolean)
  public hasNextPage!: boolean;

  @Field(() => Boolean)
  public hasPrevPage!: boolean;
}
