import { Field, ObjectType, registerEnumType } from "type-graphql";

import { getRequestQueryParamsFilterEnum } from "../../__generated__/index.ts";

registerEnumType(getRequestQueryParamsFilterEnum, {
  name: "SeerrRequestFilter",
  description: "Request status filter for Seerr settings",
});

@ObjectType()
export class SeerrSettings {
  @Field()
  apiKey!: string;

  @Field()
  url!: string;

  @Field(() => getRequestQueryParamsFilterEnum)
  filter!: string;
}
