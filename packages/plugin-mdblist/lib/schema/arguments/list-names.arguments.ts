import { ArrayUnique, Matches } from "class-validator";
import { ArgsType, Field } from "type-graphql";

@ArgsType()
export class ListNamesArguments {
  @Field((_type) => [String])
  @Matches(/^[^/]+\/[^/]+$/, {
    each: true,
    message: "Each list name must be in the format {username}/{listname}",
  })
  @ArrayUnique()
  listNames!: string[];
}
