import { ArrayUnique } from "class-validator";
import { ArgsType, Field } from "type-graphql";

@ArgsType()
export class ListIdsArguments {
  @Field(() => [String])
  @ArrayUnique()
  listIds!: string[];
}
