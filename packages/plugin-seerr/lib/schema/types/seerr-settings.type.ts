import { Field, ObjectType, registerEnumType } from "type-graphql";

import { getRequestQueryParamsFilterEnum } from "../../__generated__/types/GetRequest.ts";

registerEnumType(getRequestQueryParamsFilterEnum, {
  name: "SeerrRequestFilter",
  description: "Request status filter for Seerr settings",
});

@ObjectType()
export class SeerrSettings {
  @Field()
  public apiKey!: string;

  @Field()
  public url!: string;

  @Field(() => getRequestQueryParamsFilterEnum)
  public filter!: string;
}
