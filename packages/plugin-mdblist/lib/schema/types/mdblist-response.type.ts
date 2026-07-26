import { Field, ObjectType } from "type-graphql";

import { MdbListExternalIds } from "./mdblist-external-ids.type.ts";

@ObjectType()
export class MdblistContentServiceResponse {
  @Field(() => [MdbListExternalIds])
  public movies!: MdbListExternalIds[];

  @Field(() => [MdbListExternalIds])
  public shows!: MdbListExternalIds[];
}
