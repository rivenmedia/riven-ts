import { ArgsType, Field, Int } from "type-graphql";

@ArgsType()
export class PaginationArgs {
  @Field(() => String, { nullable: true })
  public before: string | null = null;

  @Field(() => String, { nullable: true })
  public after: string | null = null;

  @Field(() => Int, { defaultValue: 25 })
  public itemsPerPage!: number;
}
