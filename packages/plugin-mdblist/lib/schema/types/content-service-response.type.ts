import {
  ContentServiceRequestedMoviesResponse,
  ContentServiceRequestedShowsResponse,
} from "@repo/util-plugin-sdk/schemas/events/content-service-requested.event";

import { Field, ObjectType } from "type-graphql";

import { MdbListExternalIds } from "./external-ids.type.ts";

@ObjectType()
export class MdblistContentServiceResponse {
  @Field((_type) => [MdbListExternalIds])
  movies!: ContentServiceRequestedMoviesResponse[];

  @Field((_type) => [MdbListExternalIds])
  shows!: ContentServiceRequestedShowsResponse[];
}
