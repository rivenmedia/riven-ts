import { ArrayUnique, Length } from "class-validator";
import { ArgsType, Field } from "type-graphql";

@ArgsType()
export class ListIdsArguments {
  @Field(() => [String])
  @Length(24, 24, {
    each: true,
  })
  @ArrayUnique()
  listIds!: string[];
}
