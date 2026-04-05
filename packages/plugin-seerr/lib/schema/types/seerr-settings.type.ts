import { Field, ObjectType, registerEnumType } from "type-graphql";

import {
  type GetRequestQueryParamsFilterEnumKey,
  getRequestQueryParamsFilterEnum,
} from "../../__generated__/index.ts";

registerEnumType(getRequestQueryParamsFilterEnum, {
  name: "SeerrRequestFilter",
  description: "Request status filter for Seerr settings",
});

@ObjectType()
export class SeerrSettings {
  @Field(() => String)
  apiKey!: string;

  @Field(() => String)
  url!: string;

  @Field(() => getRequestQueryParamsFilterEnum)
  filter!: GetRequestQueryParamsFilterEnumKey;
}
