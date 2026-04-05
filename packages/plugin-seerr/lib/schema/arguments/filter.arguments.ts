import { ArgsType, Field } from "type-graphql";

import { getRequestQueryParamsFilterEnum } from "../../__generated__/types/GetRequest.ts";

@ArgsType()
export class FilterArguments {
  @Field(() => getRequestQueryParamsFilterEnum, {
    defaultValue: "approved",
  })
  filter!: string;
}
