import { ArrayUnique, Contains } from "class-validator";
import { ArgsType, Field } from "type-graphql";

@ArgsType()
export class ListNamesArguments {
  @Field((_type) => [String])
  @Contains("/", {
    each: true,
  })
  @ArrayUnique()
  listNames!: string[];
}
