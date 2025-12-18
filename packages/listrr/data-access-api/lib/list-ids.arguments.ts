import { Length, Min } from "class-validator";
import { ArgsType, Field } from "type-graphql";

@ArgsType()
export class ListIdsArguments {
  @Field()
  @Length(24, 24)
  listId!: string;

  @Field()
  @Min(1)
  page: number = 1;
}
