import { Field, ObjectType } from "type-graphql";

import { MdbListExternalIds } from "./mdblist-external-ids.type.ts";

@ObjectType()
export class MdblistContentServiceResponse {
  @Field(() => [MdbListExternalIds])
  movies!: MdbListExternalIds[];

  @Field(() => [MdbListExternalIds])
  shows!: MdbListExternalIds[];
}
