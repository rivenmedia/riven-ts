import { ArgsType, Field } from "type-graphql";

@ArgsType()
export class FilterArguments {
  @Field({ defaultValue: "approved" })
  filter!: string;
}
