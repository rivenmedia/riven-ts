import { ItemRequest } from "@repo/util-plugin-sdk/dto/entities";

import { Field, Int, ObjectType } from "type-graphql";

@ObjectType()
export class RequestItemsResult {
  @Field(() => Int)
  count!: number;

  @Field(() => [ItemRequest])
  newItems!: ItemRequest[];

  @Field(() => [ItemRequest])
  updatedItems!: ItemRequest[];
}
