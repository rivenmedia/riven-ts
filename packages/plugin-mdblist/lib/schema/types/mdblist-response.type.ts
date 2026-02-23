import { Field, ObjectType } from "type-graphql";

import { MdbListExternalIds } from "./mdblist-external-ids.type.ts";

@ObjectType()
export class MdblistContentServiceResponse {
  @Field((_type) => [MdbListExternalIds])
  movies!: MdbListExternalIds[];

  @Field((_type) => [MdbListExternalIds])
  shows!: MdbListExternalIds[];
}
