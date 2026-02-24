import { ArgsType, Field } from "type-graphql";

import { getRequestQueryParamsFilterEnum } from "../../__generated__/types/index.ts";

@ArgsType()
export class FilterArguments {
  @Field(() => getRequestQueryParamsFilterEnum, {
    defaultValue: "approved",
  })
  filter!: string;
}
