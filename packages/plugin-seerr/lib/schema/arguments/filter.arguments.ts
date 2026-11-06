import { ArgsType, Field, registerEnumType } from "type-graphql";

import { getRequestQueryParamsFilterEnum } from "../../__generated__/types/index.ts";

import type { GetRequestQueryParamsFilterEnumKey } from "../../__generated__/types/index.ts";

registerEnumType(getRequestQueryParamsFilterEnum, {
  name: "SeerrRequestFilter",
  description: "Request status filter for Seerr settings",
});

@ArgsType()
export class FilterArguments {
  @Field(() => getRequestQueryParamsFilterEnum, {
    defaultValue: "approved",
  })
  public filter!: GetRequestQueryParamsFilterEnumKey;
}
